import { useState, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
 *  LIAR'S DICE — GAME ENGINE HOOK
 *  Self-contained game logic for the Liar's Dice mode.
 *  Designed to be protocol-agnostic: can run local (bots) or be replaced
 *  by WebSocket events for online multiplayer in the future.
 * ═══════════════════════════════════════════════════════════════════════════ */

// ─── Types ────────────────────────────────────────────────────────────────

export interface DicePlayer {
  id: number;
  name: string;
  isBot: boolean;
  dice: number[];        // Current dice values (hidden from others)
  diceCount: number;     // Remaining dice (starts at 5)
  isEliminated: boolean;
}

export interface Bid {
  playerId: number;
  playerName: string;
  quantity: number;
  face: number;          // 1-6
}

export interface RevealResult {
  type: "challenge" | "exact";
  challengerId: number;
  challengerName: string;
  bidderId: number;
  bidderName: string;
  bid: Bid;
  allDice: { playerId: number; playerName: string; dice: number[] }[];
  totalOfFace: number;
  loserId: number;
  loserName: string;
  exactWin?: boolean;     // Only for "exact" type
}

export type GamePhase =
  | "waiting"       // Lobby / not started
  | "rolling"       // Dice are being rolled (animation time)
  | "bidding"       // Players are making bids
  | "revealing"     // All dice revealed after challenge
  | "roundEnd"      // Brief pause showing result
  | "gameOver";     // Winner decided

export interface DiceGameState {
  players: DicePlayer[];
  currentBid: Bid | null;
  currentTurnIndex: number;
  phase: GamePhase;
  revealResult: RevealResult | null;
  winnerId: number | null;
  roundNumber: number;
  roundStarterIndex: number;
  actionLog: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}

function getNextAliveIndex(players: DicePlayer[], fromIndex: number): number {
  const n = players.length;
  let idx = (fromIndex + 1) % n;
  let safety = 0;
  while (players[idx].isEliminated && safety < n) {
    idx = (idx + 1) % n;
    safety++;
  }
  return idx;
}

function countAlive(players: DicePlayer[]): number {
  return players.filter(p => !p.isEliminated).length;
}

function isValidRaise(newBid: { quantity: number; face: number }, currentBid: Bid | null): boolean {
  if (!currentBid) return newBid.quantity >= 1 && newBid.face >= 1 && newBid.face <= 6;
  // Must increase: either quantity > current, or same quantity with higher face
  if (newBid.quantity > currentBid.quantity) return true;
  if (newBid.quantity === currentBid.quantity && newBid.face > currentBid.face) return true;
  return false;
}

// ─── Bot AI ───────────────────────────────────────────────────────────────

function botDecide(
  bot: DicePlayer,
  currentBid: Bid | null,
  totalDiceInPlay: number
): { action: "raise"; quantity: number; face: number } | { action: "challenge" } | { action: "exact" } {
  // Counts of bot's own dice
  const counts = [0, 0, 0, 0, 0, 0, 0]; 
  bot.dice.forEach(d => counts[d]++);
  let bestFace = 1;
  let bestCount = -1;
  for (let f = 1; f <= 6; f++) {
    if (counts[f] > bestCount) { bestCount = counts[f]; bestFace = f; }
  }

  if (!currentBid) {
    // First bid: Estimate total: bot's count + expected from others (1/6 of others)
    const otherDice = totalDiceInPlay - bot.diceCount;
    const estimated = bestCount + Math.floor(otherDice / 6);
    return { action: "raise", quantity: Math.max(1, estimated), face: bestFace };
  }

  // Analyze probability using z-score (normal distribution approximation to binomial)
  const myCountOfFace = counts[currentBid.face];
  const otherDice = totalDiceInPlay - bot.diceCount;
  const needed = currentBid.quantity - myCountOfFace;
  const expectedFromOthers = otherDice / 6;
  
  // Standard deviation for binomial distribution: sqrt(n * p * q)
  const stdDev = Math.sqrt(otherDice * (1/6) * (5/6)) || 1;
  const zScore = (needed - expectedFromOthers) / stdDev;

  // 1. Exact check: if the bid is statistically perfect or exactly matches bot's known state
  // Only trigger sparingly (20% chance) so they don't abuse it.
  if (Math.abs(zScore) < 0.5 && needed >= 0 && Math.random() < 0.20) {
    return { action: "exact" };
  }

  // 2. Challenge logic:
  // If zScore > threshold, the bid is statically highly unlikely.
  // A threshold of 1.2 to 2.2 means depending on the bot's risk tolerance this turn, 
  // it will challenge if the bid exceeds 1.2 to 2.2 standard deviations.
  const challengeThreshold = 1.2 + Math.random(); 
  if (zScore > challengeThreshold || needed > otherDice) {
    return { action: "challenge" };
  }

  // 3. Raise logic:
  // If the situation is believable, raise the bid.
  // Prioritize the face the bot has the most of.
  if (bestFace > currentBid.face) {
    // We can keep the same quantity and safely increase the face
    return { action: "raise", quantity: currentBid.quantity, face: bestFace };
  } else {
    // We must increase the quantity.
    // If the bot has a lot of a specific face, this is safer.
    return { action: "raise", quantity: currentBid.quantity + 1, face: bestFace };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useDiceGame() {
  const [state, setState] = useState<DiceGameState>({
    players: [],
    currentBid: null,
    currentTurnIndex: 0,
    phase: "waiting",
    revealResult: null,
    winnerId: null,
    roundNumber: 0,
    roundStarterIndex: 0,
    actionLog: [],
  });

  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Log helper ─────────────────────────────────────────────────────
  const addLog = useCallback((msg: string) => {
    setState(prev => ({
      ...prev,
      actionLog: [...prev.actionLog.slice(-30), msg],
    }));
  }, []);

  // ─── Initialize game with player list ───────────────────────────────
  const initGame = useCallback((playerConfigs: { name: string; isBot: boolean }[]) => {
    const players: DicePlayer[] = playerConfigs.map((cfg, idx) => ({
      id: idx,
      name: cfg.name,
      isBot: cfg.isBot,
      dice: [],
      diceCount: 5,
      isEliminated: false,
    }));

    setState({
      players,
      currentBid: null,
      currentTurnIndex: 0,
      phase: "waiting",
      revealResult: null,
      winnerId: null,
      roundNumber: 0,
      roundStarterIndex: 0,
      actionLog: [`Jogo iniciado com ${players.length} jogadores.`],
    });
  }, []);

  // ─── Roll all dice (start of round) ─────────────────────────────────
  const startRound = useCallback(() => {
    setState(prev => {
      const players = prev.players.map(p =>
        p.isEliminated ? p : { ...p, dice: rollDice(p.diceCount) }
      );

      const starter = getNextAliveIndex(players, prev.roundStarterIndex === 0 && prev.roundNumber === 0
        ? players.length - 1  // First round: start from player 0
        : prev.roundStarterIndex);

      return {
        ...prev,
        players,
        currentBid: null,
        currentTurnIndex: starter,
        phase: "rolling",
        revealResult: null,
        roundNumber: prev.roundNumber + 1,
        roundStarterIndex: starter,
        actionLog: [...prev.actionLog.slice(-30), `═══ RODADA ${prev.roundNumber + 1} ═══ Dados rolados!`],
      };
    });

    // After rolling animation, transition to bidding
    setTimeout(() => {
      setState(prev => {
        const newState = { ...prev, phase: "bidding" as GamePhase };
        return newState;
      });
    }, 1500);
  }, []);

  // ─── Total dice in play ─────────────────────────────────────────────
  const getTotalDiceInPlay = useCallback(() => {
    return state.players.reduce((sum, p) => sum + (p.isEliminated ? 0 : p.diceCount), 0);
  }, [state.players]);

  // ─── Schedule bot turn ──────────────────────────────────────────────
  const scheduleBotTurn = useCallback((stateSnapshot: DiceGameState) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);

    const currentPlayer = stateSnapshot.players[stateSnapshot.currentTurnIndex];
    if (!currentPlayer || !currentPlayer.isBot || currentPlayer.isEliminated) return;
    if (stateSnapshot.phase !== "bidding") return;

    const totalDice = stateSnapshot.players.reduce((s, p) => s + (p.isEliminated ? 0 : p.diceCount), 0);
    const delay = 1200 + Math.random() * 1200; // 1.2-2.4s thinking time

    botTimeoutRef.current = setTimeout(() => {
      const decision = botDecide(currentPlayer, stateSnapshot.currentBid, totalDice);

      if (decision.action === "raise") {
        // Validate the raise is legal
        let qty = decision.quantity;
        let face = decision.face;
        if (stateSnapshot.currentBid && !isValidRaise({ quantity: qty, face }, stateSnapshot.currentBid)) {
          // Fallback: just increase quantity by 1
          qty = stateSnapshot.currentBid.quantity + 1;
          face = stateSnapshot.currentBid.face;
        }
        placeBidInternal(currentPlayer.id, qty, face);
      } else if (decision.action === "challenge") {
        challengeInternal(currentPlayer.id);
      } else if (decision.action === "exact") {
        callExactInternal(currentPlayer.id);
      }
    }, delay);
  }, []);

  // ─── Place bid (internal, works for both human and bot) ─────────────
  const placeBidInternal = useCallback((playerId: number, quantity: number, face: number) => {
    setState(prev => {
      const player = prev.players[playerId];
      if (!player || player.isEliminated || prev.phase !== "bidding") return prev;
      if (prev.currentTurnIndex !== playerId) return prev;

      if (!isValidRaise({ quantity, face }, prev.currentBid)) return prev;

      const newBid: Bid = {
        playerId,
        playerName: player.name,
        quantity,
        face,
      };

      const nextTurn = getNextAliveIndex(prev.players, playerId);
      const newLog = [...prev.actionLog.slice(-30),
        `${player.name} aposta: ${quantity} dados de ${face}`
      ];

      const newState: DiceGameState = {
        ...prev,
        currentBid: newBid,
        currentTurnIndex: nextTurn,
        actionLog: newLog,
      };

      // Schedule bot turn if next player is bot
      const nextPlayer = prev.players[nextTurn];
      if (nextPlayer && nextPlayer.isBot && !nextPlayer.isEliminated) {
        setTimeout(() => scheduleBotTurn(newState), 100);
      }

      return newState;
    });
  }, [scheduleBotTurn]);

  // ─── Challenge (internal) ───────────────────────────────────────────
  const challengeInternal = useCallback((challengerId: number) => {
    setState(prev => {
      if (!prev.currentBid || prev.phase !== "bidding") return prev;
      const challenger = prev.players[challengerId];
      if (!challenger || challenger.isEliminated) return prev;

      const bid = prev.currentBid;
      const bidder = prev.players[bid.playerId];

      // Count total of the bid face across ALL players
      const allDice = prev.players
        .filter(p => !p.isEliminated)
        .map(p => ({ playerId: p.id, playerName: p.name, dice: [...p.dice] }));

      const totalOfFace = allDice.reduce((sum, pd) =>
        sum + pd.dice.filter(d => d === bid.face).length, 0);

      // If total >= bid quantity → bid was TRUE → challenger loses
      // If total < bid quantity → bid was FALSE → bidder loses
      const bidWasTrue = totalOfFace >= bid.quantity;
      const loserId = bidWasTrue ? challengerId : bid.playerId;
      const loserName = prev.players[loserId].name;

      const result: RevealResult = {
        type: "challenge",
        challengerId,
        challengerName: challenger.name,
        bidderId: bid.playerId,
        bidderName: bidder.name,
        bid,
        allDice,
        totalOfFace,
        loserId,
        loserName,
      };

      return {
        ...prev,
        phase: "revealing",
        revealResult: result,
        actionLog: [...prev.actionLog.slice(-30),
          `⚡ ${challenger.name} chama MENTIROSO!`,
          `Revelação: ${totalOfFace}x dado(s) de ${bid.face} (aposta: ${bid.quantity})`,
          `${loserName} perde um dado!`,
        ],
      };
    });
  }, []);

  // ─── Call Exact (internal) ──────────────────────────────────────────
  const callExactInternal = useCallback((callerId: number) => {
    setState(prev => {
      if (!prev.currentBid || prev.phase !== "bidding") return prev;
      const caller = prev.players[callerId];
      if (!caller || caller.isEliminated) return prev;

      const bid = prev.currentBid;
      const bidder = prev.players[bid.playerId];

      const allDice = prev.players
        .filter(p => !p.isEliminated)
        .map(p => ({ playerId: p.id, playerName: p.name, dice: [...p.dice] }));

      const totalOfFace = allDice.reduce((sum, pd) =>
        sum + pd.dice.filter(d => d === bid.face).length, 0);

      const isExact = totalOfFace === bid.quantity;

      // If exact → all OTHERS lose 1 die; loserId = -1 (special)
      // If not exact → caller loses 1 die
      const result: RevealResult = {
        type: "exact",
        challengerId: callerId,
        challengerName: caller.name,
        bidderId: bid.playerId,
        bidderName: bidder.name,
        bid,
        allDice,
        totalOfFace,
        loserId: isExact ? -1 : callerId, // -1 = all others lose
        loserName: isExact ? "TODOS OS OUTROS" : caller.name,
        exactWin: isExact,
      };

      return {
        ...prev,
        phase: "revealing",
        revealResult: result,
        actionLog: [...prev.actionLog.slice(-30),
          `🎯 ${caller.name} declara EXATO!`,
          `Revelação: ${totalOfFace}x dado(s) de ${bid.face} (aposta: ${bid.quantity})`,
          isExact
            ? `EXATO! Todos os outros perdem um dado!`
            : `Errou! ${caller.name} perde um dado!`,
        ],
      };
    });
  }, []);

  // ─── Apply round result (after reveal animation) ────────────────────
  const applyRoundResult = useCallback(() => {
    setState(prev => {
      if (!prev.revealResult) return prev;
      const result = prev.revealResult;

      let players = prev.players.map(p => ({ ...p }));

      if (result.type === "exact" && result.loserId === -1) {
        // Exact win: all others lose 1 die
        players = players.map(p => {
          if (p.isEliminated || p.id === result.challengerId) return p;
          const newCount = p.diceCount - 1;
          return {
            ...p,
            diceCount: newCount,
            isEliminated: newCount <= 0,
          };
        });
      } else {
        // Normal: one player loses 1 die
        players = players.map(p => {
          if (p.id !== result.loserId) return p;
          const newCount = p.diceCount - 1;
          return {
            ...p,
            diceCount: newCount,
            isEliminated: newCount <= 0,
          };
        });
      }

      const alive = countAlive(players);
      if (alive <= 1) {
        const winner = players.find(p => !p.isEliminated);
        return {
          ...prev,
          players,
          phase: "gameOver" as GamePhase,
          winnerId: winner ? winner.id : null,
          actionLog: [...prev.actionLog.slice(-30),
            `🏆 ${winner?.name || "?"} VENCEU O JOGO!`
          ],
        };
      }

      // Determine who starts next round (the loser of this round, if still alive)
      const loserIdx = result.type === "exact" && result.loserId === -1
        ? result.challengerId  // Exact winner starts next
        : result.loserId;

      return {
        ...prev,
        players,
        phase: "roundEnd" as GamePhase,
        roundStarterIndex: players[loserIdx]?.isEliminated
          ? getNextAliveIndex(players, loserIdx)
          : loserIdx,
        actionLog: prev.actionLog,
      };
    });
  }, []);

  // ─── Public actions for human player ────────────────────────────────

  const placeBid = useCallback((quantity: number, face: number) => {
    const humanIdx = state.currentTurnIndex;
    const humanPlayer = state.players[humanIdx];
    if (!humanPlayer || humanPlayer.isBot) return;
    placeBidInternal(humanIdx, quantity, face);
  }, [state.currentTurnIndex, state.players, placeBidInternal]);

  const challenge = useCallback(() => {
    const humanIdx = state.currentTurnIndex;
    const humanPlayer = state.players[humanIdx];
    if (!humanPlayer || humanPlayer.isBot) return;
    challengeInternal(humanIdx);
  }, [state.currentTurnIndex, state.players, challengeInternal]);

  const callExact = useCallback(() => {
    const humanIdx = state.currentTurnIndex;
    const humanPlayer = state.players[humanIdx];
    if (!humanPlayer || humanPlayer.isBot) return;
    callExactInternal(humanIdx);
  }, [state.currentTurnIndex, state.players, callExactInternal]);

  // ─── Trigger bot if it's their turn after phase change ──────────────
  const triggerBotIfNeeded = useCallback(() => {
    if (state.phase === "bidding") {
      const currentPlayer = state.players[state.currentTurnIndex];
      if (currentPlayer && currentPlayer.isBot && !currentPlayer.isEliminated) {
        scheduleBotTurn(state);
      }
    }
  }, [state, scheduleBotTurn]);

  // ─── Computed values ────────────────────────────────────────────────
  const currentPlayer = state.players[state.currentTurnIndex] || null;
  const isHumanTurn = currentPlayer ? !currentPlayer.isBot && !currentPlayer.isEliminated : false;
  const totalDiceInPlay = getTotalDiceInPlay();
  const humanPlayer = state.players.find(p => !p.isBot && !p.isEliminated) || null;

  return {
    state,
    currentPlayer,
    isHumanTurn,
    totalDiceInPlay,
    humanPlayer,
    initGame,
    startRound,
    placeBid,
    challenge,
    callExact,
    applyRoundResult,
    triggerBotIfNeeded,
    isValidRaise: (qty: number, face: number) => isValidRaise({ quantity: qty, face }, state.currentBid),
  };
}

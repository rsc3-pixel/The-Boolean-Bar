import { useEffect, useRef, useState, useCallback } from "react";

// ─── Boolean Bar (modo lógico) ───────────────────────────────────────────────

/** Estado público de um jogador recebido via JSON_STATE do engine. */
export interface PlayerState {
  /** Nome do jogador. */
  name: string;
  /** true enquanto o jogador estiver vivo na partida. */
  alive: boolean;
  /** Quantidade de cartas na mão. */
  cards: number;
  /** Vidas restantes (balas no tambor define o risco da roleta). */
  lives: number;
}

/** Snapshot completo do estado da mesa, emitido pelo engine a cada turno. */
export interface GameState {
  /** Lista de todos os jogadores e seus estados. */
  players: PlayerState[];
  /** Cartas (fórmulas) na mão do jogador atual. */
  currentHand: string[];
  /** Índice (0-based) do jogador cujo turno está ativo. */
  turn: number;
  /** Número de balas no tambor da roleta. */
  bullets: number;
}

/** Dados do confronto lógico emitidos quando um jogador duvida de outro. */
export interface DoubtState {
  /** Nome do jogador que está duvidando. */
  caller: string;
  /** Nome do jogador que jogou a carta. */
  target: string;
  /** Fórmula da carta jogada. */
  card: string;
  /** Tipo declarado pelo jogador alvo (1=TAUTOLOGIA, 2=CONTRADIÇÃO, 3=CONTINGÊNCIA). */
  bluff: number;
}

/** Resultado do confronto lógico após avaliação pelo logic_engine. */
export interface DoubtResult {
  /** Nome do jogador que perdeu o confronto e vai para a roleta. */
  loser: string;
  /** true = o loser blefou; false = o oponente duvidou sem razão. */
  bluffed: boolean;
  /** Tipo real da fórmula: 0=TAUTOLOGIA, 1=CONTRADIÇÃO, 2=CONTINGÊNCIA. */
  realType: number;
}

/** Resultado da roleta russa após o confronto lógico. */
export interface RouletteResult {
  /** Nome do jogador que puxou o gatilho. */
  player: string;
  /** true = sobreviveu ao tiro; false = foi eliminado. */
  survived: boolean;
  /** Vidas restantes após a roleta. */
  lives: number;
  /** Balas no tambor após o disparo (incrementa a cada sobrevivência). */
  bullets: number;
}

/** Breakdown de pontuação de um jogador no fim da partida. */
export interface VictoryPlayerScore {
  /** Nome do jogador. */
  name: string;
  /** Pontuação total final (basePoints + bônus, com piso zero). */
  points: number;
  /** Pontos acumulados durante a partida, antes dos bônus de vitória. */
  basePoints: number;
  /** Bônus de vitória aplicado (0 para não-vencedores). */
  bonusVitoria: number;
  /** Bônus de vitória limpa (0 se perdeu vida/dado, 40 se manteve tudo). */
  bonusLimpo: number;
  /** Multiplicador de velocidade usado (×100): 200=blitz, 150=padrão, 100=resistência. */
  multiplier: number;
  /** Vidas restantes (modo Lógica). */
  livesLeft?: number;
  /** Dados restantes (modo Dice). */
  diceLeft?: number;
  /** true se este jogador venceu a partida. */
  isWinner: boolean;
}

/** Estado de vitória emitido quando restar apenas um jogador. */
export interface VictoryState {
  /** Nome do vencedor da partida. */
  winner: string;
  /** Total de jogadores que participaram da partida. */
  totalPlayers: number;
  /** Total de rodadas jogadas (usado pro multiplicador de velocidade). */
  totalRounds?: number;
  /** Modo de jogo: "logic" (Boolean Bar) ou "dice" (Liar's Dice). */
  mode?: "logic" | "dice";
  /** Pontuação final por jogador, com breakdown de bônus. */
  players?: VictoryPlayerScore[];
}

// ─── Liar's Dice (modo dados) ────────────────────────────────────────────────

/** Informações públicas de um jogador no modo Liar's Dice (visíveis a todos). */
export interface DicePlayerInfo {
  /** Nome do jogador. */
  name: string;
  /** true enquanto o jogador estiver na partida. */
  alive: boolean;
  /** Quantidade de dados que o jogador ainda possui. */
  dice_count: number;
}

/** Estado da mesa no modo Liar's Dice, emitido pelo server a cada turno. */
export interface DiceState {
  /** Lista de jogadores com informações públicas. */
  players: DicePlayerInfo[];
  /** Dados do próprio cliente (filtrados pelo server — os outros não veem). */
  myDice: number[];
  /** Quantidade apostada na aposta atual. */
  currentBetQty: number;
  /** Face apostada na aposta atual (1–6). */
  currentBetFace: number;
  /** ID do jogador que fez a última aposta. */
  lastBetPlayerId: number;
  /** Índice (0-based) do jogador cujo turno está ativo. */
  turn: number;
  /** Total de jogadores na partida. */
  totalPlayers: number;
}

/** Aposta feita por um jogador no modo Liar's Dice. */
export interface DiceBet {
  /** Nome do jogador que apostou. */
  caller: string;
  /** Quantidade de dados apostada. */
  qt: number;
  /** Face apostada (1–6). */
  face: number;
}

/** Evento de dúvida emitido quando um jogador questiona a aposta vigente. */
export interface DiceDoubt {
  /** Nome do jogador que duvidou. */
  caller: string;
  /** ID (0-based) do jogador cuja aposta está sendo questionada. */
  target_id: number;
}

/** Resultado do confronto após uma dúvida, com todos os dados revelados. */
export interface DiceReveal {
  /** Nome do jogador que duvidou. */
  doubter: string;
  /** Nome do jogador que fez a aposta questionada. */
  bettor: string;
  /** Quantidade apostada. */
  betQty: number;
  /** Face apostada. */
  betFace: number;
  /** Total real de dados com a face apostada (incluindo curingas). */
  totalReal: number;
  /** true = aposta era válida (doubter perde); false = era mentira (bettor perde). */
  betValid: boolean;
  /** Nome do jogador que perdeu um dado nesta rodada. */
  loser: string;
  /** Quantidade de dados que o loser tem após a penalidade. */
  loserDiceCount: number;
  /** true se o loser foi eliminado da partida nesta rodada. */
  eliminated: boolean;
  /** Todos os dados de todos os jogadores, revelados após o confronto. */
  allDice: number[][];
}

// ─── Leaderboard de vencedores (Capstone) ────────────────────────────────────

/** Entrada do leaderboard persistido pelo server. */
export interface LeaderboardEntry {
  /** Nome do jogador. */
  name: string;
  /** Total de vitórias. */
  wins: number;
  /** ISO timestamp da última vitória (desempate). */
  lastWin: string | null;
  /** Vitórias por modo. */
  modes: { logic: number; dice: number };
}

// ─── Salas ativas (Task 4.4) ──────────────────────────────────────────────────

export interface ActiveRoom {
  roomId: string;
  gameMode: "logic" | "dice";
  playerCount: number;
  gameStarted: boolean;
}

// ─── Log de jogadas (Capstone) ────────────────────────────────────────────────

/** Categoria de evento no log de jogadas (define o ícone/cor na UI). */
export type GameLogKind =
  | 'info'
  | 'doubt'
  | 'roulette_safe'
  | 'roulette_dead'
  | 'bet'
  | 'dice_doubt'
  | 'reveal'
  | 'victory';

/** Entrada do log de jogadas, acumulado durante a partida. */
export interface GameLogEntry {
  id: string;
  timestamp: number;
  kind: GameLogKind;
  text: string;
}

// ─── Multiplayer (Fase 2+) ────────────────────────────────────────────────────

/** Representa um jogador dentro de uma sala multiplayer. */
export interface RoomPlayer {
  /** ID único do jogador na sessão WebSocket. */
  playerId: string;
  /** Nome do jogador. */
  name: string;
  /** Posição do jogador na mesa (slot 0-based). */
  slot: number;
  /** true se este jogador é o dono da sala. */
  isHost: boolean;
  /** true se a conexão WebSocket do jogador está ativa. */
  connected: boolean;
  /** true se o jogador é um bot controlado pelo server. */
  isBot: boolean;
}

/** Snapshot do estado de uma sala multiplayer, enviado a todos os membros. */
export interface RoomSnapshot {
  /** Código identificador da sala. */
  roomId: string;
  /** ID do jogador que é o host. */
  hostId: string;
  /** true quando a partida já foi iniciada pelo host. */
  gameStarted: boolean;
  /** true quando apenas um jogador está na sala (modo solo com bots). */
  isSoloMode: boolean;
  /** Modo de jogo escolhido: 'logic' (Boolean Bar) ou 'dice' (Liar's Dice). */
  gameMode: 'logic' | 'dice';
  /** Lista de jogadores atualmente na sala. */
  players: RoomPlayer[];
}

/** Erro retornado pelo server em operações de sala. */
export interface RoomError {
  /** Código de erro legível por máquina (ex: "ROOM_NOT_FOUND"). */
  code: string;
  /** Mensagem de erro legível pelo usuário. */
  message: string;
}

/**
 * Hook principal para gerenciar a lógica de jogo e comunicação via WebSocket.
 * 
 * Este hook encapsula toda a conexão com o backend (web_server.js), 
 * gerencia os estados dos modos de jogo 'Boolean Bar' (lógica) e 'Liar's Dice' (dados),
 * e controla as salas multiplayer.
 * 
 * @returns {Object} Um objeto contendo estados do jogo, estados da sala e funções de ação.
 * @property {React.MutableRefObject<WebSocket | null>} wsRef - Referência para a conexão WebSocket ativa.
 * @property {Function} startGame - Inicia uma nova partida (modo solo/legacy).
 * @property {Function} sendInput - Envia entrada de texto diretamente para o engine C.
 * @property {Function} sendShutdown - Fecha a conexão e tenta encerrar a aba do usuário (Flee).
 * @property {string[]} cStdout - Histórico de mensagens recebidas da saída padrão do engine.
 * @property {GameState | null} gameState - Estado atual da partida de lógica (Boolean Bar).
 * @property {DoubtState | null} doubtState - Estado de uma dúvida pendente no modo lógica.
 * @property {DoubtResult | null} doubtResult - Resultado do julgamento de uma dúvida.
 * @property {RouletteResult | null} rouletteResult - Resultado de um disparo na roleta russa.
 * @property {VictoryState | null} victoryState - Estado final de vitória/encerramento.
 * @property {string} wsStatus - Status da conexão ("connecting", "connected", "disconnected").
 * @property {boolean} showDoubtOverlay - Controla a exibição do modal de julgamento.
 * @property {boolean} showRoulette - Controla a exibição do modal de roleta.
 * @property {boolean} showVictory - Controla a exibição da tela de vitória.
 * @property {RoomSnapshot | null} roomState - Dados da sala multiplayer atual.
 * @property {string | null} playerId - Identificador único do jogador na sessão.
 * @property {RoomError | null} roomError - Erro atual relacionado a operações de sala.
 * @property {boolean} gameStarting - Indica se a partida está prestes a começar.
 * @property {Function} createRoom - Cria uma nova sala multiplayer.
 * @property {Function} joinRoom - Entra em uma sala existente via código.
 * @property {Function} leaveRoom - Sai da sala atual e limpa a sessão.
 * @property {Function} startRoomGame - Inicia a partida para todos os jogadores na sala.
 * @property {Function} addBot - Adiciona um bot à sala (apenas host).
 * @property {Function} removeBot - Remove um bot específico da sala (apenas host).
 * @property {Function} clearRoomError - Limpa o estado de erro da sala.
 * @property {string[]} eliminationOrder - Lista de jogadores eliminados na ordem em que ocorreram.
 * @property {DiceState | null} diceState - Estado atual da partida de Liar's Dice.
 * @property {DiceBet | null} diceBet - Informações da última aposta feita no modo dados.
 * @property {DiceDoubt | null} diceDoubt - Informações de quem chamou a dúvida no modo dados.
 * @property {DiceReveal | null} diceReveal - Resultado da revelação de dados após uma dúvida.
 * @property {boolean} showDiceReveal - Controla a exibição do modal de revelação de dados.
 */
export function useGameEngine() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cStdout, setCStdout] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [doubtState, setDoubtState] = useState<DoubtState | null>(null);
  const [doubtResult, setDoubtResult] = useState<DoubtResult | null>(null);
  const [rouletteResult, setRouletteResult] = useState<RouletteResult | null>(null);
  const [victoryState, setVictoryState] = useState<VictoryState | null>(null);
  const [showDoubtOverlay, setShowDoubtOverlay] = useState(false);
  const [showRoulette, setShowRoulette] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  // ─── Room state (Phase 2) ──────────────────────────────────────────────────
  const [roomState, setRoomState] = useState<RoomSnapshot | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<RoomError | null>(null);
  const [gameStarting, setGameStarting] = useState(false);
  // Phase 5: ordem de eliminação (do primeiro a morrer ao último). Final ranking
  // = winner + reverse(eliminationOrder).
  const [eliminationOrder, setEliminationOrder] = useState<string[]>([]);

  // ─── Liar's Dice state ──────────────────────────────────────────────────
  const [diceState, setDiceState] = useState<DiceState | null>(null);
  const [diceBet, setDiceBet] = useState<DiceBet | null>(null);
  const [diceDoubt, setDiceDoubt] = useState<DiceDoubt | null>(null);
  const [diceReveal, setDiceReveal] = useState<DiceReveal | null>(null);
  const [showDiceReveal, setShowDiceReveal] = useState(false);

  // ─── Leaderboard (Capstone) ──────────────────────────────────────────────
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // ─── Salas ativas (Task 4.4) ────────────────────────────────────────────
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);

  // ─── Log de jogadas (Capstone) ───────────────────────────────────────────
  const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
  const logIdCounter = useRef(0);
  const pushLog = useCallback((kind: GameLogKind, text: string) => {
    setGameLog(prev => {
      const id = `log-${++logIdCounter.current}`;
      return [...prev, { id, timestamp: Date.now(), kind, text }];
    });
  }, []);
  const clearGameLog = useCallback(() => {
    setGameLog([]);
    logIdCounter.current = 0;
  }, []);

  const connect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    // Phase 5: em dev (Vite na 5173), conecta no ws://localhost:8080.
    // Em prod (servido pela mesma origin via nginx/HTTPS), usa o host atual
    // com wss:// — o reverse proxy roteia pro web_server.js.
    const wsUrl = import.meta.env.DEV
      ? "ws://localhost:8080"
      : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;

    console.log(`[WS] Tentando conectar ao Backend em ${wsUrl}...`);
    setWsStatus("connecting");

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("[WS] ✅ Conexão WebSocket ABERTA com sucesso!");
      setWsStatus("connected");

      // Phase 4: auto-reconnect se temos credentials no sessionStorage
      try {
        const storedPlayerId = sessionStorage.getItem('booleanbar_playerId');
        const storedRoomId = sessionStorage.getItem('booleanbar_roomId');
        if (storedPlayerId && storedRoomId) {
          console.log(`[WS] 🔄 Tentando reconnect: ${storedPlayerId}@${storedRoomId}`);
          socket.send(JSON.stringify({
            action: 'reconnect',
            playerId: storedPlayerId,
            roomId: storedRoomId,
          }));
        }
      } catch (_) { /* sessionStorage indisponível, segue sem reconnect */ }
    };

    socket.onmessage = (event) => {
      try {
        const resp = JSON.parse(event.data);
        console.log("[WS] Mensagem recebida:", resp.type, resp);

        if (resp.type === 'c_stdout') {
          setCStdout(prev => [...prev.slice(-50), resp.data]);
        }
        if (resp.type === 'game_state') {
          console.log("[WS] 🎮 GAME STATE RECEBIDO!", resp.data);
          setGameState(resp.data);
        }
        if (resp.type === 'doubt_state') {
          // Engine perguntou ao oponente se duvida ou acredita.
          // NÃO disparamos o overlay aqui — só atualizamos o estado pra UI mostrar
          // a carta na mesa + os botões DUVIDO/ACREDITO. O overlay só deve aparecer
          // se alguém clicar em DUVIDO (= doubt_result chegando).
          console.log("[WS] ⚔️ DOUBT STATE RECEBIDO (aguardando ação do oponente)", resp.data);
          setDoubtState(resp.data);
        }
        if (resp.type === 'doubt_state') {
          // Log: alguém duvidou de uma carta declarada
          const tipos = ['—', 'Tautologia', 'Contradição', 'Contingência'];
          const declarado = tipos[resp.data?.bluff] ?? 'algo';
          pushLog('doubt', `${resp.data.caller} duvidou de ${resp.data.target} (declarou ${declarado})`);
        }
        if (resp.type === 'doubt_result') {
          // Alguém clicou DUVIDO. Agora sim disparamos a cascata de animação:
          // overlay "Dúvida chamada!" → TruthTable → Roleta.
          console.log("[WS] ⚖️ DOUBT RESULT RECEBIDO!", resp.data);
          setDoubtResult(resp.data);
          setShowDoubtOverlay(true); // dispara a cascata
          const tiposReal = ['Tautologia', 'Contradição', 'Contingência'];
          const realName = tiposReal[resp.data?.realType] ?? '?';
          pushLog('doubt', resp.data?.bluffed
            ? `${resp.data.loser} blefou (era ${realName}) → roleta russa`
            : `${resp.data.loser} duvidou em vão (era ${realName}) → roleta russa`);
        }
        if (resp.type === 'roulette_result') {
          // Resultado real da roleta russa: dispara a tela da roleta agora
          // (não no doubt_result, pra não acionar antes de a engine girar o tambor).
          console.log("[WS] 🎰 ROULETTE RESULT RECEBIDO!", resp.data);
          setRouletteResult(resp.data);
          setShowRoulette(true);
          // Phase 5: registra eliminação na ordem em que ocorre
          if (resp.data.survived === false && resp.data.player) {
            setEliminationOrder(prev => prev.includes(resp.data.player) ? prev : [...prev, resp.data.player]);
          }
          if (resp.data?.survived) {
            pushLog('roulette_safe', `${resp.data.player} sobreviveu à roleta (${resp.data.bullets} bala${resp.data.bullets === 1 ? '' : 's'})`);
          } else {
            pushLog('roulette_dead', `💀 ${resp.data.player} foi eliminado na roleta`);
          }
        }
        if (resp.type === 'victory_state') {
          console.log("[WS] 🏆 VICTORY STATE RECEBIDO!", resp.data);
          setVictoryState(resp.data);
          setShowVictory(true);
          pushLog('victory', `🏆 ${resp.data.winner} venceu a partida`);
        }
        // ─── Liar's Dice events ────────────────────────────────────────
        if (resp.type === 'dice_state') {
          console.log("[WS] 🎲 DICE STATE:", resp.data);
          setDiceState(resp.data);
        }
        if (resp.type === 'dice_bet') {
          console.log("[WS] 🎲 DICE BET:", resp.data);
          setDiceBet(resp.data);
          pushLog('bet', `${resp.data.caller} apostou ${resp.data.qt}× face ${resp.data.face}`);
        }
        if (resp.type === 'dice_doubt') {
          console.log("[WS] 🎲 DICE DOUBT:", resp.data);
          setDiceDoubt(resp.data);
          pushLog('dice_doubt', `${resp.data.caller} duvidou da aposta`);
        }
        if (resp.type === 'dice_reveal') {
          console.log("[WS] 🎲 DICE REVEAL:", resp.data);
          setDiceReveal(resp.data);
          setShowDiceReveal(true);
          const verdict = resp.data?.betValid
            ? `aposta válida (havia ${resp.data.totalReal}× face ${resp.data.betFace})`
            : `mentira (só ${resp.data.totalReal}× face ${resp.data.betFace})`;
          const tail = resp.data?.eliminated
            ? `💀 ${resp.data.loser} eliminado`
            : `${resp.data.loser} perdeu 1 dado (${resp.data.loserDiceCount} restantes)`;
          pushLog('reveal', `${verdict} → ${tail}`);
        }
        if (resp.type === 'leaderboard') {
          console.log("[WS] 🏆 LEADERBOARD:", resp.entries?.length, "entradas");
          setLeaderboard(resp.entries ?? []);
        }
        if (resp.type === 'active_rooms') {
          setActiveRooms(resp.rooms ?? []);
        }
        if (resp.type === 'trigger') {
          // Trigger 'show_doubt' e 'player_death' eram resíduos do modo demo
          // (matching de texto na stdout do engine). Removidos pra não duplicar
          // o disparo dos overlays — agora cascata vem só de doubt_result/roulette_result.
          console.log("[WS] 🔔 TRIGGER recebido:", resp.event);
          if (resp.event === 'victory') setShowVictory(true);
        }
        // ─── Multiplayer room messages (Phase 2 + Phase 4) ───
        if (resp.type === 'room_created') {
          console.log("[WS] 🏠 ROOM CREATED:", resp.roomId);
          setPlayerId(resp.playerId);
          setRoomState(resp.room);
          setRoomError(null);
          try {
            sessionStorage.setItem('booleanbar_playerId', resp.playerId);
            sessionStorage.setItem('booleanbar_roomId', resp.roomId);
          } catch (_) { /* no-op */ }
        }
        if (resp.type === 'room_joined') {
          console.log("[WS] 🚪 ROOM JOINED:", resp.roomId);
          setPlayerId(resp.playerId);
          setRoomState(resp.room);
          setRoomError(null);
          try {
            sessionStorage.setItem('booleanbar_playerId', resp.playerId);
            sessionStorage.setItem('booleanbar_roomId', resp.roomId);
          } catch (_) { /* no-op */ }
        }
        if (resp.type === 'room_state') {
          console.log("[WS] 🔄 ROOM STATE update");
          setRoomState(resp.room);
        }
        if (resp.type === 'room_closed') {
          console.warn("[WS] 🚫 ROOM CLOSED:", resp.reason);
          setRoomState(null);
          setPlayerId(null);
          setGameStarting(false);
          // Mensagens amigáveis por motivo
          const reasonMessages = {
            empty: 'Sala fechada (vazia)',
            host_left: 'Host saiu — sala encerrada',
            player_left_mid_game: 'Outro jogador saiu da partida — partida encerrada',
            all_disconnected: 'Todos desconectaram — sala encerrada',
            engine_spawn_failed: 'Falha ao iniciar o jogo',
            no_humans: 'Não restou nenhum jogador humano — sala encerrada',
          };
          const msg = reasonMessages[resp.reason] || `Sala fechada: ${resp.reason}`;
          setRoomError({ code: 'room_closed', message: msg });
          try {
            sessionStorage.removeItem('booleanbar_playerId');
            sessionStorage.removeItem('booleanbar_roomId');
          } catch (_) { /* no-op */ }
        }
        // Phase 4: reconnect responses
        if (resp.type === 'reconnect_success') {
          console.log("[WS] 🔁 RECONNECT OK:", resp.roomId);
          setPlayerId(resp.playerId);
          setRoomState(resp.room);
          setRoomError(null);
          if (resp.lastGameState) setGameState(resp.lastGameState);
          if (resp.lastDoubtState) setDoubtState(resp.lastDoubtState);
          if (resp.lastDiceState) setDiceState(resp.lastDiceState);   // Phase 7 fix
          if (resp.room?.gameStarted) setGameStarting(true);
        }
        if (resp.type === 'reconnect_failed') {
          console.warn("[WS] ❌ RECONNECT FAILED:", resp.code, resp.message);
          // Limpa storage pra não tentar de novo
          try {
            sessionStorage.removeItem('booleanbar_playerId');
            sessionStorage.removeItem('booleanbar_roomId');
          } catch (_) { /* no-op */ }
          setRoomState(null);
          setPlayerId(null);
          setGameStarting(false);
          // Não setamos roomError aqui — falha de reconnect normalmente significa
          // que a sala expirou; UI deve mostrar tela de lobby normal.
        }
        if (resp.type === 'game_starting') {
          console.log("[WS] 🚀 GAME STARTING (broadcast)");
          setGameStarting(true);
          setRoomState(resp.room);
          // Reset do log a cada nova partida (capstone)
          setGameLog([]);
          logIdCounter.current = 0;
          pushLog('info', '─── Partida iniciada ───');
        }
        if (resp.type === 'error') {
          console.warn("[WS] ⚠️ Error:", resp.code, resp.message);
          setRoomError({ code: resp.code, message: resp.message });
        }
        if (resp.type === 'input_rejected') {
          // Phase 3: server bloqueou input fora-de-turno. UI já deveria ter gateado;
          // se chegou aqui, é fallback de segurança ou bug de gate. Só loga.
          console.warn("[WS] ⛔ input_rejected:", resp.reason, "expected:", resp.expectedPlayerId);
        }
      } catch (e) {
        console.error("[WS] Erro ao parsear mensagem:", e, event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("[WS] ❌ Erro no WebSocket:", err);
    };

    socket.onclose = () => {
      console.warn("[WS] 🔌 Conexão FECHADA. Reconectando em 2s...");
      setWsStatus("disconnected");
      wsRef.current = null;
      reconnectTimer.current = setTimeout(() => { connect(); }, 2000);
    };

    wsRef.current = socket;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const startGame = useCallback((playerNames: string[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("[WS] 🚀 Enviando START_GAME com nomes:", playerNames);
      setEliminationOrder([]); // nova partida → reseta
      setVictoryState(null);
      wsRef.current.send(JSON.stringify({ action: "start_game", playerNames }));
    } else {
      console.error("[WS] ⛔ WebSocket NÃO está conectado! readyState:", wsRef.current?.readyState);
    }
  }, []);

  // ─── Room actions (Phase 2) ────────────────────────────────────────────────
  const sendAction = useCallback((payload: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.error("[WS] ⛔ Tentou enviar action mas WS não está conectado");
    }
  }, []);

  const createRoom = useCallback((playerName: string, gameMode: 'logic' | 'dice' = 'logic') => {
    setRoomError(null);
    sendAction({ action: "create_room", playerName, gameMode });
  }, [sendAction]);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    setRoomError(null);
    sendAction({ action: "join_room", roomId: roomId.toUpperCase(), playerName });
  }, [sendAction]);

  const leaveRoom = useCallback(() => {
    sendAction({ action: "leave_room" });
    setRoomState(null);
    setPlayerId(null);
    setGameStarting(false);
    try {
      sessionStorage.removeItem('booleanbar_playerId');
      sessionStorage.removeItem('booleanbar_roomId');
    } catch (_) { /* no-op */ }
  }, [sendAction]);

  const addBot = useCallback(() => {
    setRoomError(null);
    sendAction({ action: "add_bot" });
  }, [sendAction]);

  const loadLeaderboard = useCallback(() => {
    sendAction({ action: "get_leaderboard" });
  }, [sendAction]);

  const removeBot = useCallback((botId: string) => {
    setRoomError(null);
    sendAction({ action: "remove_bot", botId });
  }, [sendAction]);

  const startRoomGame = useCallback(() => {
    setRoomError(null);
    setEliminationOrder([]);
    setVictoryState(null);
    // Reset dice state pra começar limpo
    setDiceState(null);
    setDiceBet(null);
    setDiceDoubt(null);
    setDiceReveal(null);
    setShowDiceReveal(false);
    sendAction({ action: "start_game" });
  }, [sendAction]);

  const clearRoomError = useCallback(() => setRoomError(null), []);

  const sendInput = useCallback((input: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log(`[WS] ⌨️ Enviando input pro C: "${input}"`);
      wsRef.current.send(JSON.stringify({ action: "send_input", data: input }));
    } else {
      console.error("[WS] ⛔ Tentou enviar input mas WebSocket está desconectado!");
    }
  }, []);

  // Phase 7: FLEE — fecha a aba do usuário (NÃO derruba o servidor).
  // Antes mandava action 'shutdown' que matava o WS server pra todo mundo.
  const sendShutdown = useCallback(() => {
    console.log("[WS] 🚪 FLEE: fechando aba...");
    // Fecha a conexão WS limpa antes de sair
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try { wsRef.current.send(JSON.stringify({ action: 'leave_room' })); } catch (_) { /* no-op */ }
      wsRef.current.close();
    }
    // window.close() só funciona se a aba foi aberta via script (window.open)
    // ou se é PWA standalone. Pra abas normais o browser bloqueia silencioso.
    // Tenta primeiro; se não fechar em 250ms, redireciona pra about:blank
    // como fallback (efetivamente "sai" do jogo).
    try { window.close(); } catch (_) { /* no-op */ }
    setTimeout(() => {
      try { window.location.href = "about:blank"; } catch (_) { /* no-op */ }
    }, 250);
  }, []);

  return {
    wsRef,
    startGame,
    sendInput,
    sendShutdown,
    cStdout,
    gameState,
    doubtState,
    doubtResult,
    rouletteResult,
    victoryState,
    wsStatus,
    showDoubtOverlay,
    setShowDoubtOverlay,
    showRoulette,
    setShowRoulette,
    showVictory,
    setShowVictory,
    // ─── Multiplayer (Phase 2) ──
    roomState,
    playerId,
    roomError,
    gameStarting,
    createRoom,
    joinRoom,
    leaveRoom,
    startRoomGame,
    addBot,
    removeBot,
    clearRoomError,
    // ─── Phase 5: ranking ──
    eliminationOrder,
    // ─── Liar's Dice ──
    diceState,
    diceBet,
    diceDoubt,
    diceReveal,
    showDiceReveal,
    setShowDiceReveal,
    // ─── Capstone: log de jogadas ──
    gameLog,
    clearGameLog,
    // ─── Capstone: leaderboard ──
    leaderboard,
    loadLeaderboard,
    // ─── Task 4.4: salas ativas ──
    activeRooms,
  };
}

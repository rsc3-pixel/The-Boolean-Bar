import { useEffect, useRef, useState, useCallback } from "react";

export interface PlayerState {
  name: string;
  alive: boolean;
  cards: number;
  lives: number;
}

export interface GameState {
  players: PlayerState[];
  currentHand: string[];
  turn: number;
  bullets: number;
}

export interface DoubtState {
  caller: string;
  target: string;
  card: string;
  bluff: number;
}

export interface DoubtResult {
  loser: string;      // Nome de quem vai para a roleta
  bluffed: boolean;   // true = loser blefou; false = oponente duvidou errado
  realType: number;   // Tipo real avaliado pelo logic_engine (0=TAUTO, 1=CONTRA, 2=CONT)
}

export interface RouletteResult {
  player: string;    // Nome de quem puxou o gatilho
  survived: boolean; // true = sobreviveu; false = foi eliminado
  lives: number;     // Vidas restantes
  bullets: number;   // Balas no tambor após a roleta
}

export interface VictoryState {
  winner: string;
  totalPlayers: number;
}

// ─── Multiplayer (Phase 2) ────────────────────────────────────────────────────
export interface RoomPlayer {
  playerId: string;
  name: string;
  slot: number;
  isHost: boolean;
  connected: boolean;  // Phase 4
}

export interface RoomSnapshot {
  roomId: string;
  hostId: string;
  gameStarted: boolean;
  isSoloMode: boolean;
  players: RoomPlayer[];
}

export interface RoomError {
  code: string;
  message: string;
}

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
        if (resp.type === 'doubt_result') {
          // Alguém clicou DUVIDO. Agora sim disparamos a cascata de animação:
          // overlay "Dúvida chamada!" → TruthTable → Roleta.
          console.log("[WS] ⚖️ DOUBT RESULT RECEBIDO!", resp.data);
          setDoubtResult(resp.data);
          setShowDoubtOverlay(true); // dispara a cascata
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
        }
        if (resp.type === 'victory_state') {
          console.log("[WS] 🏆 VICTORY STATE RECEBIDO!", resp.data);
          setVictoryState(resp.data);
          setShowVictory(true);
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

  const createRoom = useCallback((playerName: string) => {
    setRoomError(null);
    sendAction({ action: "create_room", playerName });
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

  const startRoomGame = useCallback(() => {
    setRoomError(null);
    setEliminationOrder([]); // nova partida → reseta
    setVictoryState(null);
    sendAction({ action: "start_game" }); // sem playerNames → modo sala
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

  const sendShutdown = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("[WS] 🚪 Enviando SHUTDOWN ao servidor...");
      wsRef.current.send(JSON.stringify({ action: 'shutdown' }));
    }
    // Tenta fechar a aba após pequeno delay
    setTimeout(() => { try { window.close(); } catch(_) {} }, 600);
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
    clearRoomError,
    // ─── Phase 5: ranking ──
    eliminationOrder,
  };
}

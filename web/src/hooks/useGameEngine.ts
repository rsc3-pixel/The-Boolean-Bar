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

  const connect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    console.log("[WS] Tentando conectar ao Backend C em ws://localhost:8080...");
    setWsStatus("connecting");

    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("[WS] ✅ Conexão WebSocket ABERTA com sucesso!");
      setWsStatus("connected");
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
          console.log("[WS] ⚔️ DOUBT STATE RECEBIDO!", resp.data);
          setDoubtState(resp.data);
          setShowDoubtOverlay(true);
        }
        if (resp.type === 'doubt_result') {
          // Resultado real do confronto lógico — quem vai para a roleta
          console.log("[WS] ⚖️ DOUBT RESULT RECEBIDO!", resp.data);
          setDoubtResult(resp.data);
          // Aciona a roleta logo após (com pequeno delay para TruthTable fechar)
          setShowRoulette(true);
        }
        if (resp.type === 'roulette_result') {
          // Resultado real da roleta russa
          console.log("[WS] 🎰 ROULETTE RESULT RECEBIDO!", resp.data);
          setRouletteResult(resp.data);
        }
        if (resp.type === 'victory_state') {
          console.log("[WS] 🏆 VICTORY STATE RECEBIDO!", resp.data);
          setVictoryState(resp.data);
          setShowVictory(true);
        }
        if (resp.type === 'trigger') {
          console.log("[WS] 🔔 TRIGGER recebido:", resp.event);
          if (resp.event === 'show_doubt') setShowDoubtOverlay(true);
          if (resp.event === 'player_death') setShowRoulette(true);
          if (resp.event === 'victory') setShowVictory(true);
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
      wsRef.current.send(JSON.stringify({ action: "start_game", playerNames }));
    } else {
      console.error("[WS] ⛔ WebSocket NÃO está conectado! readyState:", wsRef.current?.readyState);
    }
  }, []);

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
  };
}

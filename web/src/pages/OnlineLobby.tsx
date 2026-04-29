import { useState } from "react";
import { motion } from "motion/react";
import { Plus, LogIn, ArrowLeft, Brain, Dices } from "lucide-react";

export type GameModeKind = "logic" | "dice";

interface OnlineLobbyProps {
  wsStatus: "connecting" | "connected" | "disconnected";
  errorMessage?: string | null;
  gameMode: GameModeKind;
  onGameModeChange: (mode: GameModeKind) => void;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onBack: () => void;
  onClearError: () => void;
}

type Mode = "choose" | "create" | "join";

export function OnlineLobby({
  wsStatus,
  errorMessage,
  gameMode,
  onGameModeChange,
  onCreateRoom,
  onJoinRoom,
  onBack,
  onClearError,
}: OnlineLobbyProps) {
  const [mode, setMode] = useState<Mode>("choose");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const isConnected = wsStatus === "connected";
  const trimmedName = playerName.trim();
  const trimmedCode = roomCode.trim().toUpperCase();

  const submitCreate = () => {
    if (!trimmedName) return;
    onCreateRoom(trimmedName);
  };

  const submitJoin = () => {
    if (!trimmedName || trimmedCode.length !== 4) return;
    onJoinRoom(trimmedCode, trimmedName);
  };

  return (
    <div className="size-full bg-black overflow-hidden relative flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-black to-black" />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-cyan-400/70 hover:text-cyan-300 transition-colors font-mono text-sm uppercase tracking-widest z-20"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      {/* WS status indicator */}
      <div className="absolute top-8 right-8 flex items-center gap-2 font-mono text-xs uppercase tracking-widest z-20">
        <div className={`w-2 h-2 rounded-full ${
          wsStatus === "connected" ? "bg-emerald-400 animate-pulse" :
          wsStatus === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-500"
        }`} />
        <span className={
          wsStatus === "connected" ? "text-emerald-400/80" :
          wsStatus === "connecting" ? "text-yellow-400/80" : "text-red-400/80"
        }>
          {wsStatus === "connected" ? "Servidor Online" : wsStatus === "connecting" ? "Conectando..." : "Servidor Offline"}
        </span>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-[480px]">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl tracking-[0.3em] text-cyan-300 font-sans uppercase"
          style={{ fontWeight: 800, textShadow: "0 0 30px rgba(6, 182, 212, 0.6)" }}
        >
          Multiplayer
        </motion.h1>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full px-4 py-3 border border-red-500/40 bg-red-950/30 rounded-md text-red-300 font-mono text-sm flex items-center justify-between gap-3"
          >
            <span>{errorMessage}</span>
            <button onClick={onClearError} className="text-red-400/60 hover:text-red-300 text-xs uppercase">×</button>
          </motion.div>
        )}

        {mode === "choose" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 w-full">
            <button
              disabled={!isConnected}
              onClick={() => setMode("create")}
              className="group relative w-full h-[100px] bg-cyan-500/10 border-2 border-cyan-400/40 rounded-xl hover:border-cyan-300/70 hover:bg-cyan-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-5 px-8"
            >
              <Plus className="w-10 h-10 text-cyan-300" strokeWidth={1.5} />
              <div className="flex flex-col items-start">
                <span className="text-2xl tracking-widest text-cyan-200 font-sans" style={{ fontWeight: 700 }}>CRIAR SALA</span>
                <span className="text-xs tracking-[0.3em] text-cyan-500/60 font-mono uppercase">Você é o host</span>
              </div>
            </button>

            <button
              disabled={!isConnected}
              onClick={() => setMode("join")}
              className="group relative w-full h-[100px] bg-emerald-500/10 border-2 border-emerald-400/40 rounded-xl hover:border-emerald-300/70 hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-5 px-8"
            >
              <LogIn className="w-10 h-10 text-emerald-300" strokeWidth={1.5} />
              <div className="flex flex-col items-start">
                <span className="text-2xl tracking-widest text-emerald-200 font-sans" style={{ fontWeight: 700 }}>ENTRAR EM SALA</span>
                <span className="text-xs tracking-[0.3em] text-emerald-500/60 font-mono uppercase">Use o código de 4 letras</span>
              </div>
            </button>
          </motion.div>
        )}

        {mode === "create" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 w-full">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-cyan-400/70 font-mono">Seu Nome</span>
              <input
                autoFocus
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitCreate()}
                maxLength={32}
                placeholder="Ex: Renato"
                className="bg-black/60 border-2 border-cyan-500/30 focus:border-cyan-400/70 rounded-md px-4 py-3 text-cyan-100 font-mono outline-none transition-colors"
              />
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setMode("choose")}
                className="flex-1 h-12 border border-zinc-700 hover:border-zinc-500 rounded-md text-zinc-400 font-mono text-sm uppercase tracking-widest transition-colors"
              >
                Voltar
              </button>
              <button
                disabled={!trimmedName || !isConnected}
                onClick={submitCreate}
                className="flex-[2] h-12 bg-cyan-500 hover:bg-cyan-400 rounded-md text-black font-sans uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ fontWeight: 700 }}
              >
                Criar Sala
              </button>
            </div>
          </motion.div>
        )}

        {mode === "join" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 w-full">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-emerald-400/70 font-mono">Código da Sala</span>
              <input
                autoFocus
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                onKeyDown={e => e.key === "Enter" && submitJoin()}
                maxLength={4}
                placeholder="ABCD"
                className="bg-black/60 border-2 border-emerald-500/30 focus:border-emerald-400/70 rounded-md px-4 py-3 text-emerald-100 font-mono text-3xl tracking-[0.5em] text-center outline-none transition-colors uppercase"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-emerald-400/70 font-mono">Seu Nome</span>
              <input
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitJoin()}
                maxLength={32}
                placeholder="Ex: João"
                className="bg-black/60 border-2 border-emerald-500/30 focus:border-emerald-400/70 rounded-md px-4 py-3 text-emerald-100 font-mono outline-none transition-colors"
              />
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setMode("choose")}
                className="flex-1 h-12 border border-zinc-700 hover:border-zinc-500 rounded-md text-zinc-400 font-mono text-sm uppercase tracking-widest transition-colors"
              >
                Voltar
              </button>
              <button
                disabled={!trimmedName || trimmedCode.length !== 4 || !isConnected}
                onClick={submitJoin}
                className="flex-[2] h-12 bg-emerald-500 hover:bg-emerald-400 rounded-md text-black font-sans uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ fontWeight: 700 }}
              >
                Entrar
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Toggle de modo de jogo — canto inferior direito */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-mono">Modo do Jogo</span>
        <div className="flex bg-black/60 border border-zinc-700 rounded-full p-1 backdrop-blur-md">
          <button
            onClick={() => onGameModeChange("logic")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs uppercase tracking-widest transition-all ${
              gameMode === "logic"
                ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                : "text-zinc-400 hover:text-cyan-300"
            }`}
            style={gameMode === "logic" ? { fontWeight: 700 } : undefined}
          >
            <Brain className="w-4 h-4" />
            Boolean Bar
          </button>
          <button
            onClick={() => onGameModeChange("dice")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs uppercase tracking-widest transition-all ${
              gameMode === "dice"
                ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(52,211,153,0.6)]"
                : "text-zinc-400 hover:text-emerald-300"
            }`}
            style={gameMode === "dice" ? { fontWeight: 700 } : undefined}
          >
            <Dices className="w-4 h-4" />
            Liar's Dice
          </button>
        </div>
        {gameMode === "dice" && (
          <span className="text-[10px] tracking-wider text-yellow-400/70 font-mono italic">
            ⚠️ UI ainda em desenvolvimento
          </span>
        )}
      </div>
    </div>
  );
}

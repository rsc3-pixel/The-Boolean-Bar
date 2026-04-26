import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, Crown, LogOut, Play, Users, WifiOff } from "lucide-react";
import type { RoomSnapshot } from "../hooks/useGameEngine";

interface WaitingRoomProps {
  room: RoomSnapshot;
  myPlayerId: string;
  errorMessage?: string | null;
  onStart: () => void;
  onLeave: () => void;
  onClearError: () => void;
}

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 7;

export function WaitingRoom({
  room,
  myPlayerId,
  errorMessage,
  onStart,
  onLeave,
  onClearError,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === myPlayerId;
  const connectedCount = room.players.filter(p => p.connected).length;
  const canStart = isHost && connectedCount >= MIN_PLAYERS && !room.gameStarted;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) { /* clipboard pode falhar em http */ }
  };

  return (
    <div className="size-full bg-black overflow-hidden relative flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-black to-black" />

      <div className="relative z-10 flex flex-col items-center gap-8 w-[640px] max-w-[90vw]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <span className="text-xs uppercase tracking-[0.4em] text-cyan-400/60 font-mono">Sala de Espera</span>
          <button
            onClick={copyCode}
            title="Clique pra copiar o código"
            className="group flex items-center gap-4 px-6 py-3 border-2 border-cyan-400/40 hover:border-cyan-300/70 rounded-xl bg-cyan-950/20 transition-colors"
          >
            <span
              className="text-6xl tracking-[0.4em] text-cyan-200 font-mono"
              style={{ fontWeight: 800, textShadow: "0 0 30px rgba(6, 182, 212, 0.6)" }}
            >
              {room.roomId}
            </span>
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check className="w-6 h-6 text-emerald-400" />
                </motion.div>
              ) : (
                <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy className="w-6 h-6 text-cyan-400/60 group-hover:text-cyan-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <span className="text-xs uppercase tracking-[0.3em] text-zinc-600 font-mono">Compartilhe esse código</span>
        </motion.div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full px-4 py-3 border border-red-500/40 bg-red-950/30 rounded-md text-red-300 font-mono text-sm flex items-center justify-between gap-3"
          >
            <span>{errorMessage}</span>
            <button onClick={onClearError} className="text-red-400/60 hover:text-red-300 text-xs uppercase">×</button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full border border-cyan-500/20 rounded-xl bg-zinc-950/40 backdrop-blur-sm p-6 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between border-b border-cyan-500/10 pb-3">
            <div className="flex items-center gap-2 text-cyan-300 font-mono uppercase tracking-widest text-sm">
              <Users className="w-4 h-4" />
              Jogadores
            </div>
            <span className="text-cyan-400/60 font-mono text-xs">
              {room.players.length} / {MAX_PLAYERS}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {room.players.map((p) => (
              <motion.div
                key={p.playerId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-3 px-4 py-2 rounded-md transition-opacity ${
                  p.playerId === myPlayerId ? "bg-cyan-500/10 border border-cyan-400/30" : "bg-black/30"
                } ${!p.connected ? "opacity-40" : ""}`}
              >
                <span className="font-mono text-zinc-500 text-sm w-6">#{p.slot + 1}</span>
                <span className="font-sans text-cyan-100 flex-1">{p.name}</span>
                {!p.connected && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400/80 font-mono uppercase tracking-widest">
                    <WifiOff className="w-3 h-3" />
                    desconectado
                  </span>
                )}
                {p.isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                {p.playerId === myPlayerId && (
                  <span className="text-xs uppercase tracking-widest text-cyan-400/60 font-mono">você</span>
                )}
              </motion.div>
            ))}

            {/* Slots vazios */}
            {Array.from({ length: MAX_PLAYERS - room.players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 px-4 py-2 rounded-md border border-dashed border-zinc-800 text-zinc-700 font-mono text-sm"
              >
                <span className="w-6">#{room.players.length + i + 1}</span>
                <span className="flex-1">esperando...</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onLeave}
            className="flex items-center justify-center gap-2 px-6 h-14 border border-red-500/40 hover:border-red-400/70 hover:bg-red-950/20 rounded-md text-red-300 font-mono uppercase tracking-widest text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>

          {isHost ? (
            <button
              disabled={!canStart}
              onClick={onStart}
              className="flex-1 flex items-center justify-center gap-3 h-14 bg-cyan-500 hover:bg-cyan-400 rounded-md text-black font-sans uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              style={{ fontWeight: 700 }}
            >
              <Play className="w-5 h-5" />
              {connectedCount < MIN_PLAYERS
                ? `Mínimo ${MIN_PLAYERS} conectados`
                : room.gameStarted ? "Iniciando..." : "Iniciar Partida"}
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center h-14 border border-zinc-700 rounded-md text-zinc-500 font-mono uppercase tracking-widest text-sm">
              Aguardando o host iniciar...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

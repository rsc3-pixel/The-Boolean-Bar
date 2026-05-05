import { useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, History, Trophy, Brain, Dices, Bot, User } from "lucide-react";
import type { HistoryEntry } from "../hooks/useGameEngine";

interface HistoryPageProps {
  entries: HistoryEntry[];
  onBack: () => void;
  onLoad: () => void;
  wsStatus: "connecting" | "connected" | "disconnected";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export function HistoryPage({ entries, onBack, onLoad, wsStatus }: HistoryPageProps) {
  // Carrega ao montar (ou recarrega se já tem)
  useEffect(() => {
    if (wsStatus === "connected") onLoad();
  }, [wsStatus, onLoad]);

  return (
    <div className="size-full bg-black overflow-auto relative">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-950/10 via-black to-cyan-950/10 pointer-events-none" />

      <button
        onClick={onBack}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-zinc-950/70 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:border-yellow-500/50 transition-all font-mono text-xs uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Voltar</span>
      </button>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 mb-8 sm:mb-10"
        >
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-300" />
            <h1
              className="text-2xl sm:text-4xl tracking-[0.2em] text-yellow-200 uppercase font-sans"
              style={{ fontWeight: 800, textShadow: "0 0 30px rgba(234,179,8,0.4)" }}
            >
              Histórico
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 font-mono tracking-widest uppercase text-center">
            Últimas {entries.length} partidas registradas
          </p>
        </motion.div>

        {wsStatus !== "connected" && (
          <div className="text-center py-12 text-zinc-500 font-mono text-sm">
            Conectando ao servidor...
          </div>
        )}

        {wsStatus === "connected" && entries.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="text-zinc-600 font-mono text-sm mb-2">📭 Nenhuma partida registrada ainda.</div>
            <div className="text-zinc-700 font-mono text-xs">
              Jogue uma partida multiplayer pra começar a popular o histórico.
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {entries.map((entry, idx) => (
            <motion.div
              key={`${entry.timestamp}-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-zinc-950/60 border border-zinc-800 hover:border-yellow-500/30 rounded-xl p-4 sm:p-5 transition-colors"
            >
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-center gap-2">
                  {entry.gameMode === "dice"
                    ? <Dices className="w-5 h-5 text-emerald-400 shrink-0" />
                    : <Brain className="w-5 h-5 text-cyan-400 shrink-0" />}
                  <span className={`text-xs font-mono uppercase tracking-widest ${
                    entry.gameMode === "dice" ? "text-emerald-300" : "text-cyan-300"
                  }`} style={{ fontWeight: 700 }}>
                    {entry.gameMode === "dice" ? "Liar's Dice" : "Boolean Bar"}
                  </span>
                  <span className="text-zinc-700 hidden sm:inline">·</span>
                  <span className="text-zinc-500 font-mono text-[10px] sm:text-xs hidden sm:inline">
                    sala {entry.roomId}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-zinc-500 font-mono">{formatDate(entry.timestamp)}</span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="text-yellow-300 font-mono text-sm uppercase tracking-widest" style={{ fontWeight: 700 }}>
                  {entry.winner}
                </span>
                <span className="text-zinc-600 font-mono text-xs">venceu</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {entry.players.map((p, pIdx) => (
                  <span
                    key={pIdx}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono border ${
                      p.name === entry.winner
                        ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-200"
                        : p.isBot
                          ? "bg-purple-500/10 border-purple-500/30 text-purple-300/80"
                          : "bg-zinc-900/60 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {p.isBot ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {p.name}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {entries.length > 0 && (
          <button
            onClick={onLoad}
            className="mt-6 w-full py-2.5 border border-zinc-800 hover:border-yellow-500/40 hover:bg-yellow-950/10 rounded-md text-zinc-500 hover:text-yellow-300 font-mono text-xs uppercase tracking-widest transition-all"
          >
            ↻ Recarregar
          </button>
        )}
      </div>
    </div>
  );
}

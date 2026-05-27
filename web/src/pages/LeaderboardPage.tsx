import { useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Trophy, Brain, Dices, Tv } from "lucide-react";
import type { LeaderboardEntry } from "../hooks/useGameEngine";

interface LeaderboardPageProps {
  entries: LeaderboardEntry[];
  onBack: () => void;
  onLoad: () => void;
  wsStatus: "connecting" | "connected" | "disconnected";
}

const RANK_BADGE = ["🥇", "🥈", "🥉"];

export function LeaderboardPage({ entries, onBack, onLoad, wsStatus }: LeaderboardPageProps) {
  // Carrega quando conecta
  useEffect(() => {
    if (wsStatus === "connected") onLoad();
  }, [wsStatus, onLoad]);

  return (
    <div className="size-full bg-black overflow-auto relative font-mono">
      {/* Scanlines de CRT */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
        }}
      />
      {/* Glow ambiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-950/10 via-black to-fuchsia-950/10 pointer-events-none" />

      {/* Botão voltar */}
      <button
        onClick={onBack}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-zinc-950/80 border-2 border-yellow-500/40 rounded-lg text-yellow-300 hover:text-yellow-100 hover:border-yellow-400/70 transition-all font-mono text-[10px] sm:text-xs uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Voltar</span>
      </button>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header arcade */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-2 mb-10 sm:mb-12"
        >
          <Trophy className="w-10 h-10 sm:w-14 sm:h-14 text-yellow-300 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]" />
          <motion.h1
            animate={{
              textShadow: [
                "0 0 20px rgba(234,179,8,0.5), 0 0 40px rgba(234,179,8,0.3)",
                "0 0 30px rgba(234,179,8,0.9), 0 0 60px rgba(234,179,8,0.6)",
                "0 0 20px rgba(234,179,8,0.5), 0 0 40px rgba(234,179,8,0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-3xl sm:text-5xl tracking-[0.25em] sm:tracking-[0.35em] text-yellow-200 uppercase text-center"
            style={{ fontFamily: "'Press Start 2P', monospace, sans-serif", fontWeight: 900 }}
          >
            HIGH SCORES
          </motion.h1>
          <p className="text-[10px] sm:text-xs tracking-[0.4em] text-yellow-500/60 uppercase mt-1">
            ★ Hall of Champions ★
          </p>
        </motion.div>

        {/* Estados de loading e empty */}
        {wsStatus !== "connected" && (
          <div className="text-center py-16">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-yellow-400 text-sm tracking-widest uppercase"
            >
              ▰▰▰ Conectando ao servidor ▰▰▰
            </motion.div>
          </div>
        )}

        {wsStatus === "connected" && entries.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="text-yellow-300/80 text-sm uppercase tracking-widest mb-3">
              ✦ Nenhum vencedor ainda ✦
            </div>
            <div className="text-zinc-600 text-xs uppercase tracking-widest">
              Vença uma partida pra entrar pro hall
            </div>
          </div>
        )}

        {/* Tabela arcade */}
        {entries.length > 0 && (
          <div className="bg-zinc-950/80 border-2 border-yellow-500/30 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(234,179,8,0.15)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-900/30 via-yellow-700/20 to-yellow-900/30 border-b-2 border-yellow-500/30 px-3 sm:px-5 py-2.5 grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_auto_auto] gap-2 sm:gap-4 text-[9px] sm:text-[10px] uppercase tracking-widest text-yellow-400/80" style={{ fontWeight: 700 }}>
              <div>RNK</div>
              <div>JOGADOR</div>
              <div className="hidden sm:block text-center">MODOS</div>
              <div className="text-right">WINS</div>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-yellow-500/10">
              {entries.map((entry, idx) => {
                const isPodium = idx < 3;
                const rankColor = idx === 0
                  ? "text-yellow-300"
                  : idx === 1
                    ? "text-zinc-300"
                    : idx === 2
                      ? "text-orange-400"
                      : "text-zinc-500";
                return (
                  <motion.div
                    key={entry.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3rem_1fr_auto_auto] gap-2 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3 items-center ${
                      isPodium ? "bg-yellow-950/15" : "hover:bg-zinc-900/40"
                    } transition-colors`}
                  >
                    {/* Rank */}
                    <div className={`text-base sm:text-xl ${rankColor}`} style={{ fontWeight: 900 }}>
                      {isPodium ? RANK_BADGE[idx] : `#${idx + 1}`}
                    </div>

                    {/* Nome */}
                    <div className="min-w-0 flex items-center gap-2">
                      <span
                        className={`truncate text-sm sm:text-base uppercase tracking-wider ${isPodium ? "text-yellow-100" : "text-zinc-200"}`}
                        style={{ fontWeight: isPodium ? 900 : 700 }}
                      >
                        {entry.name}
                      </span>
                    </div>

                    {/* Modos (desktop only) */}
                    <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-400">
                      {entry.modes?.logic > 0 && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                          <Brain className="w-3 h-3" /> {entry.modes.logic}
                        </span>
                      )}
                      {entry.modes?.dice > 0 && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                          <Dices className="w-3 h-3" /> {entry.modes.dice}
                        </span>
                      )}
                    </div>

                    {/* Wins */}
                    <div className={`text-right text-base sm:text-lg tabular-nums ${isPodium ? "text-yellow-200" : "text-yellow-400/80"}`} style={{ fontWeight: 900 }}>
                      {String(entry.wins).padStart(3, "0")}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botão refresh */}
        {entries.length > 0 && (
          <button
            onClick={onLoad}
            className="mt-5 w-full py-2.5 border border-yellow-500/30 hover:border-yellow-400/60 hover:bg-yellow-950/20 rounded-md text-yellow-400/80 hover:text-yellow-200 font-mono text-xs uppercase tracking-widest transition-all"
          >
            ↻ Atualizar
          </button>
        )}

        {/* Link pra modo TV */}
        <a
          href="/tv"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 border border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-950/20 rounded-md text-cyan-400/80 hover:text-cyan-200 font-mono text-xs uppercase tracking-widest transition-all"
        >
          <Tv className="w-4 h-4" />
          Abrir Modo TV (tela cheia)
        </a>

        {/* Footer flicker */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-center mt-8 text-[10px] tracking-[0.4em] text-yellow-500/40 uppercase"
        >
          /// Insert Coin to Continue ///
        </motion.div>
      </div>
    </div>
  );
}

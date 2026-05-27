import { useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Trophy, Brain, Dices, Radio, Users } from "lucide-react";
import type { LeaderboardEntry, ActiveRoom } from "../hooks/useGameEngine";

/* Modo TV: rota /tv. Layout grande, sem inputs, leitura à distância.
 * Auto-update: o server faz push pelo `pushLeaderboard()` toda vez que
 * uma partida termina (subscribers entram via `get_leaderboard`).
 * Task 4.4: painel de salas ativas em tempo real. */

interface TvPageProps {
  entries: LeaderboardEntry[];
  activeRooms: ActiveRoom[];
  onLoad: () => void;
  wsStatus: "connecting" | "connected" | "disconnected";
}

const ROW_LIMIT = 10;
const RANK_BADGE = ["🥇", "🥈", "🥉"];

export function TvPage({ entries, activeRooms, onLoad, wsStatus }: TvPageProps) {
  useEffect(() => {
    if (wsStatus === "connected") onLoad();
  }, [wsStatus, onLoad]);

  const display = useMemo(() => entries.slice(0, ROW_LIMIT), [entries]);

  return (
    <div className="size-full bg-black overflow-hidden relative font-mono select-none">
      {/* Scanlines CRT */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 3px, rgba(255,255,255,0.4) 3px, rgba(255,255,255,0.4) 4px)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/15 via-black to-fuchsia-950/15 pointer-events-none" />

      {/* Live indicator (canto superior direito) */}
      <div className="absolute top-4 right-6 sm:top-8 sm:right-12 z-20 flex items-center gap-3">
        <motion.div
          animate={{ opacity: wsStatus === "connected" ? [1, 0.3, 1] : 0.4 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className={`w-3 h-3 rounded-full ${
            wsStatus === "connected"
              ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
              : "bg-zinc-600"
          }`}
        />
        <span className="text-red-400 text-sm sm:text-base tracking-[0.4em] uppercase">
          {wsStatus === "connected" ? "AO VIVO" : wsStatus === "connecting" ? "CONECTANDO" : "OFFLINE"}
        </span>
        <Radio className="w-5 h-5 text-red-400" />
      </div>

      <div className="relative z-10 h-full max-w-[1600px] mx-auto px-6 sm:px-12 py-6 sm:py-10 flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-3 mb-6 sm:mb-10"
        >
          <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 sm:w-16 sm:h-16 text-yellow-300 drop-shadow-[0_0_24px_rgba(234,179,8,0.7)]" />
            <motion.h1
              animate={{
                textShadow: [
                  "0 0 30px rgba(234,179,8,0.5), 0 0 60px rgba(234,179,8,0.3)",
                  "0 0 50px rgba(234,179,8,1), 0 0 100px rgba(234,179,8,0.6)",
                  "0 0 30px rgba(234,179,8,0.5), 0 0 60px rgba(234,179,8,0.3)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-4xl sm:text-7xl tracking-[0.3em] sm:tracking-[0.45em] text-yellow-200 uppercase text-center"
              style={{ fontFamily: "'Press Start 2P', monospace, sans-serif", fontWeight: 900 }}
            >
              THE BOOLEAN BAR
            </motion.h1>
          </div>
          <p className="text-base sm:text-2xl tracking-[0.5em] text-cyan-300/80 uppercase mt-1">
            ★ RANKING DA CASA ★
          </p>
        </motion.div>

        {/* Estado de conexão / vazio */}
        {wsStatus !== "connected" && (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="text-yellow-300 text-2xl sm:text-4xl tracking-[0.4em] uppercase"
            >
              ▰▰▰ AGUARDANDO SINAL ▰▰▰
            </motion.div>
          </div>
        )}

        {wsStatus === "connected" && display.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-yellow-200 text-3xl sm:text-5xl uppercase tracking-[0.4em]">
              ✦ MESA VAZIA ✦
            </div>
            <div className="text-zinc-500 text-lg sm:text-2xl uppercase tracking-[0.3em]">
              Nenhuma vitória registrada ainda
            </div>
          </div>
        )}

        {/* Layout principal: QR code à esquerda + ranking à direita */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 sm:gap-8 min-h-0">

          {/* QR Code — esquerda */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col items-center justify-center gap-4 shrink-0"
          >
            <p className="text-base sm:text-xl tracking-[0.3em] text-cyan-300/70 uppercase font-mono text-center">
              ENTRE NA MESA
            </p>
            <div className="p-3 sm:p-4 bg-white rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.3)]">
              <img src="/qr-code.jpeg" alt="QR Code" className="w-40 h-40 sm:w-56 sm:h-56 lg:w-64 lg:h-64 xl:w-80 xl:h-80" />
            </div>
            <p className="text-xs sm:text-sm tracking-[0.3em] text-zinc-500 uppercase font-mono">
              Escaneie para jogar
            </p>
          </motion.div>

          {/* Tabela de ranking — direita */}
          {display.length > 0 ? (
            <div className="flex-1 flex flex-col bg-zinc-950/85 border-4 border-yellow-500/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.25)]">
              <div className="bg-gradient-to-r from-yellow-900/40 via-yellow-700/30 to-yellow-900/40 border-b-4 border-yellow-500/40 px-4 sm:px-8 py-3 sm:py-4 grid grid-cols-[3rem_1fr_6rem] sm:grid-cols-[5rem_1fr_auto_8rem_8rem] gap-2 sm:gap-6 text-sm sm:text-xl uppercase tracking-[0.2em] text-yellow-300/90" style={{ fontWeight: 700 }}>
                <div>RNK</div>
                <div>JOGADOR</div>
                <div className="hidden sm:block text-center">MODOS</div>
                <div className="hidden sm:block text-right">PTS</div>
                <div className="text-right">WINS</div>
              </div>

              <div className="flex-1 divide-y-2 divide-yellow-500/15 overflow-hidden">
                {display.map((entry, idx) => {
                  const isPodium = idx < 3;
                  const rankColor = idx === 0 ? "text-yellow-300"
                    : idx === 1 ? "text-zinc-200"
                    : idx === 2 ? "text-orange-400"
                    : "text-zinc-500";
                  return (
                    <motion.div
                      key={entry.name}
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.4 }}
                      className={`grid grid-cols-[3rem_1fr_6rem] sm:grid-cols-[5rem_1fr_auto_8rem_8rem] gap-2 sm:gap-6 px-4 sm:px-8 py-2 sm:py-4 items-center ${
                        isPodium ? "bg-yellow-950/20" : ""
                      }`}
                    >
                      <div className={`text-2xl sm:text-4xl ${rankColor}`} style={{ fontWeight: 900 }}>
                        {isPodium ? RANK_BADGE[idx] : `#${idx + 1}`}
                      </div>
                      <div className="min-w-0 flex items-center gap-2">
                        <span
                          className={`truncate text-lg sm:text-3xl uppercase tracking-wider ${
                            isPodium ? "text-yellow-100" : "text-zinc-100"
                          }`}
                          style={{ fontWeight: isPodium ? 900 : 700 }}
                        >
                          {entry.name}
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-base text-zinc-300">
                        {entry.modes?.logic > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-sm">
                            <Brain className="w-4 h-4" /> {entry.modes.logic}
                          </span>
                        )}
                        {entry.modes?.dice > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-sm">
                            <Dices className="w-4 h-4" /> {entry.modes.dice}
                          </span>
                        )}
                      </div>
                      <div
                        className={`hidden sm:block text-right text-2xl sm:text-4xl tabular-nums ${
                          isPodium ? "text-cyan-200" : "text-cyan-400/85"
                        }`}
                        style={{ fontWeight: 900 }}
                      >
                        {entry.points ?? 0}
                      </div>
                      <div
                        className={`text-right text-xl sm:text-3xl tabular-nums ${
                          isPodium ? "text-yellow-200/70" : "text-yellow-400/50"
                        }`}
                        style={{ fontWeight: 700 }}
                      >
                        {String(entry.wins).padStart(3, "0")}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : wsStatus === "connected" ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="text-yellow-200 text-2xl sm:text-4xl uppercase tracking-[0.4em]">
                MESA VAZIA
              </div>
              <div className="text-zinc-500 text-sm sm:text-xl uppercase tracking-[0.3em]">
                Nenhuma vitoria registrada ainda
              </div>
            </div>
          ) : null}

        </div>{/* Fim do layout QR + ranking */}

        {/* Task 4.4: Painel de salas ativas */}
        {activeRooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-4 sm:mt-6"
          >
            <div className="text-sm sm:text-lg tracking-[0.4em] text-cyan-300/60 uppercase text-center mb-3">
              ★ SALAS ATIVAS ★
            </div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {activeRooms.map((room) => (
                <motion.div
                  key={room.roomId}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-2 sm:py-3 bg-zinc-950/80 border-2 border-cyan-500/30 rounded-xl"
                >
                  <span className="text-lg sm:text-2xl text-cyan-200 tracking-[0.2em]" style={{ fontWeight: 800 }}>
                    {room.roomId}
                  </span>
                  <span className="text-cyan-500/40">|</span>
                  {room.gameMode === "logic"
                    ? <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                    : <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  }
                  <span className="text-cyan-500/40">|</span>
                  <span className="flex items-center gap-1 text-sm sm:text-base text-zinc-300">
                    <Users className="w-4 h-4" /> {room.playerCount}
                  </span>
                  <span className={`text-xs sm:text-sm tracking-wider px-2 py-0.5 rounded-md ${
                    room.gameStarted
                      ? "bg-red-500/20 border border-red-500/40 text-red-300"
                      : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  }`} style={{ fontWeight: 700 }}>
                    {room.gameStarted ? "JOGANDO" : "AGUARDANDO"}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Rodapé */}
        <motion.div
          animate={{ opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-center mt-4 sm:mt-6 text-sm sm:text-lg tracking-[0.5em] text-yellow-500/40 uppercase"
        >
          /// MESA AO VIVO • A CASA SEMPRE GANHA ///
        </motion.div>
      </div>
    </div>
  );
}

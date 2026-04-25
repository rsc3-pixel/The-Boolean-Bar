import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Skull, Shield, Target } from "lucide-react";
import { DiceFace } from "../ui/DiceFace";
import type { RevealResult } from "../../hooks/useDiceGame";

interface DiceRevealOverlayProps {
  isVisible: boolean;
  result: RevealResult | null;
  onContinue: () => void;
}

export function DiceRevealOverlay({ isVisible, result, onContinue }: DiceRevealOverlayProps) {
  const [revealStage, setRevealStage] = useState(0);
  // 0 = entering, 1 = revealing dice, 2 = counting, 3 = verdict

  useEffect(() => {
    if (!isVisible || !result) { setRevealStage(0); return; }

    const t1 = setTimeout(() => setRevealStage(1), 600);
    const t2 = setTimeout(() => setRevealStage(2), 1800);
    const t3 = setTimeout(() => setRevealStage(3), 2800);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isVisible, result]);

  if (!result) return null;

  const isExact = result.type === "exact";
  const exactWon = isExact && result.exactWin;
  const bidWon = !isExact && result.totalOfFace >= result.bid.quantity;

  // Determine colors based on result type
  const verdictColor = (isExact && exactWon) || (isExact && !exactWon)
    ? (exactWon ? "emerald" : "red")
    : (bidWon ? "red" : "emerald");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md"
        >
          {/* Background layer */}
          <motion.div
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-black to-amber-950/20"
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 max-w-6xl w-full px-4 sm:px-8 max-h-[100vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Title */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              {isExact ? (
                <Target className="w-12 h-12 text-amber-400" />
              ) : (
                <Shield className="w-12 h-12 text-amber-400" />
              )}
              <h1 className="text-5xl tracking-[0.3em] text-amber-300 font-sans" style={{ fontWeight: 900 }}>
                {isExact ? "EXATO!" : "MENTIROSO!"}
              </h1>
              <p className="text-sm tracking-wider text-amber-500/60 font-mono">
                {isExact
                  ? `${result.challengerName} declara que a aposta está exata`
                  : `${result.challengerName} desafia ${result.bidderName}`
                }
              </p>
            </motion.div>

            {/* Bid info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 px-8 py-4 bg-zinc-950/60 border border-amber-500/30 rounded-xl"
            >
              <span className="text-sm text-zinc-500 font-mono tracking-wider">APOSTA:</span>
              <span className="text-3xl text-amber-300 font-mono font-bold">{result.bid.quantity}×</span>
              <DiceFace value={result.bid.face} size="md" glowColor="emerald" />
              <span className="text-sm text-zinc-500 font-mono">por {result.bidderName}</span>
            </motion.div>

            {/* All players' dice reveal */}
            {revealStage >= 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full grid gap-4"
                style={{ gridTemplateColumns: `repeat(${Math.min(result.allDice.length, 3)}, 1fr)` }}
              >
                {result.allDice.map((pd, pIdx) => (
                  <motion.div
                    key={pd.playerId}
                    initial={{ y: 30, opacity: 0, rotateX: 90 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{ delay: pIdx * 0.3, type: "spring", bounce: 0.3 }}
                    className="flex flex-col items-center gap-3 p-4 bg-zinc-900/40 border border-zinc-700/40 rounded-xl"
                  >
                    <span className="text-sm font-mono font-bold text-zinc-300 tracking-wider">
                      {pd.playerName}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      {pd.dice.map((d, dIdx) => (
                        <motion.div
                          key={dIdx}
                          initial={{ scale: 0, rotate: 180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: pIdx * 0.3 + dIdx * 0.1 }}
                          className="relative"
                        >
                          <DiceFace
                            value={d}
                            size="sm"
                            glowColor={d === result.bid.face ? "emerald" : "zinc"}
                          />
                          {/* Highlight matching face */}
                          {d === result.bid.face && (
                            <motion.div
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="absolute inset-0 rounded-xl border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
                            />
                          )}
                        </motion.div>
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">
                      {pd.dice.filter(d => d === result.bid.face).length}× de {result.bid.face}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Total count animation */}
            {revealStage >= 2 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="flex items-center gap-6 px-10 py-6 bg-zinc-950/70 border-2 border-amber-500/40 rounded-2xl shadow-[0_0_30px_rgba(217,119,6,0.2)]"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-zinc-500 font-mono tracking-wider">TOTAL NA MESA</span>
                  <motion.span
                    initial={{ scale: 2 }}
                    animate={{ scale: 1 }}
                    className="text-6xl font-mono text-amber-300 font-bold"
                  >
                    {result.totalOfFace}×
                  </motion.span>
                </div>
                <DiceFace value={result.bid.face} size="lg" glowColor="emerald" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-zinc-500 font-mono tracking-wider">APOSTADO</span>
                  <span className="text-4xl font-mono text-zinc-400 font-bold">
                    {result.bid.quantity}×
                  </span>
                </div>
                <div className={`px-4 py-2 rounded-lg font-mono font-bold text-lg tracking-wider ${
                  result.totalOfFace >= result.bid.quantity
                    ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-950/50 text-red-400 border border-red-500/30'
                }`}>
                  {result.totalOfFace >= result.bid.quantity ? "≥ VERDADE" : "< FALSA"}
                </div>
              </motion.div>
            )}

            {/* Verdict */}
            {revealStage >= 3 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className={`
                  flex flex-col items-center gap-4 px-12 py-8 rounded-2xl border-4
                  ${verdictColor === "emerald"
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_40px_rgba(52,211,153,0.3)]'
                    : 'bg-red-950/30 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)]'
                  }
                `}
              >
                <Skull className={`w-16 h-16 ${verdictColor === "emerald" ? "text-emerald-400" : "text-red-400"}`} strokeWidth={2.5} />

                <div className="flex flex-col items-center gap-2">
                  {isExact ? (
                    exactWon ? (
                      <>
                        <span className="text-3xl font-mono font-bold text-emerald-300 tracking-wider">
                          EXATO CORRETO!
                        </span>
                        <span className="text-lg text-emerald-400/80 font-mono">
                          Todos os outros perdem 1 dado!
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-mono font-bold text-red-300 tracking-wider">
                          EXATO ERRADO!
                        </span>
                        <span className="text-lg text-red-400/80 font-mono">
                          {result.challengerName} perde 1 dado!
                        </span>
                      </>
                    )
                  ) : (
                    bidWon ? (
                      <>
                        <span className="text-3xl font-mono font-bold text-red-300 tracking-wider">
                          A APOSTA ERA VERDADE!
                        </span>
                        <span className="text-lg text-red-400/80 font-mono">
                          {result.challengerName} perde 1 dado!
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-mono font-bold text-emerald-300 tracking-wider">
                          MENTIRA REVELADA!
                        </span>
                        <span className="text-lg text-emerald-400/80 font-mono">
                          {result.bidderName} perde 1 dado!
                        </span>
                      </>
                    )
                  )}
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onContinue}
                  className="mt-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-mono font-bold text-lg tracking-wider rounded-xl border border-amber-400 shadow-[0_0_30px_rgba(217,119,6,0.5)] hover:shadow-[0_0_50px_rgba(217,119,6,0.7)] transition-all"
                >
                  CONTINUAR
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Corner decorations */}
          <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-amber-500/30" />
          <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-amber-500/30" />
          <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-amber-500/30" />
          <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-amber-500/30" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

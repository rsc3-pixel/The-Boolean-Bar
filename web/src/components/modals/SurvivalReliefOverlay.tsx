import { motion, AnimatePresence } from "motion/react";
import { Heart, TrendingUp, ShieldAlert } from "lucide-react";

interface SurvivalReliefOverlayProps {
  isVisible: boolean;
  playerName: string;
  livesRemaining: number;
  newBulletCount: number;
  totalChambers: number;
  onContinue: () => void;
}

export function SurvivalReliefOverlay({
  isVisible,
  playerName,
  livesRemaining,
  newBulletCount,
  totalChambers,
  onContinue
}: SurvivalReliefOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/95 backdrop-blur-sm"
        >
          {/* Background gradient transition from red to toxic green/cyan */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-cyan-950 to-teal-950"
          />

          {/* Radial glow effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 0.4 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-radial from-emerald-500/30 via-transparent to-transparent"
          />

          {/* Animated scanlines */}
          <motion.div
            animate={{ y: ["-100%", "200%"] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-40 opacity-50"
          />

          {/* Main content container */}
          <div className="relative z-10 flex flex-col items-center gap-10 px-8">
            {/* Big neon text: CLICK... EMPTY. */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring",
                duration: 0.8,
                bounce: 0.3
              }}
              className="relative"
            >
              {/* Outer glow ring */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 blur-3xl bg-gradient-to-r from-emerald-500 to-cyan-500"
              />

              {/* Main text */}
              <h1 
                className="relative text-8xl tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-emerald-400 drop-shadow-[0_0_40px_rgba(16,185,129,0.8)]"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900 }}
              >
                CLICK... EMPTY.
              </h1>

              {/* Animated underline */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-4"
              />
            </motion.div>

            {/* Player survived notification */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 0.5,
                  delay: 0.6,
                  type: "spring"
                }}
              >
                <Heart className="w-8 h-8 text-emerald-400 fill-emerald-400" />
              </motion.div>
              <span className="text-2xl tracking-wider text-emerald-300 font-sans" style={{ fontWeight: 700 }}>
                {playerName} SOBREVIVEU
              </span>
            </motion.div>

            {/* Status panel with glassmorphism */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative w-[600px] bg-zinc-950/60 backdrop-blur-xl border-2 border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.2),inset_0_0_30px_rgba(6,182,212,0.1)] overflow-hidden"
            >
              {/* Glass reflection effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

              <div className="relative p-8 flex flex-col gap-6">
                {/* Status updates header */}
                <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
                  <ShieldAlert className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-xl tracking-wider text-cyan-300 font-mono" style={{ fontWeight: 700 }}>
                    ATUALIZAÇÃO DE STATUS
                  </h3>
                </div>

                {/* Status grid */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Lives lost */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col gap-3 p-6 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 border border-yellow-500/30 rounded-xl"
                  >
                    <span className="text-xs tracking-[0.3em] text-zinc-400 font-mono">VIDAS PERDIDAS:</span>
                    <div className="flex items-center gap-3">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.5,
                          delay: 1,
                          type: "spring"
                        }}
                        className="text-5xl font-mono text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]"
                        style={{ fontWeight: 700 }}
                      >
                        -1
                      </motion.span>
                      <Heart className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-zinc-500 font-mono">VIDAS RESTANTES:</span>
                      <span className="text-lg text-emerald-400 font-mono" style={{ fontWeight: 600 }}>
                        {livesRemaining}
                      </span>
                    </div>
                  </motion.div>

                  {/* Global risk increased */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col gap-3 p-6 bg-gradient-to-br from-red-950/30 to-zinc-950/50 border border-red-500/30 rounded-xl"
                  >
                    <span className="text-xs tracking-[0.3em] text-zinc-400 font-mono">RISCO GLOBAL:</span>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-red-400" />
                      <motion.span
                        animate={{ 
                          opacity: [0.7, 1, 0.7],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 1
                        }}
                        className="text-3xl font-mono text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                        style={{ fontWeight: 700 }}
                      >
                        AUMENTADO!
                      </motion.span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-zinc-500 font-mono">BALAS NO CILINDRO:</span>
                      <motion.span
                        animate={{ color: ["#f87171", "#dc2626", "#f87171"] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity
                        }}
                        className="text-lg font-mono"
                        style={{ fontWeight: 600 }}
                      >
                        {newBulletCount}/{totalChambers}
                      </motion.span>
                    </div>
                  </motion.div>
                </div>

                {/* Warning message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-center py-3 px-4 bg-cyan-950/30 border border-cyan-500/20 rounded-lg"
                >
                  <motion.p
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                    className="text-sm tracking-[0.2em] text-cyan-400/80 font-mono"
                  >
                    /// VOCÊ TEVE SORTE DESTA VEZ ///
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>

            {/* Continue button */}
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onContinue}
              className="relative px-16 py-5 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl border-2 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_rgba(16,185,129,0.8)] transition-all duration-300 overflow-hidden group"
            >
              {/* Animated glow sweep */}
              <motion.div
                animate={{
                  x: ["-100%", "200%"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />

              <span className="relative text-2xl tracking-[0.25em] font-sans" style={{ fontWeight: 800 }}>
                CONTINUAR
              </span>
            </motion.button>

            {/* Bottom decorative text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.4 }}
              className="text-xs tracking-[0.4em] text-emerald-500/60 font-mono mt-4"
            >
              /// A PRÓXIMA PODE NÃO SER TÃO GENEROSA ///
            </motion.p>
          </div>

          {/* Pulsing border effect */}
          <motion.div
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0.98, 1, 0.98]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 border-4 border-emerald-500/30 pointer-events-none rounded-lg"
          />

          {/* Corner decorations - cyan/green theme */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="absolute top-8 left-8 w-32 h-32 border-l-4 border-t-4 border-cyan-400/40" />
            <div className="absolute top-8 right-8 w-32 h-32 border-r-4 border-t-4 border-emerald-400/40" />
            <div className="absolute bottom-8 left-8 w-32 h-32 border-l-4 border-b-4 border-emerald-400/40" />
            <div className="absolute bottom-8 right-8 w-32 h-32 border-r-4 border-b-4 border-cyan-400/40" />
          </motion.div>

          {/* Floating particles effect */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0,
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight
              }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [
                  Math.random() * window.innerHeight,
                  Math.random() * window.innerHeight - 200
                ],
                x: [
                  Math.random() * window.innerWidth,
                  Math.random() * window.innerWidth + (Math.random() - 0.5) * 100
                ]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className={`absolute w-2 h-2 rounded-full ${
                i % 2 === 0 ? 'bg-emerald-400' : 'bg-cyan-400'
              } blur-sm`}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

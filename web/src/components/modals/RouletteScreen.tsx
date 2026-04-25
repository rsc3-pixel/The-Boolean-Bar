import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Heart, Skull } from "lucide-react";

interface RouletteScreenProps {
  isVisible: boolean;
  playerName: string;
  bulletsInCylinder: number;
  totalChambers: number;
  /** Real result from C engine — determines the outcome deterministically */
  actualResult?: { survived: boolean } | null;
  onTriggerPull: () => void;
  onComplete?: (survived: boolean) => void;
}

export function RouletteScreen({
  isVisible,
  playerName,
  bulletsInCylinder,
  totalChambers,
  actualResult,
  onTriggerPull,
  onComplete
}: RouletteScreenProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedChamber, setSelectedChamber] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [survived, setSurvived] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);

  const survivalChance = Math.round(((totalChambers - bulletsInCylinder) / totalChambers) * 100);

  // Reset state when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setIsSpinning(false);
      setSelectedChamber(null);
      setShowResult(false);
      setSurvived(false);
      setIsShaking(false);
      setFlashOpacity(0);
    }
  }, [isVisible]);

  const handleTriggerPull = () => {
    setIsSpinning(true);
    onTriggerPull();

    // White flash on trigger pull
    setFlashOpacity(0.6);
    setTimeout(() => setFlashOpacity(0), 150);

    // Spin animation duration
    setTimeout(() => {
      // Use actual result from C engine if available, otherwise simulate
      const didSurvive = actualResult != null ? actualResult.survived : Math.random() > (bulletsInCylinder / totalChambers);

      // Select chamber visually — if died, land on a bullet chamber; if survived, land on empty
      let chamber: number;
      if (!didSurvive) {
        chamber = Math.floor(Math.random() * bulletsInCylinder); // Lands on bullet
      } else {
        chamber = bulletsInCylinder + Math.floor(Math.random() * (totalChambers - bulletsInCylinder)); // Lands on empty
      }
      setSelectedChamber(chamber);
      setSurvived(didSurvive);

      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);

        // Screen shake on death
        if (!didSurvive) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 600);
        }

        // Call completion callback
        setTimeout(() => {
          onComplete?.(didSurvive);
        }, 3000);
      }, 1500);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black"
          style={{
            animation: isShaking ? 'roulette-shake 0.1s ease-in-out 6' : 'none'
          }}
        >
          {/* CSS for shake animation */}
          <style>{`
            @keyframes roulette-shake {
              0%, 100% { transform: translate(0, 0); }
              25% { transform: translate(-8px, 4px); }
              50% { transform: translate(8px, -4px); }
              75% { transform: translate(-4px, -8px); }
            }
          `}</style>

          {/* White flash on trigger pull */}
          <motion.div
            animate={{ opacity: flashOpacity }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg-white z-50 pointer-events-none"
          />

          {/* Red tinted background with animated gradient */}
          <motion.div
            animate={{
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-red-900"
          />

          {/* Vignette effect */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 100%)'
          }} />

          {/* Scanlines */}
          <motion.div
            animate={{ y: ["-100%", "200%"] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent h-40 opacity-30"
          />

          {/* Warning indicators */}
          <div className="absolute top-12 left-12 flex items-center gap-3">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <AlertTriangle className="w-8 h-8 text-red-500 fill-red-500" />
            </motion.div>
            <span className="text-sm tracking-[0.3em] text-red-400 font-mono">PERIGO EXTREMO</span>
          </div>

          <div className="absolute top-12 right-12 flex items-center gap-3">
            <span className="text-sm tracking-[0.3em] text-red-400 font-mono">ROLETA RUSSA</span>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
            >
              <AlertTriangle className="w-8 h-8 text-red-500 fill-red-500" />
            </motion.div>
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center gap-12">
            {/* Player name */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs tracking-[0.4em] text-red-400/60 font-mono">JOGADOR NA MIRA:</span>
              <h2 className="text-4xl tracking-wider text-red-300 font-sans" style={{ fontWeight: 800 }}>
                {playerName}
              </h2>
            </motion.div>

            {/* Cylinder visualization */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="relative"
            >
              {/* Outer ring glow */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
                className="absolute inset-0 rounded-full bg-red-500/20 blur-3xl"
              />

              {/* Cylinder base */}
              <div className="relative w-80 h-80 rounded-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-4 border-red-900/50 shadow-[inset_0_0_60px_rgba(127,29,29,0.4),0_0_40px_rgba(127,29,29,0.3)]">
                {/* Center hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border-2 border-red-800/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />

                {/* Chambers */}
                {Array.from({ length: totalChambers }).map((_, index) => {
                  const angle = (index / totalChambers) * Math.PI * 2 - Math.PI / 2;
                  const radius = 110;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const hasBullet = index < bulletsInCylinder;
                  const isSelected = selectedChamber === index;

                  return (
                    <motion.div
                      key={index}
                      animate={isSpinning ? {
                        rotate: 360 * 5
                      } : {}}
                      transition={{
                        duration: 2,
                        ease: "easeOut"
                      }}
                      className="absolute top-1/2 left-1/2"
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                      }}
                    >
                      {/* Chamber slot */}
                      <motion.div
                        animate={isSelected && !isSpinning ? {
                          scale: [1, 1.3, 1],
                          rotate: [0, 360]
                        } : {}}
                        transition={{ duration: 0.8 }}
                        className={`
                          relative w-16 h-16 rounded-full
                          ${hasBullet
                            ? 'bg-gradient-to-br from-red-900 to-red-950 border-2 border-red-500'
                            : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700'
                          }
                          ${isSelected && !isSpinning ? 'ring-4 ring-red-400' : ''}
                          flex items-center justify-center
                          shadow-[inset_0_0_15px_rgba(0,0,0,0.6)]
                        `}
                      >
                        {hasBullet && (
                          <motion.div
                            animate={{
                              opacity: [0.6, 1, 0.6],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: index * 0.2
                            }}
                            className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                          />
                        )}

                        {/* Selected chamber indicator */}
                        {isSelected && !isSpinning && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -inset-2 rounded-full border-2 border-red-400 animate-ping"
                          />
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}

                {/* Spin indicator */}
                {isSpinning && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-red-500 to-transparent" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-8 items-center"
            >
              {/* Survival chance */}
              <div className="flex flex-col items-center gap-2 px-8 py-4 bg-zinc-950/50 border border-red-900/50 rounded-lg backdrop-blur-sm">
                <span className="text-xs tracking-[0.3em] text-zinc-500 font-mono">CHANCE DE SOBREVIVÊNCIA:</span>
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-emerald-400" />
                  <motion.span
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-4xl font-mono text-emerald-400"
                    style={{ fontWeight: 700 }}
                  >
                    {survivalChance}%
                  </motion.span>
                </div>
              </div>

              {/* Death chance */}
              <div className="flex flex-col items-center gap-2 px-8 py-4 bg-zinc-950/50 border border-red-900/50 rounded-lg backdrop-blur-sm">
                <span className="text-xs tracking-[0.3em] text-zinc-500 font-mono">CHANCE DE MORTE:</span>
                <div className="flex items-center gap-3">
                  <Skull className="w-6 h-6 text-red-400" />
                  <motion.span
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    className="text-4xl font-mono text-red-400"
                    style={{ fontWeight: 700 }}
                  >
                    {100 - survivalChance}%
                  </motion.span>
                </div>
              </div>
            </motion.div>

            {/* Trigger button */}
            {!showResult && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                whileHover={!isSpinning ? { scale: 1.05 } : {}}
                whileTap={!isSpinning ? { scale: 0.95 } : {}}
                onClick={handleTriggerPull}
                disabled={isSpinning}
                className={`
                  relative px-20 py-6 rounded-xl overflow-hidden
                  ${isSpinning
                    ? 'bg-zinc-900 border-2 border-zinc-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-700 to-red-800 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)] hover:shadow-[0_0_60px_rgba(239,68,68,0.8)]'
                  }
                  transition-all duration-300
                `}
              >
                {/* Pulsing glow */}
                {!isSpinning && (
                  <motion.div
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600"
                  />
                )}

                <span
                  className={`relative text-3xl tracking-[0.3em] font-sans ${isSpinning ? 'text-zinc-600' : 'text-white'}`}
                  style={{ fontWeight: 900 }}
                >
                  {isSpinning ? "GIRANDO..." : "PUXAR O GATILHO"}
                </span>
              </motion.button>
            )}

            {/* Result display */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
                  className={`
                    px-16 py-8 rounded-2xl border-4
                    ${survived
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]'
                      : 'bg-red-950/40 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.7)]'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-4">
                    {survived ? (
                      <Heart className="w-20 h-20 text-emerald-400 fill-emerald-400" strokeWidth={2.5} />
                    ) : (
                      <motion.div
                        animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Skull className="w-20 h-20 text-red-400" strokeWidth={2.5} />
                      </motion.div>
                    )}
                    <span
                      className={`text-5xl tracking-[0.2em] font-sans ${survived ? 'text-emerald-300' : 'text-red-300'}`}
                      style={{ fontWeight: 900 }}
                    >
                      {survived ? "SOBREVIVEU!" : "ELIMINADO!"}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Warning text */}
            {!showResult && (
              <motion.p
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs tracking-[0.4em] text-red-400/60 font-mono mt-4"
              >
                /// QUE A SORTE ESTEJA COM VOCÊ ///
              </motion.p>
            )}
          </div>

          {/* Border pulse */}
          <motion.div
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 border-8 border-red-500 pointer-events-none"
          />

          {/* Corner decorations */}
          <div className="absolute top-6 left-6 w-24 h-24 border-l-4 border-t-4 border-red-500/40" />
          <div className="absolute top-6 right-6 w-24 h-24 border-r-4 border-t-4 border-red-500/40" />
          <div className="absolute bottom-6 left-6 w-24 h-24 border-l-4 border-b-4 border-red-500/40" />
          <div className="absolute bottom-6 right-6 w-24 h-24 border-r-4 border-b-4 border-red-500/40" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

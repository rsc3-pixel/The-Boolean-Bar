import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, AlertTriangle } from "lucide-react";

interface DoubtCalledOverlayProps {
  isVisible: boolean;
  callerName: string;
  targetName: string;
  claimedBluff: string;
  onAnimationComplete?: () => void;
}

export function DoubtCalledOverlay({
  isVisible,
  callerName,
  targetName,
  claimedBluff,
  onAnimationComplete
}: DoubtCalledOverlayProps) {
  const [countdown, setCountdown] = useState(3);

  // Countdown timer (3 seconds)
  useEffect(() => {
    if (!isVisible) {
      setCountdown(3);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* CSS for effects */}
          <style>{`
            @keyframes doubt-shake {
              0%, 100% { transform: translate(0, 0); }
              10% { transform: translate(-6px, 3px); }
              20% { transform: translate(5px, -4px); }
              30% { transform: translate(-3px, -6px); }
              40% { transform: translate(6px, 2px); }
              50% { transform: translate(-4px, 5px); }
              60% { transform: translate(3px, -3px); }
              70% { transform: translate(-5px, -2px); }
              80% { transform: translate(4px, 4px); }
              90% { transform: translate(-2px, -5px); }
            }
            .doubt-entry-shake {
              animation: doubt-shake 0.4s ease-in-out;
            }
            @keyframes doubt-heartbeat {
              0%, 100% { transform: scale(1); }
              14% { transform: scale(1.06); }
              28% { transform: scale(1); }
              42% { transform: scale(1.08); }
              56% { transform: scale(1); }
            }
            .doubt-heartbeat {
              animation: doubt-heartbeat 1.2s ease-in-out infinite;
            }
          `}</style>

          {/* Red warning background with aggressive pulse */}
          <motion.div
            animate={{
              opacity: [0.5, 0.85, 0.5]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-br from-red-950 via-red-900 to-black"
          />

          {/* Aggressive vignette — darker edges for tunnel vision */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.95) 100%)'
          }} />

          {/* Scanline effect */}
          <motion.div
            animate={{ y: ["-100%", "200%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent h-32 opacity-50"
          />

          {/* Static noise overlay */}
          <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />

          {/* Radial pulse from center */}
          <motion.div
            animate={{
              scale: [0.8, 2.5, 0.8],
              opacity: [0.3, 0, 0.3]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-red-500/60"
          />
          <motion.div
            animate={{
              scale: [0.8, 3, 0.8],
              opacity: [0.2, 0, 0.2]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.3
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-red-400/40"
          />

          {/* Warning indicators - top corners */}
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute top-8 left-8 flex items-center gap-2"
          >
            <AlertTriangle className="w-6 h-6 text-red-400 fill-red-400" />
            <span className="text-xs tracking-widest text-red-400 font-mono">ALERTA</span>
          </motion.div>

          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
            className="absolute top-8 right-8 flex items-center gap-2"
          >
            <span className="text-xs tracking-widest text-red-400 font-mono">CONFRONTO</span>
            <AlertTriangle className="w-6 h-6 text-red-400 fill-red-400" />
          </motion.div>

          {/* Main content with heartbeat */}
          <div className="relative z-10 flex flex-col items-center gap-12 doubt-entry-shake doubt-heartbeat">
            {/* Dramatic title */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                duration: 0.8,
                bounce: 0.4
              }}
              className="relative"
            >
              {/* Jagged background effect */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 1, -1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-red-600/20 blur-3xl"
              />

              <h1
                className="relative text-8xl tracking-[0.2em] font-sans"
                style={{
                  fontWeight: 900,
                  WebkitTextStroke: '3px rgba(220, 38, 38, 0.8)',
                  textShadow: `
                    0 0 20px rgba(220, 38, 38, 0.8),
                    0 0 40px rgba(220, 38, 38, 0.6),
                    0 0 60px rgba(220, 38, 38, 0.4),
                    5px 5px 0px rgba(0, 0, 0, 0.8)
                  `,
                  color: '#ff4444',
                  transform: 'skew(-2deg)'
                }}
              >
                DESMASCARADO!
              </h1>

              {/* Glitch effect overlay */}
              <motion.div
                animate={{
                  opacity: [0, 0.8, 0],
                  x: [-2, 2, -2],
                  y: [-1, 1, -1]
                }}
                transition={{
                  duration: 0.2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute inset-0 text-8xl tracking-[0.2em] font-sans text-cyan-400 mix-blend-screen"
                style={{
                  fontWeight: 900,
                  WebkitTextStroke: '3px rgba(6, 182, 212, 0.6)',
                  transform: 'skew(-2deg)'
                }}
              >
                DESMASCARADO!
              </motion.div>
            </motion.div>

            {/* Claimed bluff type */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-sm tracking-[0.3em] text-red-400/60 font-mono">BLEFE DECLARADO:</span>
              <span className="text-2xl tracking-widest text-red-300 font-mono drop-shadow-[0_0_15px_rgba(252,165,165,0.6)]" style={{ fontWeight: 700 }}>
                {claimedBluff}
              </span>
            </motion.div>

            {/* Player confrontation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-8"
            >
              {/* Caller (challenger) */}
              <motion.div
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  {/* Pulse ring */}
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                    className="absolute inset-0 rounded-full border-4 border-red-400"
                  />

                  {/* Avatar */}
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-700 to-red-900 border-4 border-red-400 shadow-[0_0_40px_rgba(248,113,113,0.6)] flex items-center justify-center">
                    <span className="text-5xl font-bold text-red-100 font-sans">
                      {callerName.charAt(0)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs tracking-widest text-red-400/70 font-mono">DESAFIANTE</span>
                  <span className="text-xl tracking-wider text-red-200 font-sans" style={{ fontWeight: 700 }}>
                    {callerName}
                  </span>
                </div>
              </motion.div>

              {/* Electric VS effect in the middle */}
              <div className="relative">
                {/* Lightning bolts */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity
                  }}
                  className="relative"
                >
                  <Zap
                    className="w-20 h-20 text-red-500 fill-red-500"
                    strokeWidth={3}
                  />
                  {/* Glow overlay */}
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Zap className="w-20 h-20 text-yellow-300 fill-yellow-300 blur-md" strokeWidth={3} />
                  </motion.div>
                </motion.div>

                {/* Static lines */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scaleX: [0, 1, 0],
                      opacity: [0, 1, 0],
                      x: [0, Math.random() * 40 - 20, 0]
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                      delay: i * 0.1,
                      repeatDelay: 0.5
                    }}
                    className="absolute top-1/2 left-1/2 w-16 h-[2px] bg-gradient-to-r from-red-500 via-yellow-300 to-red-500"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${i * 30}deg)`
                    }}
                  />
                ))}
              </div>

              {/* Target (accused) */}
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  {/* Pulse ring */}
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: 0.5
                    }}
                    className="absolute inset-0 rounded-full border-4 border-red-400"
                  />

                  {/* Avatar */}
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-700 to-red-900 border-4 border-red-400 shadow-[0_0_40px_rgba(248,113,113,0.6)] flex items-center justify-center">
                    <span className="text-5xl font-bold text-red-100 font-sans">
                      {targetName.charAt(0)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs tracking-widest text-red-400/70 font-mono">ACUSADO</span>
                  <span className="text-xl tracking-wider text-red-200 font-sans" style={{ fontWeight: 700 }}>
                    {targetName}
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Countdown + Processing text */}
            <div className="flex flex-col items-center gap-4">
              {/* Countdown dots */}
              <div className="flex items-center gap-4">
                {[3, 2, 1].map((n) => (
                  <motion.div
                    key={n}
                    animate={{
                      scale: countdown === n ? [1, 1.4, 1] : 1,
                      opacity: countdown >= n ? 1 : 0.2
                    }}
                    transition={{ duration: 0.5 }}
                    className={`w-5 h-5 rounded-full border-2 ${
                      countdown >= n
                        ? 'border-red-400 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
                        : 'border-zinc-700 bg-zinc-800'
                    }`}
                  />
                ))}
              </div>

              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-sm tracking-[0.4em] text-red-400/80 font-mono"
              >
                /// VERIFICANDO VERACIDADE ///
              </motion.div>
            </div>
          </div>

          {/* Border flash effect — faster */}
          <motion.div
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="absolute inset-0 border-8 border-red-500 pointer-events-none"
          />

          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-red-500" />
          <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-red-500" />
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-red-500" />
          <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-red-500" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

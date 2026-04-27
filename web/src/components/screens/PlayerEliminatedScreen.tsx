import { motion, AnimatePresence } from "motion/react";
import { Skull, Flame, X } from "lucide-react";

interface PlayerEliminatedScreenProps {
  isVisible: boolean;
  playerName: string;
  cardsBurned: number;
  finalPosition?: number;
  totalPlayers?: number;
  ranking?: string[];   // Phase 5: ranking final completo
  onDismiss?: () => void;
}

export function PlayerEliminatedScreen({
  isVisible,
  playerName,
  cardsBurned,
  finalPosition = 0,
  totalPlayers,
  ranking,
  onDismiss
}: PlayerEliminatedScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black"
        >
          {/* Aggressive blood red background */}
          <motion.div
            animate={{
              opacity: [0.7, 0.9, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-red-900"
          />

          {/* Dark vignette */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/40 to-black" />

          {/* Blood splatter effect overlay */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0.2 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, #7f1d1d 0%, transparent 60%)`,
              filter: 'blur(80px)'
            }}
          />

          {/* Glitch scanlines */}
          <motion.div
            animate={{ 
              y: ["-100%", "200%"],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-red-600/20 to-transparent h-60"
          />

          {/* Glitch horizontal bars */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                x: [0, Math.random() * 100 - 50, 0],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                delay: i * 0.2,
                repeatDelay: 1
              }}
              className="absolute h-2 bg-red-600"
              style={{
                top: `${(i + 1) * 12}%`,
                left: 0,
                right: 0
              }}
            />
          ))}

          {/* Giant glitch skull background */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: 1,
              opacity: 0.15,
              rotate: [0, -2, 2, -1, 1, 0]
            }}
            transition={{
              scale: { duration: 0.5 },
              opacity: { duration: 0.5 },
              rotate: {
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: 2
              }
            }}
            className="absolute"
          >
            <Skull className="w-[600px] h-[600px] text-red-600/40" strokeWidth={1} />
          </motion.div>

          {/* Glitch effect on skull */}
          <motion.div
            animate={{
              opacity: [0, 1, 0],
              x: [0, -10, 10, -5, 5, 0],
              y: [0, 5, -5, 3, -3, 0]
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              repeatDelay: 1.5
            }}
            className="absolute"
          >
            <Skull className="w-[600px] h-[600px] text-cyan-500/20" strokeWidth={1} />
          </motion.div>

          {/* Main content — scrollable para não cortar o botão em telas pequenas */}
          <div className="relative z-10 w-full h-full overflow-y-auto flex flex-col items-center justify-start py-6 px-4 gap-4">
            {/* BANG! text — tamanho responsivo */}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.5 }}
              className="relative"
              style={{ marginBottom: '0.5rem' }}
            >
              {/* Main BANG text */}
              <motion.h1
                animate={{
                  textShadow: [
                    "0 0 40px rgba(220, 38, 38, 1), 0 0 80px rgba(220, 38, 38, 0.8)",
                    "0 0 60px rgba(220, 38, 38, 1), 0 0 100px rgba(220, 38, 38, 0.9)",
                    "0 0 40px rgba(220, 38, 38, 1), 0 0 80px rgba(220, 38, 38, 0.8)"
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-red-500 drop-shadow-[0_0_60px_rgba(220,38,38,1)] tracking-[0.1em]"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 900,
                  WebkitTextStroke: '2px rgba(0,0,0,0.8)',
                  fontSize: 'clamp(4rem, 15vw, 12rem)'
                }}
              >
                BANG!
              </motion.h1>

              {/* Glitch duplicates */}
              <motion.h1
                animate={{ opacity: [0, 0.6, 0], x: [0, -8, 8, -4, 0], y: [0, 4, -4, 2, 0] }}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 text-cyan-500 tracking-[0.1em]"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 'clamp(4rem, 15vw, 12rem)', WebkitTextStroke: '2px rgba(0,0,0,0.8)', mixBlendMode: 'screen' }}
              >
                BANG!
              </motion.h1>
            </motion.div>

            {/* Player eliminated text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
                className="flex items-center gap-4"
              >
                <X className="w-12 h-12 text-red-500" strokeWidth={4} />
                <h2 
                  className="text-6xl tracking-[0.2em] text-red-400"
                  style={{ 
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 900,
                    textShadow: '0 0 30px rgba(248, 113, 113, 0.8)'
                  }}
                >
                  {playerName} ELIMINADO
                </h2>
                <X className="w-12 h-12 text-red-500" strokeWidth={4} />
              </motion.div>

              {/* Separator line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"
              />
            </motion.div>

            {/* Stats panel - brutal style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="relative mt-6 w-[700px] bg-black/80 border-4 border-red-900/70 rounded-lg overflow-hidden"
            >
              {/* Blood drip effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-red-600 to-transparent" />
              
              <div className="p-8">
                {/* Stats header */}
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-red-900/50">
                  <Skull className="w-8 h-8 text-red-500" strokeWidth={2.5} />
                  <h3 className="text-2xl tracking-[0.3em] text-red-400 font-mono" style={{ fontWeight: 800 }}>
                    ESTATÍSTICAS FINAIS
                  </h3>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-6">
                  {/* Lives */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-red-950/60 to-black/60 border-2 border-red-800/40 rounded-lg"
                  >
                    <span className="text-xs tracking-[0.3em] text-zinc-500 font-mono">VIDAS:</span>
                    <div className="flex items-center gap-2">
                      <motion.span
                        animate={{
                          opacity: [0.6, 1, 0.6],
                          color: ["#dc2626", "#7f1d1d", "#dc2626"]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity
                        }}
                        className="text-7xl font-mono"
                        style={{ fontWeight: 900 }}
                      >
                        0
                      </motion.span>
                    </div>
                    <span className="text-xs text-red-400 font-mono">/// MORTO ///</span>
                  </motion.div>

                  {/* Cards burned */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-orange-950/40 to-black/60 border-2 border-orange-800/40 rounded-lg"
                  >
                    <span className="text-xs tracking-[0.3em] text-zinc-500 font-mono">CARTAS QUEIMADAS:</span>
                    <div className="flex items-center gap-3">
                      <Flame className="w-10 h-10 text-orange-500" />
                      <motion.span
                        animate={{
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity
                        }}
                        className="text-6xl font-mono text-orange-400"
                        style={{ fontWeight: 800 }}
                      >
                        {cardsBurned}
                      </motion.span>
                    </div>
                    <span className="text-xs text-orange-400/60 font-mono">DESTRUÍDAS</span>
                  </motion.div>

                  {/* Final position */}
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-zinc-900/60 to-black/60 border-2 border-zinc-700/40 rounded-lg"
                  >
                    <span className="text-xs tracking-[0.3em] text-zinc-500 font-mono">POSIÇÃO FINAL:</span>
                    <div className="flex items-center gap-2">
                      <motion.span
                        className="text-6xl font-mono text-zinc-400"
                        style={{ fontWeight: 800 }}
                      >
                        #{finalPosition}
                      </motion.span>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono">DE {totalPlayers ?? 7} JOGADORES</span>
                  </motion.div>
                </div>

                {/* Phase 5: ranking final */}
                {ranking && ranking.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="mt-6"
                  >
                    <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-mono mb-3 text-center">Ranking Final</div>
                    <ol className="space-y-1.5">
                      {ranking.map((name, idx) => {
                        const pos = idx + 1;
                        const isWinner = pos === 1;
                        const isMe = name === playerName;
                        return (
                          <li
                            key={name}
                            className={`flex items-center gap-3 px-4 py-2 rounded-md font-mono ${
                              isWinner ? "bg-cyan-500/10 border border-cyan-400/30" :
                              isMe ? "bg-red-950/30 border border-red-700/40" :
                              "bg-zinc-900/40 border border-zinc-800"
                            }`}
                          >
                            <span className={`w-6 text-right ${isWinner ? "text-yellow-400" : isMe ? "text-red-400" : "text-zinc-500"}`} style={{ fontWeight: 700 }}>
                              {isWinner ? "🏆" : `${pos}º`}
                            </span>
                            <span className={isWinner ? "text-cyan-200" : isMe ? "text-red-300" : "text-zinc-400"}>
                              {name}{isMe ? " (você)" : ""}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </motion.div>
                )}

                {/* Brutal message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-6 p-4 bg-red-950/30 border-2 border-red-900/50 rounded-md"
                >
                  <motion.p
                    animate={{
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                    className="text-center text-lg tracking-[0.25em] text-red-400/90 font-mono"
                    style={{ fontWeight: 600 }}
                  >
                    /// SEM SEGUNDAS CHANCES. SEM RETORNO. ///
                  </motion.p>
                </motion.div>
              </div>
            </motion.div>

            {/* Dismiss button — sempre visível com padding inferior */}
            {onDismiss && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDismiss}
                className="mt-4 mb-8 px-12 py-4 bg-zinc-900 border-2 border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-500 hover:text-zinc-300 transition-all duration-300 font-mono tracking-wider"
                style={{ fontWeight: 600 }}
              >
                CONTINUAR OBSERVANDO
              </motion.button>
            )}
          </div>

          {/* Pulsing red border */}
          <motion.div
            animate={{
              opacity: [0.2, 0.6, 0.2],
              boxShadow: [
                'inset 0 0 0px rgba(220, 38, 38, 0)',
                'inset 0 0 100px rgba(220, 38, 38, 0.5)',
                'inset 0 0 0px rgba(220, 38, 38, 0)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
            className="absolute inset-0 border-[10px] border-red-600 pointer-events-none"
          />

          {/* Corner blood splatters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.2 }}
          >
            <div 
              className="absolute top-0 left-0 w-64 h-64"
              style={{
                backgroundImage: 'radial-gradient(circle at 0% 0%, #7f1d1d 0%, transparent 60%)',
                filter: 'blur(40px)'
              }}
            />
            <div 
              className="absolute top-0 right-0 w-64 h-64"
              style={{
                backgroundImage: 'radial-gradient(circle at 100% 0%, #7f1d1d 0%, transparent 60%)',
                filter: 'blur(40px)'
              }}
            />
            <div 
              className="absolute bottom-0 left-0 w-64 h-64"
              style={{
                backgroundImage: 'radial-gradient(circle at 0% 100%, #7f1d1d 0%, transparent 60%)',
                filter: 'blur(40px)'
              }}
            />
            <div 
              className="absolute bottom-0 right-0 w-64 h-64"
              style={{
                backgroundImage: 'radial-gradient(circle at 100% 100%, #7f1d1d 0%, transparent 60%)',
                filter: 'blur(40px)'
              }}
            />
          </motion.div>

          {/* Static noise overlay */}
          <motion.div
            animate={{
              opacity: [0.02, 0.05, 0.02]
            }}
            transition={{
              duration: 0.1,
              repeat: Infinity
            }}
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='6.5' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat',
              opacity: 0.15
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

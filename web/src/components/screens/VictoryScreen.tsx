import { motion, AnimatePresence } from "motion/react";
import { Circle, ArrowLeft, Trophy } from "lucide-react";

interface VictoryScreenProps {
  isVisible: boolean;
  playerName: string;
  opponentsDefeated: number;
  triggersPulled: number;
  bluffsSuccessful: number;
  doubtsWon: number;
  onLeaveBar: () => void;
}

export function VictoryScreen({
  isVisible,
  playerName,
  opponentsDefeated,
  triggersPulled,
  bluffsSuccessful,
  doubtsWon,
  onLeaveBar
}: VictoryScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black overflow-hidden"
        >
          {/* Dark mode background with soft radial glow */}
          <motion.div
            animate={{
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-radial from-cyan-900/20 via-black to-black"
          />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)',
                backgroundSize: '80px 80px'
              }} 
            />
          </div>

          {/* Floating casino chips */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`chip-${i}`}
              initial={{ 
                opacity: 0,
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 600,
                y: window.innerHeight + 50,
                rotate: Math.random() * 360
              }}
              animate={{
                opacity: [0, 0.4, 0.4, 0],
                y: -100,
                rotate: Math.random() * 720
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "linear"
              }}
              className="absolute"
            >
              <Circle 
                className={`${
                  i % 3 === 0 ? 'w-10 h-10 text-cyan-400' : 
                  i % 3 === 1 ? 'w-8 h-8 text-cyan-300' : 
                  'w-12 h-12 text-cyan-500'
                } fill-current opacity-60`}
                style={{ 
                  filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.5))' 
                }}
              />
            </motion.div>
          ))}

          {/* BACK TO MAIN MENU - Top Left Corner */}
          <motion.button
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLeaveBar}
            className="absolute top-8 left-8 z-20 flex items-center gap-3 px-6 py-3 bg-transparent backdrop-blur-sm border-2 border-cyan-400/50 rounded-xl text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/30 hover:border-cyan-300/80 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-300"
          >
            <motion.div
              animate={{ x: [-2, 2, -2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
            </motion.div>
            <span className="text-sm tracking-[0.2em] font-mono" style={{ fontWeight: 700 }}>
              BACK TO MAIN MENU
            </span>
          </motion.button>

          {/* Main content - Perfectly centered */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-0 w-full max-w-3xl px-8">
            
            {/* "THE SOLE SURVIVOR" - Top text */}
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                delay: 0.3,
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              className="mb-12 relative"
            >
              {/* Soft outer glow */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 blur-2xl bg-cyan-500/40"
              />

              <h1 
                className="relative text-7xl tracking-[0.2em] text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400"
                style={{ 
                  fontFamily: 'Inter, sans-serif', 
                  fontWeight: 900,
                  textShadow: '0 0 40px rgba(6, 182, 212, 0.6)'
                }}
              >
                THE SOLE SURVIVOR
              </h1>
            </motion.div>

            {/* Central glassmorphism square panel */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                delay: 0.5,
                duration: 0.8,
                type: "spring",
                stiffness: 120
              }}
              className="relative w-full aspect-square max-w-2xl bg-zinc-950/50 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.25),inset_0_0_60px_rgba(6,182,212,0.08)] overflow-hidden"
            >
              {/* Glass reflection overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Top edge subtle glow */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

              {/* Animated scan line */}
              <motion.div
                animate={{ y: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent pointer-events-none"
              />

              <div className="relative h-full flex flex-col items-center justify-between p-12">
                
                {/* Player avatar with casino chips */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.8,
                    duration: 0.9,
                    type: "spring",
                    stiffness: 150,
                    bounce: 0.4
                  }}
                  className="relative flex flex-col items-center gap-6 mt-4"
                >
                  {/* Avatar circle with trophy */}
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 30px rgba(6, 182, 212, 0.5)',
                        '0 0 50px rgba(6, 182, 212, 0.8)',
                        '0 0 30px rgba(6, 182, 212, 0.5)'
                      ]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative w-44 h-44 rounded-full bg-gradient-to-br from-cyan-500 via-cyan-400 to-cyan-500 border-4 border-cyan-300/80 flex items-center justify-center overflow-hidden"
                  >
                    {/* Inner radial glow */}
                    <div className="absolute inset-0 bg-gradient-radial from-white/30 via-transparent to-transparent" />
                    
                    {/* Trophy icon */}
                    <Trophy className="w-24 h-24 text-white relative z-10" strokeWidth={2.5} />
                    
                    {/* Rotating outer ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="absolute inset-0 border-4 border-transparent border-t-cyan-100 border-r-cyan-100/50 rounded-full"
                    />

                    {/* Floating chips around avatar */}
                    {[0, 72, 144, 216, 288].map((angle, i) => (
                      <motion.div
                        key={`avatar-chip-${i}`}
                        animate={{
                          rotate: [angle, angle + 360],
                          scale: [1, 1.1, 1]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 0.2
                        }}
                        className="absolute"
                        style={{
                          left: '50%',
                          top: '50%',
                          marginLeft: '-12px',
                          marginTop: '-12px',
                          transformOrigin: '12px 12px'
                        }}
                      >
                        <div 
                          className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-300"
                          style={{ 
                            transform: `translate(${Math.cos(angle * Math.PI / 180) * 100}px, ${Math.sin(angle * Math.PI / 180) * 100}px)`,
                            filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.6))'
                          }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Player name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-xs tracking-[0.4em] text-cyan-400/60 font-mono uppercase">Vencedor</span>
                    <motion.h2
                      animate={{
                        textShadow: [
                          '0 0 15px rgba(6, 182, 212, 0.5)',
                          '0 0 25px rgba(6, 182, 212, 0.8)',
                          '0 0 15px rgba(6, 182, 212, 0.5)'
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                      className="text-5xl tracking-[0.1em] text-cyan-300 font-sans"
                      style={{ fontWeight: 900 }}
                    >
                      {playerName}
                    </motion.h2>
                  </motion.div>
                </motion.div>

                {/* Divider line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.3, duration: 0.6 }}
                  className="w-3/4 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent"
                />

                {/* Post-game stats - 2 columns, perfectly centered */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="w-full grid grid-cols-2 gap-x-8 gap-y-4 mb-4"
                >
                  {/* Left column */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    className="flex items-center justify-between px-4 py-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg"
                  >
                    <span className="text-sm tracking-wider text-cyan-300/80 font-mono">Oponentes Derrotados:</span>
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1.8 }}
                      className="text-2xl font-mono text-cyan-400"
                      style={{ fontWeight: 900 }}
                    >
                      {opponentsDefeated}
                    </motion.span>
                  </motion.div>

                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.7 }}
                    className="flex items-center justify-between px-4 py-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg"
                  >
                    <span className="text-sm tracking-wider text-cyan-300/80 font-mono">Blefes Bem-Sucedidos:</span>
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1.9 }}
                      className="text-2xl font-mono text-cyan-400"
                      style={{ fontWeight: 900 }}
                    >
                      {bluffsSuccessful}
                    </motion.span>
                  </motion.div>

                  {/* Right column */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="flex items-center justify-between px-4 py-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg"
                  >
                    <span className="text-sm tracking-wider text-cyan-300/80 font-mono">Dúvidas Ganhas:</span>
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 2.0 }}
                      className="text-2xl font-mono text-cyan-400"
                      style={{ fontWeight: 900 }}
                    >
                      {doubtsWon}
                    </motion.span>
                  </motion.div>

                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.9 }}
                    className="flex items-center justify-between px-4 py-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg"
                  >
                    <span className="text-sm tracking-wider text-cyan-300/80 font-mono">Gatilhos Puxados:</span>
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 2.1 }}
                      className="text-2xl font-mono text-cyan-400"
                      style={{ fontWeight: 900 }}
                    >
                      {triggersPulled}
                    </motion.span>
                  </motion.div>
                </motion.div>
              </div>

              {/* Pulsing border glow */}
              <motion.div
                animate={{
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-3xl border-2 border-cyan-400/40 pointer-events-none"
                style={{
                  boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)'
                }}
              />
            </motion.div>

            {/* Bottom message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              className="mt-12 text-center"
            >
              <motion.span
                animate={{
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity
                }}
                className="text-base tracking-[0.3em] text-cyan-400/70 font-mono"
                style={{ fontWeight: 600 }}
              >
                /// LÓGICA PURA. FRIEZA ABSOLUTA. ///
              </motion.span>
            </motion.p>
          </div>

          {/* Symmetrical corner decorations */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            {/* Top corners */}
            <div className="absolute top-12 left-12 w-32 h-32 border-l-2 border-t-2 border-cyan-400/30" />
            <div className="absolute top-12 right-12 w-32 h-32 border-r-2 border-t-2 border-cyan-400/30" />
            
            {/* Bottom corners */}
            <div className="absolute bottom-12 left-12 w-32 h-32 border-l-2 border-b-2 border-cyan-400/30" />
            <div className="absolute bottom-12 right-12 w-32 h-32 border-r-2 border-b-2 border-cyan-400/30" />
          </motion.div>

          {/* Subtle particle burst from center */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            return (
              <motion.div
                key={`particle-${i}`}
                initial={{ 
                  opacity: 0,
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2,
                  scale: 0
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  x: window.innerWidth / 2 + Math.cos(angle * Math.PI / 180) * 400,
                  y: window.innerHeight / 2 + Math.sin(angle * Math.PI / 180) * 400,
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  delay: 0.6 + (i * 0.02),
                  ease: "easeOut"
                }}
                className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                style={{
                  filter: 'blur(1px)',
                  boxShadow: '0 0 8px rgba(6, 182, 212, 0.8)'
                }}
              />
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

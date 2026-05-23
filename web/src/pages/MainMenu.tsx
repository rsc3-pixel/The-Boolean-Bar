import { motion } from "motion/react";
import { BookOpen, DoorOpen, Users, Trophy } from "lucide-react";

// ─── ANIMATION CONSTANTS ──────────────────────────────────────────────
const HEARTBEAT_DURATION = 1.4;
const HEARTBEAT_TIMING = [0, 0.08, 0.18, 0.26, 0.4, 1];
const HEARTBEAT_OPACITY = [0.55, 1, 0.7, 1, 0.55, 0.55];
const HEARTBEAT_SCALE = [1, 1.04, 1.01, 1.04, 1, 1];

const HEARTBEAT_ANIMATION = {
  opacity: HEARTBEAT_OPACITY,
  scale: HEARTBEAT_SCALE,
};

const HEARTBEAT_TRANSITION = {
  duration: HEARTBEAT_DURATION,
  times: HEARTBEAT_TIMING,
  repeat: Infinity,
  ease: "easeInOut",
};

interface MainMenuProps {
  onEnterOnline: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  onFlee: () => void;
}

export function MainMenu({ onEnterOnline, onOpenLeaderboard, onOpenRules, onFlee }: MainMenuProps) {
  return (
    <div className="size-full bg-black overflow-hidden relative flex items-center justify-center">
      {/* Deep black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Floating binary code and operators */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(40)].map((_, i) => {
          const operators = ['0', '1', 'AND', 'OR', 'NOT', 'XOR', '→', '↔', '∧', '∨', '¬', '⊕', 'T', 'F'];
          const randomOp = operators[Math.floor(Math.random() * operators.length)];
          const randomX = Math.random() * 100;
          const randomY = Math.random() * 100;
          const randomDuration = 20 + Math.random() * 25;
          const randomDelay = Math.random() * 8;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: `${randomX}vw`, y: `${randomY}vh` }}
              animate={{
                opacity: [0, 0.3, 0],
                y: [`${randomY}vh`, `${randomY - 40}vh`],
              }}
              transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: randomDelay,
                ease: "linear"
              }}
              className="absolute text-cyan-500/30 font-mono text-xs"
              style={{
                textShadow: '0 0 8px rgba(6, 182, 212, 0.4)'
              }}
            >
              {randomOp}
            </motion.div>
          );
        })}
      </div>

      {/* Main content - centered vertical stack */}
      <div className="relative z-10 flex flex-col items-center gap-0">
        {/* Logo section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 sm:gap-6 mb-8 sm:mb-20"
        >
          {/* Decorative top line — pulsa junto com o título */}
          <motion.div
            initial={{ width: 0, opacity: 0.5 }}
            animate={{
              width: "min(400px, 90vw)",
              opacity: [0.4, 1, 0.6, 1, 0.4, 0.4],
            }}
            transition={{
              width: { duration: 1.5, delay: 0.3 },
              opacity: { ...HEARTBEAT_TRANSITION, delay: 1.5 },
            }}
            className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
          />

          {/* Main title — pulsa em ritmo de coração (lub-dub ___ pause) */}
          <motion.h1
            className="text-3xl sm:text-5xl md:text-7xl tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400 px-4 text-center"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
            }}
            animate={{
              textShadow: [
                '0 0 30px rgba(6, 182, 212, 0.4), 0 0 50px rgba(6, 182, 212, 0.25)',   // baseline
                '0 0 80px rgba(6, 182, 212, 1), 0 0 130px rgba(6, 182, 212, 0.7)',     // lub (pico 1)
                '0 0 50px rgba(6, 182, 212, 0.6), 0 0 80px rgba(6, 182, 212, 0.4)',    // ease
                '0 0 80px rgba(6, 182, 212, 1), 0 0 130px rgba(6, 182, 212, 0.7)',     // dub (pico 2)
                '0 0 30px rgba(6, 182, 212, 0.4), 0 0 50px rgba(6, 182, 212, 0.25)',   // back to baseline
                '0 0 30px rgba(6, 182, 212, 0.4), 0 0 50px rgba(6, 182, 212, 0.25)',   // pause longa
              ],
            }}
            transition={HEARTBEAT_TRANSITION}
          >
            THE BOOLEAN BAR
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-xs tracking-[0.4em] text-zinc-600 font-mono uppercase"
          >
            Lógica ou Morte
          </motion.p>

          {/* Decorative bottom line — pulsa junto com o título */}
          <motion.div
            initial={{ width: 0, opacity: 0.5 }}
            animate={{
              width: "min(400px, 90vw)",
              opacity: [0.4, 1, 0.6, 1, 0.4, 0.4],
            }}
            transition={{
              width: { duration: 1.5, delay: 0.3 },
              opacity: { ...HEARTBEAT_TRANSITION, delay: 1.5 },
            }}
            className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
          />
        </motion.div>

        {/* THREE DISTINCT BUTTONS - Vertical Stack */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex flex-col gap-3 sm:gap-6 items-center w-full"
        >
          {/* 1. MASSIVE GLOWING CYAN BUTTON - "MULTIPLAYER ONLINE" (botão principal) */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onEnterOnline}
            className="group relative w-[90vw] max-w-[600px] h-[80px] sm:h-[100px] bg-cyan-500 rounded-2xl overflow-hidden transition-all duration-500"
            style={{
              boxShadow: '0 0 60px rgba(6, 182, 212, 0.8), 0 0 100px rgba(6, 182, 212, 0.5), inset 0 0 40px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Heartbeat glow — sincronizado com o título (lub-dub ___ pause) */}
            <motion.div
              animate={HEARTBEAT_ANIMATION}
              transition={HEARTBEAT_TRANSITION}
              className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-400"
            />

            {/* Animated shine sweep */}
            <motion.div
              animate={{
                x: ['-200%', '200%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 1
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
            />

            {/* Button text */}
            <div className="relative h-full flex items-center justify-center gap-3 sm:gap-4 px-4">
              <Users className="w-7 h-7 sm:w-9 sm:h-9 text-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] shrink-0" strokeWidth={2} />
              <div className="flex flex-col items-start gap-0.5 sm:gap-1">
                <span
                  className="text-2xl sm:text-4xl tracking-[0.15em] sm:tracking-[0.25em] text-black font-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                  style={{ fontWeight: 900 }}
                >
                  MULTIPLAYER
                </span>
                <span className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] text-cyan-950/80 font-mono uppercase">
                  Crie ou entre numa sala
                </span>
              </div>
            </div>

            {/* Hover glow amplification */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: '0 0 100px rgba(6, 182, 212, 1), 0 0 150px rgba(6, 182, 212, 0.8)'
              }}
            />
          </motion.button>

          {/* 1.5 ARCADE YELLOW BUTTON - "HIGH SCORES" (capstone: ranking persistido) */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenLeaderboard}
            className="group relative w-[90vw] max-w-[600px] h-[70px] sm:h-[85px] bg-transparent backdrop-blur-sm border-2 border-yellow-400/40 rounded-xl overflow-hidden transition-all duration-300 hover:border-yellow-300/70"
            style={{
              background: 'rgba(234, 179, 8, 0.04)',
              boxShadow: '0 0 30px rgba(234, 179, 8, 0.18), inset 0 0 30px rgba(234, 179, 8, 0.05)'
            }}
          >
            {/* Scanlines arcade */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(234,179,8,0.6) 2px, rgba(234,179,8,0.6) 3px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-yellow-400/20 to-yellow-500/10"
            />
            <div className="relative h-full flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-8">
              <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-300 shrink-0" strokeWidth={1.8} />
              <div className="flex flex-col items-start gap-0.5">
                <span
                  className="text-xl sm:text-3xl tracking-[0.18em] sm:tracking-[0.25em] text-yellow-200 font-sans"
                  style={{ fontWeight: 800 }}
                >
                  HIGH SCORES
                </span>
                <span className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] text-yellow-400/60 font-mono uppercase">
                  Hall of Champions
                </span>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ boxShadow: '0 0 40px rgba(234, 179, 8, 0.45)' }}
            />
          </motion.button>

          {/* 2. GLASSMORPHISM OUTLINED BUTTON - "RULES OF LOGIC" */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenRules}
            className="group relative w-[90vw] max-w-[600px] h-[70px] sm:h-[85px] bg-transparent backdrop-blur-sm border-2 border-cyan-400/40 rounded-xl overflow-hidden transition-all duration-300 hover:border-cyan-300/60"
            style={{
              background: 'rgba(6, 182, 212, 0.03)',
              boxShadow: '0 0 30px rgba(6, 182, 212, 0.15), inset 0 0 30px rgba(6, 182, 212, 0.05)'
            }}
          >
            {/* Glassmorphic overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />

            {/* Hover glow */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-400/20 to-cyan-500/10"
            />

            {/* Button content */}
            <div className="relative h-full flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-8">
              <BookOpen className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-400 shrink-0" strokeWidth={1.5} />
              <div className="flex flex-col items-start gap-0.5">
                <span
                  className="text-xl sm:text-3xl tracking-[0.15em] sm:tracking-[0.2em] text-cyan-300 font-sans"
                  style={{ fontWeight: 700 }}
                >
                  RULES OF LOGIC
                </span>
                <span className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] text-cyan-500/60 font-mono uppercase">
                  Settings & Instructions
                </span>
              </div>
            </div>

            {/* Border glow on hover */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)'
              }}
            />
          </motion.button>

          {/* 3. DIM RED GLOW BUTTON - "FLEE" */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (window.confirm('Sair do Boolean Bar? A aba vai fechar.')) {
                onFlee();
              }
            }}
            className="group relative w-[90vw] max-w-[600px] h-[70px] sm:h-[85px] bg-transparent border-2 border-red-600/40 rounded-xl overflow-hidden transition-all duration-300 hover:border-red-500/60"
            style={{
              background: 'rgba(127, 29, 29, 0.15)',
              boxShadow: '0 0 25px rgba(220, 38, 38, 0.3), inset 0 0 25px rgba(220, 38, 38, 0.1)'
            }}
          >
            {/* Subtle pulsing red glow */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-red-800/30 to-red-900/20"
            />

            {/* Hover glow */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-red-500/30 to-red-600/20"
            />

            {/* Button content */}
            <div className="relative h-full flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-8">
              <DoorOpen className="w-5 h-5 sm:w-7 sm:h-7 text-red-400/80 shrink-0" strokeWidth={1.5} />
              <div className="flex flex-col items-start gap-0.5">
                <span
                  className="text-xl sm:text-3xl tracking-[0.15em] sm:tracking-[0.2em] text-red-300/90 font-sans"
                  style={{ fontWeight: 700 }}
                >
                  FLEE
                </span>
                <span className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] text-red-500/50 font-mono uppercase">
                  Quit
                </span>
              </div>
            </div>

            {/* Border glow on hover */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                boxShadow: '0 0 35px rgba(220, 38, 38, 0.4)'
              }}
            />
          </motion.button>
        </motion.div>

        {/* Warning text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          className="text-xs tracking-[0.3em] text-red-500/40 font-mono mt-16 uppercase"
        >
          /// Only Logical Minds Survive ///
        </motion.p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-20 h-20 border-l border-t border-cyan-500/20" />
      <div className="absolute top-8 right-8 w-20 h-20 border-r border-t border-cyan-500/20" />
      <div className="absolute bottom-8 left-8 w-20 h-20 border-l border-b border-cyan-500/20" />
      <div className="absolute bottom-8 right-8 w-20 h-20 border-r border-b border-cyan-500/20" />
    </div>
  );
}
import { motion } from "motion/react";

interface LogicCardProps {
  formula: string;
  isCenter?: boolean;
  onClick?: () => void;
}

export function LogicCard({ formula, isCenter = false, onClick }: LogicCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={onClick}
      className={`
        relative cursor-pointer
        ${isCenter ? 'w-48 h-64' : 'w-32 h-44'}
        bg-gradient-to-br from-zinc-900 via-zinc-950 to-black
        border-2 border-cyan-500/30
        rounded-lg
        flex items-center justify-center
        shadow-[0_0_20px_rgba(6,182,212,0.3)]
        hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]
        hover:border-cyan-400/50
        transition-all duration-300
      `}
    >
      {/* Corner decorations */}
      <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-cyan-400/60" />
      <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-cyan-400/60" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-cyan-400/60" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-cyan-400/60" />

      {/* Formula */}
      <div className={`
        ${isCenter ? 'text-3xl' : 'text-base sm:text-lg'}
        font-mono text-cyan-300 font-bold
        tracking-wider
        text-center px-4
        drop-shadow-[0_0_8px_rgba(103,232,249,0.6)]
      `}>
        {formula}
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent rounded-lg pointer-events-none" />
    </motion.div>
  );
}

import { motion } from "motion/react";

interface TurnTimerBarProps {
  seconds: number;
  total: number;
  active: boolean;
}

export function TurnTimerBar({ seconds, total, active }: TurnTimerBarProps) {
  if (!active) return null;

  const percentage = (seconds / total) * 100;
  
  // Cores baseadas no tempo restante
  let color = "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]";
  if (percentage < 25) {
    color = "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
  } else if (percentage < 50) {
    color = "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
  }

  return (
    <div className="w-full h-1 bg-zinc-900 overflow-hidden relative">
      <motion.div
        initial={false}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: "linear" }}
        className={`h-full ${color} transition-colors duration-500`}
      />
      
      {/* Glow effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
    </div>
  );
}

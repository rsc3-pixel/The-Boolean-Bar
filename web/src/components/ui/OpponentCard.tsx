import { Heart, Skull } from "lucide-react";
import { motion } from "motion/react";

interface OpponentCardProps {
  name: string;
  lives: number;
  cardsInHand: number;
  isEliminated?: boolean;
}

export function OpponentCard({ name, lives, cardsInHand, isEliminated = false }: OpponentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative
        w-32 h-40
        rounded-lg
        border
        ${isEliminated
          ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
          : 'bg-zinc-900/60 border-zinc-700/50 shadow-[0_0_15px_rgba(0,0,0,0.3)]'
        }
        backdrop-blur-md
        flex flex-col items-center justify-center
        p-3
        transition-all duration-500
      `}
    >
      {isEliminated && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <Skull className="w-16 h-16 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" strokeWidth={2.5} />
        </motion.div>
      )}

      <div className={`flex flex-col items-center gap-2 ${isEliminated ? 'opacity-30' : ''}`}>
        {/* Avatar circle */}
        <div className={`
          w-14 h-14 rounded-full
          ${isEliminated ? 'bg-red-900/40' : 'bg-gradient-to-br from-zinc-700 to-zinc-800'}
          border-2
          ${isEliminated ? 'border-red-500/60' : 'border-zinc-600'}
          flex items-center justify-center
        `}>
          <span className="text-xl font-bold text-zinc-300 font-sans">
            {name.charAt(0)}
          </span>
        </div>

        {/* Name */}
        <span className="text-sm font-bold font-sans text-zinc-200 tracking-wide">{name}</span>

        {/* Lives */}
        <div className="flex items-center gap-1.5">
          {!isEliminated && (
            <>
              <Heart className="w-4 h-4 text-red-400 fill-red-400" />
              <span className="text-sm font-bold font-mono text-red-400">{lives}</span>
            </>
          )}
          {isEliminated && (
            <span className="text-[10px] font-bold font-mono text-red-500">ELIMINADO</span>
          )}
        </div>

        {/* Cards in hand */}
        {!isEliminated && (
          <div className="text-xs font-bold font-mono text-cyan-400">
            {cardsInHand} CARTAS
          </div>
        )}
      </div>
    </motion.div>
  );
}

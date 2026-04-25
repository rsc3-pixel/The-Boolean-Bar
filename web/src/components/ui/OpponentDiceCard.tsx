import { Heart, Skull, Dices } from "lucide-react";
import { motion } from "motion/react";

interface OpponentDiceCardProps {
  name: string;
  diceRemaining: number;
  isEliminated?: boolean;
  isCurrentTurn?: boolean;
}

export function OpponentDiceCard({ name, diceRemaining, isEliminated = false, isCurrentTurn = false }: OpponentDiceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative
        w-32 h-44
        rounded-lg
        border-2
        ${isEliminated
          ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
          : isCurrentTurn
            ? 'bg-cyan-950/30 border-cyan-400/70 shadow-[0_0_30px_rgba(6,182,212,0.5)]'
            : 'bg-zinc-900/60 border-zinc-700/50 shadow-[0_0_15px_rgba(0,0,0,0.3)]'
        }
        backdrop-blur-md
        flex flex-col items-center justify-center
        p-3
        transition-all duration-500
      `}
    >
      {/* Active turn pulse ring */}
      {isCurrentTurn && !isEliminated && (
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-lg border-2 border-cyan-400/60"
        />
      )}

      {/* Turn indicator badge */}
      {isCurrentTurn && !isEliminated && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-cyan-500 rounded-full z-10"
        >
          <span className="text-[9px] font-mono font-bold text-black tracking-wider">TURNO</span>
        </motion.div>
      )}

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
          ${isEliminated ? 'bg-red-900/40' : isCurrentTurn ? 'bg-gradient-to-br from-cyan-700 to-cyan-900' : 'bg-gradient-to-br from-zinc-700 to-zinc-800'}
          border-2
          ${isEliminated ? 'border-red-500/60' : isCurrentTurn ? 'border-cyan-400' : 'border-zinc-600'}
          flex items-center justify-center
        `}>
          <span className={`text-xl font-bold font-sans ${isCurrentTurn ? 'text-cyan-200' : 'text-zinc-300'}`}>
            {name.charAt(0)}
          </span>
        </div>

        {/* Name */}
        <span className={`text-sm font-bold font-sans tracking-wide ${isCurrentTurn ? 'text-cyan-200' : 'text-zinc-200'}`}>
          {name}
        </span>

        {/* Lives removed, Liar's Dice uses only dice count */}

        {/* Dice Remaining — Cup icon for mystery */}
        {!isEliminated && (
          <div className="flex items-center gap-1 mt-1">
            <div className="relative">
              <Dices className={`w-4 h-4 ${isCurrentTurn ? 'text-cyan-400' : 'text-cyan-400/70'}`} />
              {/* Cup mystery overlay */}
              <motion.div
                animate={isCurrentTurn ? {
                  rotate: [-2, 2, -2]
                } : {}}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="absolute -top-1 -right-1 text-[10px]"
              >
                🫙
              </motion.div>
            </div>
            <span className={`text-xs font-bold font-mono ${isCurrentTurn ? 'text-cyan-300' : 'text-cyan-400/70'}`}>
              {diceRemaining}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

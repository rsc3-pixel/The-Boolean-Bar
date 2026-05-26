import { motion, AnimatePresence } from "motion/react";

interface Reaction {
  id: string;
  emoji: string;
  playerName: string;
}

interface ReactionOverlayProps {
  reactions: Reaction[];
}

export function ReactionOverlay({ reactions }: ReactionOverlayProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <ReactionItem key={r.id} reaction={r} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ReactionItem({ reaction }: { reaction: Reaction }) {
  // Posição horizontal aleatória (10% a 90%)
  const randomX = Math.floor(Math.random() * 80) + 10;
  
  return (
    <motion.div
      initial={{ y: "100vh", x: `${randomX}vw`, opacity: 0, scale: 0.5 }}
      animate={{ y: "-10vh", opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.8] }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2.5, ease: "easeOut" }}
      className="absolute flex flex-col items-center gap-1 drop-shadow-2xl"
    >
      <span className="text-5xl sm:text-6xl select-none">{reaction.emoji}</span>
      <span className="bg-black/60 px-2 py-0.5 rounded text-[10px] sm:text-xs text-white border border-white/10 whitespace-nowrap">
        {reaction.playerName}
      </span>
    </motion.div>
  );
}

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioCues } from "../../utils/audioCues";

interface GameIntroProps {
  players: { name: string; isBot?: boolean }[];
  gameMode: "logic" | "dice";
  onComplete: () => void;
}

export function GameIntro({ players, gameMode, onComplete }: GameIntroProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [showGo, setShowGo] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    players.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setRevealedCount(i + 1);
        audioCues.click();
      }, (i + 1) * 600));
    });

    const goTimer = setTimeout(() => setShowGo(true), (players.length + 1) * 600);
    const completeTimer = setTimeout(onComplete, (players.length + 2) * 600);

    timers.push(goTimer, completeTimer);
    return () => timers.forEach(clearTimeout);
  }, [players, onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      <p className="text-sm tracking-[0.5em] text-cyan-500/60 font-mono uppercase mb-8">
        {gameMode === "dice" ? "LIAR'S DICE" : "BOOLEAN BAR"}
      </p>

      <div className="space-y-3">
        {players.slice(0, revealedCount).map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex items-center gap-4"
          >
            <span className="text-cyan-500/50 font-mono w-8 text-right">{i + 1}.</span>
            <span className="text-3xl text-cyan-200 font-mono tracking-wider" style={{ fontWeight: 800 }}>
              {p.name}
            </span>
            {p.isBot && <span className="text-xs text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded">BOT</span>}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showGo && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-12 text-6xl text-yellow-300 font-mono" style={{ fontWeight: 900 }}
          >
            GO!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScrollText, ChevronDown, ChevronUp } from "lucide-react";
import type { GameLogEntry, GameLogKind } from "../../hooks/useGameEngine";

interface GameLogProps {
  entries: GameLogEntry[];
  /** Posição: bottom-left (default) ou top-right */
  position?: "bottom-left" | "top-right";
}

const KIND_STYLES: Record<GameLogKind, { color: string; dot: string }> = {
  info:           { color: "text-zinc-400",     dot: "bg-zinc-500" },
  doubt:          { color: "text-orange-300",   dot: "bg-orange-400" },
  roulette_safe:  { color: "text-emerald-300",  dot: "bg-emerald-400" },
  roulette_dead:  { color: "text-red-300",      dot: "bg-red-500" },
  bet:            { color: "text-cyan-300",     dot: "bg-cyan-400" },
  dice_doubt:     { color: "text-orange-300",   dot: "bg-orange-400" },
  reveal:         { color: "text-yellow-300",   dot: "bg-yellow-400" },
  victory:        { color: "text-yellow-200",   dot: "bg-yellow-300" },
};

export function GameLog({ entries, position = "bottom-left" }: GameLogProps) {
  const [expanded, setExpanded] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll pra última entrada
  useEffect(() => {
    if (listRef.current && expanded) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [entries.length, expanded]);

  const positionClasses = position === "top-right"
    ? "top-20 right-4 sm:top-24 sm:right-6"
    : "bottom-20 left-4 sm:bottom-24 sm:left-6";

  return (
    <div
      className={`fixed ${positionClasses} z-[150] w-[280px] sm:w-[320px] max-w-[calc(100vw-2rem)] pointer-events-auto`}
    >
      <div className="bg-zinc-950/85 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 transition-colors border-b border-zinc-800"
        >
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-yellow-400/80" />
            <span className="text-xs uppercase tracking-widest font-mono text-yellow-200/80" style={{ fontWeight: 700 }}>
              Histórico
            </span>
            {entries.length > 0 && (
              <span className="text-[10px] text-zinc-500 font-mono">({entries.length})</span>
            )}
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-zinc-400" />}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                ref={listRef}
                className="max-h-[200px] sm:max-h-[260px] overflow-y-auto px-3 py-2 sm:px-4 sm:py-3 flex flex-col gap-1.5"
              >
                {entries.length === 0 ? (
                  <div className="text-[10px] sm:text-xs font-mono text-zinc-600 italic text-center py-2">
                    Aguardando primeira jogada...
                  </div>
                ) : (
                  entries.map((entry) => {
                    const style = KIND_STYLES[entry.kind] ?? KIND_STYLES.info;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-start gap-2"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                        <span className={`text-[11px] sm:text-xs font-mono leading-snug ${style.color}`}>
                          {entry.text}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

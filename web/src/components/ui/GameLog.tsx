import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScrollText, ChevronDown, ChevronUp, X } from "lucide-react";
import type { GameLogEntry, GameLogKind } from "../../hooks/useGameEngine";

interface GameLogProps {
  entries: GameLogEntry[];
  /** Posição em desktop. Em mobile sempre vira botão+modal. */
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

function EntryList({ entries, scrollRef }: { entries: GameLogEntry[]; scrollRef: React.RefObject<HTMLDivElement | null> }) {
  if (entries.length === 0) {
    return (
      <div className="text-[11px] sm:text-xs font-mono text-zinc-600 italic text-center py-2">
        Aguardando primeira jogada...
      </div>
    );
  }
  return (
    <div ref={scrollRef} className="flex flex-col gap-1.5 overflow-y-auto h-full">
      {entries.map((entry) => {
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
            <span className={`text-[12px] sm:text-xs font-mono leading-snug ${style.color}`}>
              {entry.text}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function GameLog({ entries, position = "bottom-left" }: GameLogProps) {
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopListRef = useRef<HTMLDivElement | null>(null);
  const mobileListRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll quando nova entrada chega
  useEffect(() => {
    const ref = mobileOpen ? mobileListRef.current : desktopListRef.current;
    if (ref) ref.scrollTop = ref.scrollHeight;
  }, [entries.length, mobileOpen, desktopExpanded]);

  const desktopPositionClasses = position === "top-right"
    ? "top-24 right-6"
    : "bottom-24 left-6";

  return (
    <>
      {/* ─── DESKTOP: painel persistente (≥640px) ─── */}
      <div className={`hidden sm:block fixed ${desktopPositionClasses} z-[150] w-[320px] pointer-events-auto`}>
        <div className="bg-zinc-950/85 backdrop-blur-md border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          <button
            onClick={() => setDesktopExpanded(!desktopExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-zinc-900 to-zinc-950 hover:from-zinc-800 hover:to-zinc-900 transition-colors border-b border-zinc-800"
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
            {desktopExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-zinc-400" />}
          </button>

          <AnimatePresence initial={false}>
            {desktopExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 py-3 max-h-[260px] overflow-hidden">
                  <div className="max-h-[236px] overflow-y-auto">
                    <EntryList entries={entries} scrollRef={desktopListRef} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── MOBILE: botão flutuante (top-right) + modal fullscreen ─── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Histórico de jogadas"
        className="sm:hidden fixed top-2 right-2 z-[155] w-9 h-9 rounded-full bg-zinc-950/85 backdrop-blur-md border-2 border-yellow-400/40 hover:border-yellow-300/70 active:scale-95 transition-all flex items-center justify-center shadow-lg"
      >
        <ScrollText className="w-4 h-4 text-yellow-300" />
        {entries.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-yellow-400 text-zinc-950 text-[9px] font-mono font-bold flex items-center justify-center">
            {entries.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-log-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden fixed inset-0 z-[300] bg-zinc-950/95 backdrop-blur-md flex flex-col"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-yellow-400/80" />
                <span className="text-sm uppercase tracking-widest font-mono text-yellow-200" style={{ fontWeight: 700 }}>
                  Histórico de jogadas
                </span>
                <span className="text-xs text-zinc-500 font-mono">({entries.length})</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-300" />
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              <EntryList entries={entries} scrollRef={mobileListRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

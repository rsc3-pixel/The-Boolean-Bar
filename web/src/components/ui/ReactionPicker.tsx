import { motion } from "motion/react";
import { Smile } from "lucide-react";
import { useState, useEffect } from "react";

const EMOJIS = ["🤔", "😂", "😅", "🔥", "💀", "👏"];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

export function ReactionPicker({ onSelect }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastSent, setLastSent] = useState(0);

  const handleSelect = (emoji: string) => {
    const now = Date.now();
    if (now - lastSent < 2000) return; // Client-side rate limit feedback
    
    onSelect(emoji);
    setLastSent(now);
    // Fecha após selecionar em telas pequenas
    if (window.innerWidth < 640) setIsOpen(false);
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full mb-2 left-0 sm:left-auto sm:right-0 bg-zinc-900/90 backdrop-blur-md border border-white/10 p-2 rounded-xl flex gap-2 shadow-2xl z-[110]"
          >
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => handleSelect(e)}
                className="text-2xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/5 active:bg-white/10"
              >
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full border transition-all ${
          isOpen 
            ? "bg-white border-white text-black" 
            : "bg-zinc-900/50 border-white/10 text-white hover:border-white/40"
        }`}
        title="Reagir"
      >
        <Smile size={20} />
      </button>
    </div>
  );
}

import { AnimatePresence } from "motion/react";

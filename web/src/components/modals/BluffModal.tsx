import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface BluffModalProps {
  isOpen: boolean;
  selectedFormula: string;
  onClose: () => void;
  onConfirm: (bluffType: string) => void;
}

type BluffType = "TAUTOLOGIA" | "CONTRADIÇÃO" | "CONTINGÊNCIA" | null;

export function BluffModal({ isOpen, selectedFormula, onClose, onConfirm }: BluffModalProps) {
  const [selectedBluff, setSelectedBluff] = useState<BluffType>(null);

  const handleConfirm = () => {
    if (selectedBluff) {
      onConfirm(selectedBluff);
      setSelectedBluff(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with heavy blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center"
            onClick={onClose}
          >
            {/* Modal box */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-[500px] bg-gradient-to-br from-zinc-900/90 via-zinc-950/95 to-black/90 backdrop-blur-2xl border-2 border-cyan-500/30 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.3)] p-8"
            >
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/50 border border-zinc-700 hover:border-red-500/50 hover:bg-red-950/30 transition-all"
              >
                <X className="w-4 h-4 text-zinc-400 hover:text-red-400" />
              </motion.button>

              {/* Content */}
              <div className="flex flex-col items-center gap-6 mt-2">
                {/* Selected card display */}
                <motion.div
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="relative w-48 h-64 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-2 border-cyan-400/50 rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center"
                >
                  {/* Corner decorations */}
                  <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-cyan-400/60" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-cyan-400/60" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-cyan-400/60" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-cyan-400/60" />

                  {/* Formula */}
                  <div className="text-xl font-mono text-cyan-300 tracking-wider text-center px-4 drop-shadow-[0_0_8px_rgba(103,232,249,0.6)]">
                    {selectedFormula}
                  </div>

                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent rounded-lg pointer-events-none" />

                  {/* Pulsing glow */}
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 border-2 border-cyan-400/0 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                  />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <h3 className="text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-sans" style={{ fontWeight: 800 }}>
                    Escolha seu Blefe:
                  </h3>
                </motion.div>

                {/* Bluff type buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-3 w-full"
                >
                  {(["TAUTOLOGIA", "CONTRADIÇÃO", "CONTINGÊNCIA"] as const).map((bluffType, index) => (
                    <motion.button
                      key={bluffType}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedBluff(bluffType)}
                      className={`
                        relative px-6 py-3 rounded-lg border-2 transition-all duration-300
                        ${selectedBluff === bluffType
                          ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                          : 'bg-zinc-900/50 border-cyan-500/30 hover:border-cyan-400/60 hover:bg-cyan-500/10'
                        }
                      `}
                    >
                      {/* Selected indicator */}
                      {selectedBluff === bluffType && (
                        <motion.div
                          layoutId="selected-bluff"
                          className="absolute inset-0 border-2 border-cyan-400 rounded-lg"
                          transition={{ type: "spring", duration: 0.5 }}
                        />
                      )}
                      <span className={`
                        relative text-lg tracking-widest font-mono transition-colors
                        ${selectedBluff === bluffType ? 'text-cyan-300' : 'text-cyan-400/70'}
                      `}>
                        {bluffType}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>

                {/* Confirm button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  whileHover={{ scale: selectedBluff ? 1.05 : 1 }}
                  whileTap={{ scale: selectedBluff ? 0.95 : 1 }}
                  onClick={handleConfirm}
                  disabled={!selectedBluff}
                  className={`
                    relative w-full mt-2 px-8 py-4 rounded-xl border-2 overflow-hidden transition-all duration-300
                    ${selectedBluff
                      ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_50px_rgba(239,68,68,0.8)] cursor-pointer'
                      : 'bg-zinc-900/50 border-zinc-700 opacity-40 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Animated glow */}
                  {selectedBluff && (
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/30 to-transparent"
                    />
                  )}
                  <span className={`
                    relative text-xl tracking-[0.2em] font-sans
                    ${selectedBluff ? 'text-white' : 'text-zinc-600'}
                  `} style={{ fontWeight: 800 }}>
                    CONFIRMAR
                  </span>
                </motion.button>

                {/* Helper text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 1 }}
                  className="text-xs tracking-wider text-zinc-500 font-mono text-center mt-2"
                >
                  /// ESCOLHA COM SABEDORIA ///
                </motion.p>
              </div>

              {/* Corner decorations */}
              <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-cyan-500/20" />
              <div className="absolute top-3 right-3 w-8 h-8 border-r-2 border-t-2 border-cyan-500/20" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-l-2 border-b-2 border-cyan-500/20" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-cyan-500/20" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

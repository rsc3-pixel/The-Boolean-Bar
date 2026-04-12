import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Binary, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TruthTableProcessorProps {
  isVisible: boolean;
  formula: string;
  claimedType: string;
  onComplete?: (result: "correct" | "incorrect") => void;
}

type TruthRow = {
  P: number;
  Q: number;
  R: number;
  result: number;
};

export function TruthTableProcessor({
  isVisible,
  formula,
  claimedType,
  onComplete
}: TruthTableProcessorProps) {
  const [processingStage, setProcessingStage] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [verdict, setVerdict] = useState<"correct" | "incorrect" | null>(null);

  // Generate truth table (simplified mock)
  const truthTable: TruthRow[] = [
    { P: 0, Q: 0, R: 0, result: 0 },
    { P: 0, Q: 0, R: 1, result: 1 },
    { P: 0, Q: 1, R: 0, result: 0 },
    { P: 0, Q: 1, R: 1, result: 1 },
    { P: 1, Q: 0, R: 0, result: 1 },
    { P: 1, Q: 0, R: 1, result: 1 },
    { P: 1, Q: 1, R: 0, result: 1 },
    { P: 1, Q: 1, R: 1, result: 1 },
  ];

  useEffect(() => {
    if (!isVisible) {
      setProcessingStage(0);
      setCurrentRow(0);
      setIsComplete(false);
      setVerdict(null);
      return;
    }

    // Stage 1: Initialize (0.5s)
    const timer1 = setTimeout(() => setProcessingStage(1), 500);

    // Stage 2: Process rows (2s)
    const timer2 = setTimeout(() => setProcessingStage(2), 1000);

    // Animate through rows
    const rowInterval = setInterval(() => {
      setCurrentRow((prev) => {
        if (prev < truthTable.length - 1) return prev + 1;
        clearInterval(rowInterval);
        return prev;
      });
    }, 250);

    // Stage 3: Analysis complete (3s)
    const timer3 = setTimeout(() => {
      setProcessingStage(3);
      setIsComplete(true);
      // Mock verdict (in real game, would calculate based on truth table)
      const mockVerdict = Math.random() > 0.5 ? "correct" : "incorrect";
      setVerdict(mockVerdict);
      onComplete?.(mockVerdict);
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearInterval(rowInterval);
    };
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-sm"
        >
          {/* Animated grid background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
          </div>

          {/* Scanline effect */}
          <motion.div
            animate={{ y: ["-100%", "200%"] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-32"
          />

          {/* Main container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-[900px] bg-gradient-to-br from-zinc-950/95 via-black to-zinc-950/95 border-2 border-cyan-500/30 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.2)] p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                <Terminal className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono" style={{ fontWeight: 700 }}>
                  PROCESSADOR DE VERDADE
                </h2>
              </div>

              {/* Status indicator */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-2"
              >
                <Binary className="w-5 h-5 text-cyan-400" />
                <span className="text-xs tracking-widest text-cyan-400 font-mono">
                  {processingStage === 0 && "INICIALIZANDO..."}
                  {processingStage === 1 && "CARREGANDO..."}
                  {processingStage === 2 && "PROCESSANDO..."}
                  {processingStage === 3 && "ANÁLISE COMPLETA"}
                </span>
              </motion.div>
            </div>

            {/* Formula display */}
            <div className="mb-6 p-4 bg-zinc-900/50 border border-cyan-500/20 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs tracking-wider text-zinc-500 font-mono">FÓRMULA AVALIADA:</span>
                  <div className="text-xl text-cyan-300 font-mono mt-1 drop-shadow-[0_0_8px_rgba(103,232,249,0.4)]">
                    {formula}
                  </div>
                </div>
                <div>
                  <span className="text-xs tracking-wider text-zinc-500 font-mono">TIPO DECLARADO:</span>
                  <div className="text-lg text-emerald-400 font-mono mt-1">{claimedType}</div>
                </div>
              </div>
            </div>

            {/* Truth Table */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <span className="text-sm tracking-[0.3em] text-cyan-400/80 font-mono">TABELA-VERDADE</span>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              {/* Table header */}
              <div className="grid grid-cols-4 gap-2 mb-2 px-4">
                {["P", "Q", "R", "RESULTADO"].map((header, i) => (
                  <div key={header} className="text-center text-xs tracking-widest text-cyan-400/60 font-mono py-2">
                    {header}
                  </div>
                ))}
              </div>

              {/* Table rows */}
              <div className="space-y-1">
                {truthTable.map((row, rowIndex) => (
                  <motion.div
                    key={rowIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: rowIndex <= currentRow && processingStage >= 2 ? 1 : 0.3,
                      x: 0
                    }}
                    transition={{ delay: rowIndex * 0.05 }}
                    className={`
                      grid grid-cols-4 gap-2 px-4 py-3 rounded-md transition-all duration-300
                      ${rowIndex === currentRow && processingStage === 2
                        ? 'bg-cyan-500/10 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-zinc-900/30 border border-cyan-500/10'
                      }
                    `}
                  >
                    {/* P value */}
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={rowIndex === currentRow && processingStage === 2 ? {
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 1, 0.6]
                        } : {}}
                        transition={{ duration: 0.5, repeat: rowIndex === currentRow && processingStage === 2 ? Infinity : 0 }}
                        className={`text-lg font-mono ${row.P ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {row.P}
                      </motion.div>
                      {/* Binary visualization */}
                      <div className={`w-12 h-1 rounded-full ${row.P ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>

                    {/* Q value */}
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={rowIndex === currentRow && processingStage === 2 ? {
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 1, 0.6]
                        } : {}}
                        transition={{ duration: 0.5, repeat: rowIndex === currentRow && processingStage === 2 ? Infinity : 0, delay: 0.1 }}
                        className={`text-lg font-mono ${row.Q ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {row.Q}
                      </motion.div>
                      <div className={`w-12 h-1 rounded-full ${row.Q ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>

                    {/* R value */}
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={rowIndex === currentRow && processingStage === 2 ? {
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 1, 0.6]
                        } : {}}
                        transition={{ duration: 0.5, repeat: rowIndex === currentRow && processingStage === 2 ? Infinity : 0, delay: 0.2 }}
                        className={`text-lg font-mono ${row.R ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {row.R}
                      </motion.div>
                      <div className={`w-12 h-1 rounded-full ${row.R ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>

                    {/* Result */}
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={rowIndex === currentRow && processingStage === 2 ? {
                          scale: [1, 1.2, 1],
                          opacity: [0.6, 1, 0.6]
                        } : {}}
                        transition={{ duration: 0.5, repeat: rowIndex === currentRow && processingStage === 2 ? Infinity : 0, delay: 0.3 }}
                        className={`text-lg font-mono font-bold ${row.result ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {row.result}
                      </motion.div>
                      <div className={`w-12 h-1 rounded-full ${row.result ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Verdict section */}
            <AnimatePresence>
              {isComplete && verdict && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className={`
                    p-6 rounded-lg border-2
                    ${verdict === "correct"
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                      : 'bg-red-950/30 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {verdict === "correct" ? (
                        <CheckCircle className="w-12 h-12 text-emerald-400" strokeWidth={2.5} />
                      ) : (
                        <XCircle className="w-12 h-12 text-red-400" strokeWidth={2.5} />
                      )}
                      <div>
                        <span className="text-xs tracking-widest text-zinc-400 font-mono">VEREDITO:</span>
                        <div className={`text-3xl tracking-wider font-mono ${verdict === "correct" ? 'text-emerald-300' : 'text-red-300'}`} style={{ fontWeight: 700 }}>
                          {verdict === "correct" ? "DECLARAÇÃO CORRETA" : "BLEFE DETECTADO!"}
                        </div>
                      </div>
                    </div>

                    {/* Confidence meter */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs tracking-wider text-zinc-500 font-mono">CONFIANÇA:</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.1 * i }}
                            className={`w-3 h-${(i + 1) * 2} rounded-sm ${verdict === "correct" ? 'bg-emerald-500' : 'bg-red-500'}`}
                            style={{ height: `${(i + 1) * 8}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom status bar */}
            <div className="mt-6 pt-4 border-t border-cyan-500/20 flex items-center justify-between text-xs font-mono text-zinc-600">
              <div className="flex items-center gap-4">
                <span>SISTEMA: ATIVO</span>
                <span>|</span>
                <span>VARIÁVEIS: P, Q, R</span>
                <span>|</span>
                <span>LINHAS: {truthTable.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-cyan-400"
                />
                <span className="text-cyan-400">PROCESSADOR QUÂNTICO ONLINE</span>
              </div>
            </div>
          </motion.div>

          {/* Corner tech decorations */}
          <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-cyan-500/30" />
          <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-cyan-500/30" />
          <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-cyan-500/30" />
          <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-cyan-500/30" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

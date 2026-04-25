import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Binary, CheckCircle, XCircle } from "lucide-react";

interface TruthTableProcessorProps {
  isVisible: boolean;
  formula: string;
  claimedType: string;
  onComplete?: (result: "correct" | "incorrect") => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  LOGIC FORMULA PARSER
 *  Mirrors the C engine's parser (logic_engine.c) exactly.
 *  Supports: P, Q, R variables, AND, OR, NOT operators, parentheses.
 * ═══════════════════════════════════════════════════════════════════════════ */

interface ParserState {
  str: string;
  pos: number;
  vars: Record<string, boolean>;
}

function skipWhitespace(p: ParserState): void {
  while (p.pos < p.str.length && /\s/.test(p.str[p.pos])) p.pos++;
}

function matchWord(p: ParserState, word: string): boolean {
  skipWhitespace(p);
  if (p.str.substring(p.pos, p.pos + word.length) === word) {
    const next = p.str[p.pos + word.length];
    if (!next || !/[a-zA-Z]/.test(next)) {
      p.pos += word.length;
      return true;
    }
  }
  return false;
}

function parseFactor(p: ParserState): boolean {
  skipWhitespace(p);
  if (matchWord(p, "NOT")) {
    return !parseFactor(p);
  } else if (p.str[p.pos] === "(") {
    p.pos++;
    const val = parseExpr(p);
    skipWhitespace(p);
    if (p.str[p.pos] === ")") p.pos++;
    return val;
  } else if (matchWord(p, "P")) {
    return p.vars["P"] ?? false;
  } else if (matchWord(p, "Q")) {
    return p.vars["Q"] ?? false;
  } else if (matchWord(p, "R")) {
    return p.vars["R"] ?? false;
  }
  return false;
}

function parseTerm(p: ParserState): boolean {
  let val = parseFactor(p);
  skipWhitespace(p);
  while (matchWord(p, "AND")) {
    const right = parseFactor(p);
    val = val && right;
    skipWhitespace(p);
  }
  return val;
}

function parseExpr(p: ParserState): boolean {
  let val = parseTerm(p);
  skipWhitespace(p);
  while (matchWord(p, "OR")) {
    const right = parseTerm(p);
    val = val || right;
    skipWhitespace(p);
  }
  return val;
}

function evaluateFormula(formula: string, vars: Record<string, boolean>): boolean {
  const p: ParserState = { str: formula, pos: 0, vars };
  return parseExpr(p);
}

/** Extract unique variables (P, Q, R) from a formula string */
function extractVariables(formula: string): string[] {
  const vars = new Set<string>();
  const matches = formula.match(/\b([PQR])\b/g);
  if (matches) {
    matches.forEach((v) => vars.add(v));
  }
  // Sort consistently: P, Q, R
  return ["P", "Q", "R"].filter((v) => vars.has(v));
}

interface TruthRow {
  vars: Record<string, number>;
  result: number;
}

/** Generate a full truth table for a formula */
function generateTruthTable(formula: string, variables: string[]): TruthRow[] {
  const numRows = Math.pow(2, variables.length);
  const rows: TruthRow[] = [];

  for (let i = 0; i < numRows; i++) {
    const vars: Record<string, boolean> = {};
    const varsNum: Record<string, number> = {};

    variables.forEach((v, idx) => {
      const bit = (i >> (variables.length - 1 - idx)) & 1;
      vars[v] = bit === 1;
      varsNum[v] = bit;
    });

    const result = evaluateFormula(formula, vars);
    rows.push({ vars: varsNum, result: result ? 1 : 0 });
  }

  return rows;
}

/** Determine formula type from truth table */
function classifyFormula(rows: TruthRow[]): "TAUTOLOGIA" | "CONTRADIÇÃO" | "CONTINGÊNCIA" {
  const allTrue = rows.every((r) => r.result === 1);
  const allFalse = rows.every((r) => r.result === 0);
  if (allTrue) return "TAUTOLOGIA";
  if (allFalse) return "CONTRADIÇÃO";
  return "CONTINGÊNCIA";
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

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

  // Parse formula and generate real truth table
  const variables = useMemo(() => extractVariables(formula || ""), [formula]);
  const truthTable = useMemo(() => {
    if (!formula) return [];
    return generateTruthTable(formula, variables);
  }, [formula, variables]);
  const realType = useMemo(() => classifyFormula(truthTable), [truthTable]);

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

    // Stage 2: Process rows (1s)
    const timer2 = setTimeout(() => setProcessingStage(2), 1000);

    // Animate through rows
    const rowTimers: ReturnType<typeof setTimeout>[] = [];
    truthTable.forEach((_, idx) => {
      rowTimers.push(
        setTimeout(() => {
          setCurrentRow(idx);
        }, 1000 + idx * 250)
      );
    });

    // Stage 3: Analysis complete
    const analysisDelay = 1000 + truthTable.length * 250 + 500;
    const timer3 = setTimeout(() => {
      setProcessingStage(3);
      setIsComplete(true);
      // Real verdict: compare claimed type with actual evaluation
      const isCorrect = claimedType === realType;
      const v = isCorrect ? "correct" : "incorrect";
      setVerdict(v);
      onComplete?.(v);
    }, analysisDelay);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      rowTimers.forEach(clearTimeout);
    };
  }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

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
            className="relative z-10 w-[900px] max-h-[85vh] overflow-y-auto bg-gradient-to-br from-zinc-950/95 via-black to-zinc-950/95 border-2 border-cyan-500/30 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.2)] p-8"
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
                  {processingStage === 1 && "EXTRAINDO VARIÁVEIS..."}
                  {processingStage === 2 && "PROCESSANDO TABELA..."}
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
                    {formula || "—"}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs tracking-wider text-zinc-500 font-mono">TIPO DECLARADO:</span>
                  <div className="text-lg text-emerald-400 font-mono mt-1">{claimedType}</div>
                </div>
              </div>
              {/* Variables detected */}
              {processingStage >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 pt-3 border-t border-cyan-500/10 flex items-center gap-3"
                >
                  <span className="text-xs tracking-wider text-zinc-600 font-mono">VARIÁVEIS DETECTADAS:</span>
                  <div className="flex gap-2">
                    {variables.map((v) => (
                      <span key={v} className="px-2 py-0.5 bg-cyan-950/50 border border-cyan-500/30 rounded text-sm text-cyan-400 font-mono font-bold">
                        {v}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-600 font-mono">→ {truthTable.length} combinações</span>
                </motion.div>
              )}
            </div>

            {/* Truth Table */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <span className="text-sm tracking-[0.3em] text-cyan-400/80 font-mono">TABELA-VERDADE</span>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              </div>

              {/* Table header */}
              <div className="grid gap-2 mb-2 px-4" style={{ gridTemplateColumns: `repeat(${variables.length + 1}, 1fr)` }}>
                {variables.map((v) => (
                  <div key={v} className="text-center text-xs tracking-widest text-cyan-400/60 font-mono py-2">
                    {v}
                  </div>
                ))}
                <div className="text-center text-xs tracking-widest text-cyan-400/60 font-mono py-2">
                  RESULTADO
                </div>
              </div>

              {/* Table rows */}
              <div className="space-y-1">
                {truthTable.map((row, rowIndex) => (
                  <motion.div
                    key={rowIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: rowIndex <= currentRow && processingStage >= 2 ? 1 : 0.2,
                      x: 0
                    }}
                    transition={{ delay: rowIndex * 0.03 }}
                    className={`
                      grid gap-2 px-4 py-3 rounded-md transition-all duration-300
                      ${rowIndex === currentRow && processingStage === 2
                        ? 'bg-cyan-500/10 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : rowIndex <= currentRow && processingStage >= 2
                          ? 'bg-zinc-900/30 border border-cyan-500/10'
                          : 'bg-zinc-950/30 border border-transparent'
                      }
                    `}
                    style={{ gridTemplateColumns: `repeat(${variables.length + 1}, 1fr)` }}
                  >
                    {/* Variable values */}
                    {variables.map((v) => (
                      <div key={v} className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={rowIndex === currentRow && processingStage === 2 ? {
                            scale: [1, 1.2, 1],
                            opacity: [0.6, 1, 0.6]
                          } : {}}
                          transition={{ duration: 0.5, repeat: rowIndex === currentRow && processingStage === 2 ? Infinity : 0 }}
                          className={`text-lg font-mono ${row.vars[v] ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                          {row.vars[v]}
                        </motion.div>
                        <div className={`w-10 h-1 rounded-full ${row.vars[v] ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      </div>
                    ))}

                    {/* Result */}
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        animate={rowIndex === currentRow && processingStage === 2 ? {
                          scale: [1, 1.3, 1],
                          opacity: [0.6, 1, 0.6]
                        } : {}}
                        transition={{ duration: 0.5, repeat: rowIndex === currentRow && processingStage === 2 ? Infinity : 0 }}
                        className={`text-lg font-mono font-bold ${row.result ? 'text-emerald-400' : 'text-red-400'}`}
                      >
                        {row.result}
                      </motion.div>
                      <div className={`w-10 h-1 rounded-full ${row.result ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Real type classification */}
            <AnimatePresence>
              {processingStage >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-4 p-4 bg-zinc-900/40 border border-cyan-500/20 rounded-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs tracking-wider text-zinc-500 font-mono">CLASSIFICAÇÃO REAL:</span>
                      <div className="text-2xl text-cyan-300 font-mono mt-1 font-bold tracking-wider drop-shadow-[0_0_12px_rgba(103,232,249,0.5)]">
                        {realType}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs tracking-wider text-zinc-500 font-mono">
                        {truthTable.filter(r => r.result === 1).length}/{truthTable.length} VERDADEIROS
                      </span>
                      <div className="mt-2 flex gap-1">
                        {truthTable.map((r, i) => (
                          <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`w-3 h-6 rounded-sm ${r.result ? 'bg-emerald-500' : 'bg-red-500'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                        <div className="mt-2 text-sm text-zinc-500 font-mono">
                          Declarado: <span className="text-zinc-300">{claimedType}</span>
                          {" → "}Real: <span className={verdict === "correct" ? "text-emerald-400" : "text-red-400"}>{realType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Confidence meter */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs tracking-wider text-zinc-500 font-mono">CONFIANÇA:</span>
                      <div className="flex gap-1 items-end">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.1 * i }}
                            className={`w-3 rounded-sm ${verdict === "correct" ? 'bg-emerald-500' : 'bg-red-500'}`}
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
                <span>VARIÁVEIS: {variables.join(", ") || "—"}</span>
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

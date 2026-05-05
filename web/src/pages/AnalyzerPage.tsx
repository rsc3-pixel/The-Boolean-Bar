import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Brain, Check, X, AlertTriangle } from "lucide-react";
import { gerarTabelaVerdade, type TruthTable } from "../utils/logicEval";

interface AnalyzerPageProps {
  onBack: () => void;
}

const EXAMPLES = [
  { label: "Tautologia clássica", formula: "P OR NOT P" },
  { label: "Contradição clássica", formula: "P AND NOT P" },
  { label: "Lei de De Morgan", formula: "NOT ( P AND Q ) IFF ( NOT P OR NOT Q )" },
  { label: "Implicação", formula: "( P AND ( P IMPLIES Q ) ) IMPLIES Q" },
  { label: "Contingência", formula: "( P OR Q ) AND R" },
];

export function AnalyzerPage({ onBack }: AnalyzerPageProps) {
  const [formula, setFormula] = useState("");

  const result = useMemo<{ table?: TruthTable; error?: string }>(() => {
    if (!formula.trim()) return {};
    try {
      const table = gerarTabelaVerdade(formula);
      return { table };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [formula]);

  const insertSymbol = (s: string) => setFormula((f) => f + (f.endsWith(" ") || f === "" ? "" : " ") + s + " ");

  const classBadge = result.table && (
    result.table.classificacao === "TAUTOLOGIA"
      ? { color: "emerald", icon: <Check className="w-5 h-5" />, label: "TAUTOLOGIA", desc: "sempre verdadeira" }
      : result.table.classificacao === "CONTRADICAO"
        ? { color: "red", icon: <X className="w-5 h-5" />, label: "CONTRADIÇÃO", desc: "sempre falsa" }
        : { color: "yellow", icon: <AlertTriangle className="w-5 h-5" />, label: "CONTINGÊNCIA", desc: "pode ser V ou F" }
  );

  return (
    <div className="size-full bg-black overflow-auto relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20 pointer-events-none" />

      {/* Back button */}
      <button
        onClick={onBack}
        className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-zinc-950/70 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:border-cyan-500/50 transition-all font-mono text-xs uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Voltar</span>
      </button>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 mb-8 sm:mb-12"
        >
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-purple-300" />
            <h1
              className="text-2xl sm:text-4xl tracking-[0.2em] text-purple-200 uppercase font-sans"
              style={{ fontWeight: 800, textShadow: "0 0 30px rgba(168,85,247,0.5)" }}
            >
              Analisar Fórmula
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 font-mono tracking-widest uppercase text-center">
            Tabela-verdade & Classificação proposicional
          </p>
        </motion.div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-3 mb-6"
        >
          <label className="text-xs uppercase tracking-[0.3em] text-purple-300/70 font-mono">Sua fórmula</label>
          <input
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="Ex: ( P AND Q ) OR NOT R"
            className="bg-black/60 border-2 border-purple-500/30 focus:border-purple-400/70 rounded-md px-4 py-3 text-purple-100 font-mono text-base sm:text-lg outline-none transition-colors"
            autoFocus
          />
          {/* Atalhos de símbolos */}
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            {["P", "Q", "R", "AND", "OR", "NOT", "XOR", "IMPLIES", "IFF", "(", ")"].map((s) => (
              <button
                key={s}
                onClick={() => insertSymbol(s)}
                className="px-2.5 py-1 text-xs font-mono bg-zinc-900/80 border border-zinc-700 hover:border-purple-400/60 hover:text-purple-200 text-zinc-400 rounded transition-all"
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setFormula("")}
              className="px-2.5 py-1 text-xs font-mono bg-red-950/40 border border-red-800/50 hover:border-red-500/60 text-red-400 rounded transition-all ml-auto"
            >
              limpar
            </button>
          </div>
        </motion.div>

        {/* Erro */}
        {result.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-red-950/40 border-2 border-red-500/50 rounded-lg"
          >
            <p className="text-red-300 font-mono text-sm">⚠️ {result.error}</p>
            <p className="text-red-400/60 font-mono text-xs mt-1">
              Sintaxe aceita: variáveis A-Z (1 letra), AND, OR, NOT, XOR, IMPLIES, IFF, parênteses.
            </p>
          </motion.div>
        )}

        {/* Resultado */}
        {result.table && classBadge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Classificação */}
            <div
              className={`p-5 sm:p-6 rounded-xl border-2 flex items-center gap-4 ${
                classBadge.color === "emerald" ? "bg-emerald-950/30 border-emerald-500/50" :
                classBadge.color === "red"     ? "bg-red-950/30 border-red-500/50" :
                                                 "bg-yellow-950/30 border-yellow-500/50"
              }`}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${
                  classBadge.color === "emerald" ? "bg-emerald-500 text-black" :
                  classBadge.color === "red"     ? "bg-red-500 text-white" :
                                                   "bg-yellow-500 text-black"
                }`}
              >
                {classBadge.icon}
              </div>
              <div>
                <p
                  className={`text-xl sm:text-2xl font-sans uppercase tracking-widest ${
                    classBadge.color === "emerald" ? "text-emerald-300" :
                    classBadge.color === "red"     ? "text-red-300" :
                                                     "text-yellow-300"
                  }`}
                  style={{ fontWeight: 800 }}
                >
                  {classBadge.label}
                </p>
                <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">{classBadge.desc}</p>
              </div>
            </div>

            {/* Tabela-verdade */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-purple-500/40 bg-purple-950/30">
                    {result.table.variaveis.map((v) => (
                      <th key={v} className="px-3 sm:px-4 py-2 sm:py-3 text-purple-200 text-center" style={{ fontWeight: 700 }}>
                        {v}
                      </th>
                    ))}
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-cyan-300 text-center border-l-2 border-purple-500/40" style={{ fontWeight: 700 }}>
                      RESULTADO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.table.linhas.map((linha, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-zinc-800 ${idx % 2 === 0 ? "bg-zinc-950/40" : "bg-black/40"}`}
                    >
                      {result.table!.variaveis.map((v) => (
                        <td key={v} className={`px-3 sm:px-4 py-1.5 sm:py-2 text-center ${linha.atribuicao[v] ? "text-emerald-400" : "text-zinc-500"}`}>
                          {linha.atribuicao[v] ? "V" : "F"}
                        </td>
                      ))}
                      <td className={`px-3 sm:px-4 py-1.5 sm:py-2 text-center border-l-2 border-purple-500/40 ${linha.resultado ? "text-emerald-300" : "text-red-400"}`} style={{ fontWeight: 700 }}>
                        {linha.resultado ? "V" : "F"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-zinc-500 font-mono text-center">
              {result.table.linhas.length} linhas — {result.table.variaveis.length} variáveis
            </div>
          </motion.div>
        )}

        {/* Exemplos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 border-t border-zinc-800 pt-6"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-mono mb-3">Exemplos pra testar</p>
          <div className="flex flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => setFormula(ex.formula)}
                className="text-left px-4 py-2 bg-zinc-950/40 hover:bg-purple-950/20 border border-zinc-800 hover:border-purple-500/30 rounded transition-all"
              >
                <div className="text-xs text-purple-300/80 font-mono">{ex.label}</div>
                <div className="text-zinc-400 font-mono text-xs sm:text-sm mt-0.5">{ex.formula}</div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

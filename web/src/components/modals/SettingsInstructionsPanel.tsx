import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, Monitor, ArrowLeft, Info, CheckCircle, XCircle, HelpCircle, Trophy, Brain, Dices } from "lucide-react";

interface SettingsInstructionsPanelProps {
  isVisible: boolean;
  onBack: () => void;
}

// ===================== CONTEÚDO DAS ETAPAS =====================
function StepConfiguracao() {
  return (
    <div className="space-y-4">
      <p className="text-zinc-300 leading-relaxed text-sm">
        O jogo começa com <span className="text-cyan-400 font-bold font-mono">7 jogadores</span> à mesa.
        Cada um começa com <span className="text-emerald-400 font-bold font-mono">3 vidas</span>.
      </p>
      <div className="grid grid-cols-4 gap-2">
        {["J1","J2","J3","J4","J5","J6","VOCÊ"].map((p, i) => (
          <div key={i} className={`flex flex-col items-center gap-1 p-3 rounded-lg border ${i === 6 ? 'border-cyan-500 bg-cyan-950/30 text-cyan-300' : 'border-zinc-700 bg-zinc-900/40 text-zinc-400'} font-mono text-xs`}>
            <span className="text-lg">{i === 6 ? '🫵' : '🎭'}</span>
            <span>{p}</span>
            <span className="text-emerald-400">❤️❤️❤️</span>
          </div>
        ))}
      </div>
      <div className="p-4 bg-zinc-900/60 border border-cyan-500/20 rounded-lg">
        <p className="text-xs font-mono text-zinc-500 mb-2 tracking-wider">REVÓLVER DA MESA — começa com 1 bala em 6 câmaras:</p>
        <div className="flex items-center gap-2">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className={`w-6 h-6 rounded-full border-2 text-xs flex items-center justify-center ${i === 0 ? 'border-red-500 bg-red-950 text-red-400' : 'border-zinc-700 bg-zinc-900 text-zinc-600'}`}>
              {i === 0 ? '●' : '○'}
            </div>
          ))}
          <span className="text-zinc-500 font-mono text-xs ml-2">1/6 (≈17%)</span>
        </div>
      </div>
    </div>
  );
}

function StepTurno() {
  return (
    <div className="space-y-3">
      {[
        { n: "1", color: "cyan", label: "GERAR CARTA", desc: "O motor C gera uma fórmula lógica aleatória. Ex: P AND Q, NOT P OR R, P IMPLIES Q" },
        { n: "2", color: "emerald", label: "JOGAR + DECLARAR", desc: "Escolha uma carta da sua mão e declare: TAUTOLOGIA, CONTRADIÇÃO ou CONTINGÊNCIA. Você pode BLEFAR!" },
        { n: "3", color: "yellow", label: "MOMENTO DA DÚVIDA", desc: "O próximo jogador decide: ACREDITAR (passa o turno) ou DUVIDAR (inicia o confronto lógico)." },
        { n: "4a", color: "emerald", label: "SE ACREDITAR", desc: "Ninguém perde nada. O turno passa para o próximo jogador na sequência." },
        { n: "4b", color: "red", label: "SE DUVIDAR", desc: "A fórmula é avaliada. O perdedor (quem errou) vai para a Roleta Russa." },
      ].map(({ n, color, label, desc }) => (
        <div key={n} className="flex gap-3 items-start p-3 rounded-lg bg-zinc-900/40 border border-zinc-700/50">
          <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold border-${color}-500 text-${color}-400`}>
            {n}
          </div>
          <div>
            <p className={`font-mono text-sm font-bold text-${color}-300 mb-0.5`}>{label}</p>
            <p className="text-zinc-400 text-xs leading-relaxed">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StepLogica() {
  return (
    <div className="space-y-4">
      {[
        {
          type: "TAUTOLOGIA", color: "emerald",
          desc: "Sempre verdadeira, independente dos valores das variáveis.",
          example: "P OR NOT P",
          rows: [["V","F","V"],["F","V","V"]], headers: ["P","¬P","P∨¬P"]
        },
        {
          type: "CONTRADIÇÃO", color: "red",
          desc: "Sempre falsa, independente dos valores das variáveis.",
          example: "P AND NOT P",
          rows: [["V","F","F"],["F","V","F"]], headers: ["P","¬P","P∧¬P"]
        },
        {
          type: "CONTINGÊNCIA", color: "yellow",
          desc: "Pode ser verdadeira ou falsa conforme os valores.",
          example: "P AND Q",
          rows: [["V","V","V"],["V","F","F"],["F","V","F"],["F","F","F"]], headers: ["P","Q","P∧Q"]
        },
      ].map(({ type, color, desc, example, rows, headers }) => (
        <div key={type} className={`p-4 rounded-lg border border-${color}-500/30 bg-${color}-950/10`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`font-mono font-bold text-${color}-300`}>{type}</span>
            <code className="text-zinc-400 text-xs font-mono">{example}</code>
          </div>
          <p className="text-zinc-400 text-xs mb-3">{desc}</p>
          <div className="grid text-center text-xs font-mono gap-1" style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}>
            {headers.map(h => <div key={h} className={`text-${color}-400 font-bold py-1`}>{h}</div>)}
            {rows.flatMap((row, ri) => row.map((cell, ci) => (
              <div key={`${ri}-${ci}`} className={`py-0.5 ${cell === 'V' ? 'text-emerald-400' : 'text-red-400'}`}>{cell}</div>
            )))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepConectivos() {
  return (
    <div className="space-y-3">
      <p className="text-zinc-400 text-sm">As fórmulas no jogo usam palavras em inglês. Aprenda a ler:</p>
      <div className="overflow-hidden rounded-lg border border-zinc-700">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-700">
              <th className="p-2 text-left text-zinc-500 text-xs">No Jogo (C)</th>
              <th className="p-2 text-left text-zinc-500 text-xs">Símbolo</th>
              <th className="p-2 text-left text-zinc-500 text-xs">Significado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {[
              ["NOT P", "¬P", "NÃO P — inverte o valor"],
              ["P AND Q", "P ∧ Q", "P E Q — ambos devem ser verdadeiros"],
              ["P OR Q", "P ∨ Q", "P OU Q — ao menos um verdadeiro"],
              ["P IMPLIES Q", "P → Q", "SE P ENTÃO Q — falso só se P=V e Q=F"],
              ["P IFF Q", "P ↔ Q", "P SSE Q — ambos iguais"],
            ].map(([jogo, simb, sig], i) => (
              <tr key={i} className="hover:bg-zinc-800/40 transition-colors">
                <td className="p-2 text-cyan-300 text-xs">{jogo}</td>
                <td className="p-2 text-yellow-400 text-base">{simb}</td>
                <td className="p-2 text-zinc-400 text-xs">{sig}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg">
        <p className="text-xs text-cyan-400/80 font-mono">💡 Parênteses alteram a precedência: <span className="text-white">(P OR Q) AND R</span> ≠ <span className="text-white">P OR (Q AND R)</span></p>
      </div>
      <div className="p-3 bg-zinc-900/40 border border-zinc-700 rounded-lg">
        <p className="text-xs text-zinc-500 font-mono mb-2">PRECEDÊNCIA (maior → menor):</p>
        <div className="flex gap-2 text-xs font-mono">
          {["NOT","AND","OR","IMPLIES","IFF"].map((op, i, arr) => (
            <span key={op} className="flex items-center gap-1">
              <span className="text-yellow-400">{op}</span>
              {i < arr.length - 1 && <span className="text-zinc-600">›</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepRoleta() {
  return (
    <div className="space-y-4">
      <p className="text-zinc-300 text-sm leading-relaxed">Quem perde o confronto lógico puxa o gatilho do revólver.</p>
      <div className="space-y-3">
        <div className="flex gap-3 p-4 rounded-lg border border-red-500/30 bg-red-950/15">
          <span className="text-2xl">💥</span>
          <div>
            <p className="font-mono font-bold text-red-300 text-sm mb-1">BANG! — O gatilho dispara</p>
            <p className="text-zinc-400 text-xs">O jogador perde 1 vida. Se chegar a 0 vidas → ELIMINADO. O tambor reseta para 1 bala.</p>
          </div>
        </div>
        <div className="flex gap-3 p-4 rounded-lg border border-yellow-500/30 bg-yellow-950/15">
          <span className="text-2xl">💨</span>
          <div>
            <p className="font-mono font-bold text-yellow-300 text-sm mb-1">CLIQUE — Câmara vazia</p>
            <p className="text-zinc-400 text-xs">O jogador sobrevive mas perde 1 ponto de score. O risco AUMENTA: +1 bala no tambor para o próximo disparo.</p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-zinc-900/60 border border-zinc-700 rounded-lg">
        <p className="text-xs font-mono text-zinc-500 mb-3 tracking-wider">RISCO ACUMULATIVO:</p>
        <div className="space-y-2">
          {[
            { b: 1, label: "Início / Após morte", prob: "17%" },
            { b: 2, label: "Após 1 clique salvo", prob: "33%" },
            { b: 3, label: "Após 2 cliques salvos", prob: "50%" },
            { b: 4, label: "Alta tensão", prob: "67%" },
          ].map(({ b, label, prob }) => (
            <div key={b} className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded-full border ${i < b ? 'border-red-500 bg-red-700' : 'border-zinc-700'}`} />
                ))}
              </div>
              <span className="text-zinc-500 text-xs font-mono flex-1">{label}</span>
              <span className={`text-xs font-mono font-bold ${b >= 3 ? 'text-red-400' : 'text-yellow-400'}`}>{prob}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-lg">
        <p className="text-xs text-red-400/80 font-mono">⚠️ Um jogador é eliminado quando vidas = 0. A partida termina quando restar apenas 1 jogador.</p>
      </div>
    </div>
  );
}

function StepVitoria() {
  return (
    <div className="space-y-4">
      <div className="p-5 bg-gradient-to-br from-emerald-950/40 to-zinc-950/40 border-2 border-emerald-500/30 rounded-xl text-center">
        <Trophy className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <p className="text-emerald-300 font-mono font-bold text-lg tracking-wider mb-1">SEJA O ÚLTIMO VIVO</p>
        <p className="text-zinc-300 text-sm">Elimine todos os 6 oponentes sobrevivendo à Roleta Russa e desmascarando blefes.</p>
      </div>
      <div className="space-y-2">
        <p className="text-zinc-500 text-xs font-mono tracking-wider">ESTRATÉGIAS:</p>
        {[
          { icon: "🎭", tip: "BLEFE INTELIGENTE", desc: "Declare errado em fórmulas complexas. Oponentes podem não saber a resposta." },
          { icon: "🧮", tip: "CALCULE ANTES", desc: "Avalie na cabeça antes de declarar. Uma dúvida certa manda o oponente à roleta." },
          { icon: "📊", tip: "OBSERVE O TAMBOR", desc: "Com 4+ balas, é mais seguro duvidar do que puxar o gatilho por engano." },
          { icon: "🎯", tip: "QUANDO DUVIDAR", desc: "Só duvide quando tiver certeza. Dúvida errada te manda para a roleta." },
        ].map(({ icon, tip, desc }) => (
          <div key={tip} className="flex gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-700/40 hover:border-emerald-500/20 transition-colors">
            <span className="text-lg">{icon}</span>
            <div>
              <p className="font-mono text-xs font-bold text-emerald-300 mb-0.5">{tip}</p>
              <p className="text-zinc-400 text-xs">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg">
        <p className="text-xs text-cyan-400/80 font-mono">🌐 MODO ONLINE (em breve): Partidas com jogadores reais via internet serão suportadas em versões futuras.</p>
      </div>
    </div>
  );
}

// ===================== STEPS DO LIAR'S DICE =====================
function StepDiceConfiguracao() {
  return (
    <div className="space-y-4">
      <p className="text-zinc-300 leading-relaxed text-sm">
        Cada jogador entra na mesa com <span className="text-emerald-400 font-bold font-mono">5 dados</span> escondidos
        em um copo. Os valores só são visíveis pra você.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {["J1","J2","J3","VOCÊ"].map((p, i) => (
          <div key={i} className={`flex flex-col items-center gap-1 p-3 rounded-lg border ${i === 3 ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300' : 'border-zinc-700 bg-zinc-900/40 text-zinc-400'} font-mono text-xs`}>
            <span className="text-lg">{i === 3 ? '🫵' : '🎭'}</span>
            <span>{p}</span>
            <span className="text-emerald-400/80 text-[10px]">🫙 5 dados</span>
          </div>
        ))}
      </div>
      <div className="p-4 bg-zinc-900/60 border border-emerald-500/20 rounded-lg space-y-2">
        <p className="text-xs font-mono text-zinc-500 tracking-wider">⚡ REGRA-CHAVE: O '1' é CURINGA</p>
        <p className="text-emerald-300/90 font-mono text-xs">
          Quando alguém aposta "X dados de face Y", todo dado com valor <span className="text-yellow-300 font-bold">1</span> conta como
          se fosse <span className="text-yellow-300 font-bold">Y</span>. Isso aumenta a chance de qualquer aposta ser válida.
        </p>
      </div>
      <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg">
        <p className="text-xs text-emerald-300/80 font-mono">🎯 OBJETIVO: ser o último com dados na mesa.</p>
      </div>
    </div>
  );
}

function StepDiceTurno() {
  return (
    <div className="space-y-4">
      <p className="text-zinc-300 text-sm">No seu turno, escolha <span className="text-emerald-400 font-bold">UMA</span> de 3 ações:</p>
      <div className="space-y-3">
        <div className="p-4 bg-cyan-950/30 border-2 border-cyan-500/40 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📈</span>
            <p className="font-mono text-cyan-300 font-bold tracking-wider">APOSTAR</p>
          </div>
          <p className="text-zinc-300 text-xs">Faz uma aposta NOVA na quantidade total de dados de uma face na mesa. Precisa <span className="text-yellow-300">subir</span> a aposta atual.</p>
        </div>
        <div className="p-4 bg-red-950/30 border-2 border-red-500/40 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">👁️</span>
            <p className="font-mono text-red-300 font-bold tracking-wider">DUVIDAR</p>
          </div>
          <p className="text-zinc-300 text-xs">Acusa que a aposta atual é <span className="text-red-300 font-bold">farol</span>. Todos abrem os copos e contam.</p>
        </div>
        <div className="p-4 bg-zinc-900/40 border-2 border-zinc-700/40 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🚪</span>
            <p className="font-mono text-zinc-300 font-bold tracking-wider">PEDIR AS CONTAS</p>
          </div>
          <p className="text-zinc-400 text-xs">Desiste do round e sai da partida (eliminação voluntária). Use só em emergência.</p>
        </div>
      </div>
    </div>
  );
}

function StepDiceApostar() {
  return (
    <div className="space-y-4">
      <p className="text-zinc-300 text-sm">Pra apostar você diz: <span className="text-cyan-300 font-mono font-bold">"Tem X dados de face Y na mesa"</span> (somando todos os jogadores).</p>
      <div className="p-4 bg-zinc-900/60 border border-yellow-500/30 rounded-lg space-y-2">
        <p className="text-xs font-mono text-yellow-400 tracking-wider">⚠️ REGRA DE ESCALADA</p>
        <p className="text-zinc-300 text-xs">Sua aposta nova precisa <span className="text-yellow-300 font-bold">subir</span> a anterior:</p>
        <ul className="text-zinc-400 text-xs space-y-1 ml-4 font-mono">
          <li>• <span className="text-emerald-400">SUBIR a quantidade</span> (ex: 3→4 dados, com qualquer face)</li>
          <li>• <span className="text-emerald-400">MANTER quantidade</span> e <span className="text-emerald-400">SUBIR a face</span> (ex: 3 dados de face 4 → 3 dados de face 5)</li>
        </ul>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg">
          <p className="text-emerald-300 font-mono text-xs font-bold mb-1">✓ APOSTAS VÁLIDAS</p>
          <p className="text-zinc-400 text-xs font-mono">Atual: 3 × face 4</p>
          <p className="text-emerald-300/80 text-xs font-mono">→ 4 × face 2 ✓</p>
          <p className="text-emerald-300/80 text-xs font-mono">→ 3 × face 5 ✓</p>
          <p className="text-emerald-300/80 text-xs font-mono">→ 6 × face 6 ✓</p>
        </div>
        <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 font-mono text-xs font-bold mb-1">✗ APOSTAS INVÁLIDAS</p>
          <p className="text-zinc-400 text-xs font-mono">Atual: 3 × face 4</p>
          <p className="text-red-300/80 text-xs font-mono">→ 2 × face 6 ✗ (cai qty)</p>
          <p className="text-red-300/80 text-xs font-mono">→ 3 × face 3 ✗ (cai face)</p>
        </div>
      </div>
    </div>
  );
}

function StepDiceDuvidar() {
  return (
    <div className="space-y-4">
      <p className="text-zinc-300 text-sm">Quando alguém duvida, todos abrem os copos e <span className="text-yellow-400 font-bold">contam os dados</span> da face apostada (lembre: '1' é curinga).</p>
      <div className="p-4 bg-zinc-900/60 border border-cyan-500/30 rounded-lg space-y-3">
        <p className="text-cyan-400 font-mono text-xs tracking-wider">📐 EXEMPLO</p>
        <p className="text-zinc-300 text-xs">Aposta atual: <span className="text-yellow-300 font-mono font-bold">4 × face 5</span>. Bob duvida.</p>
        <p className="text-zinc-400 text-xs">Abrindo os copos:</p>
        <p className="text-zinc-300 text-xs font-mono ml-3">• Alice tem: <span className="text-emerald-400">5</span>, 3, 2, <span className="text-yellow-300">1</span>, <span className="text-emerald-400">5</span> → 3 (2 cinco + 1 curinga)</p>
        <p className="text-zinc-300 text-xs font-mono ml-3">• Bob tem: 6, 6, <span className="text-yellow-300">1</span>, 4, 4 → 1 (curinga)</p>
        <p className="text-zinc-300 text-xs font-mono">Total: <span className="text-yellow-300 font-bold">4</span> dados de face 5 (com curingas)</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-lg">
          <p className="text-emerald-300 font-mono text-xs font-bold mb-1">SE A APOSTA COBRIU (≥ qty)</p>
          <p className="text-zinc-300 text-xs">→ <span className="text-red-300 font-bold">DUVIDADOR</span> perde 1 dado</p>
        </div>
        <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-lg">
          <p className="text-red-300 font-mono text-xs font-bold mb-1">SE FALTOU DADO (&lt; qty)</p>
          <p className="text-zinc-300 text-xs">→ <span className="text-red-300 font-bold">APOSTADOR</span> perde 1 dado</p>
        </div>
      </div>
      <p className="text-xs text-zinc-500 italic font-mono">Quem perde 1 dado e fica com <span className="text-red-400">0</span> é eliminado da partida.</p>
    </div>
  );
}

function StepDiceVitoria() {
  return (
    <div className="space-y-4">
      <div className="p-5 bg-gradient-to-br from-emerald-950/40 to-zinc-950/40 border-2 border-emerald-500/30 rounded-xl text-center">
        <Trophy className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <p className="text-emerald-300 font-mono font-bold text-lg tracking-wider mb-1">ÚLTIMO COM DADOS VENCE</p>
        <p className="text-zinc-300 text-sm">Quando todos os outros jogadores forem eliminados (ficarem com 0 dados), você ganha a mesa.</p>
      </div>
      <div className="space-y-2">
        <p className="text-zinc-500 text-xs font-mono tracking-wider">ESTRATÉGIAS:</p>
        {[
          { icon: "🎲", tip: "CONTE OS CURINGAS", desc: "Estatisticamente, cada copo tem ~0.83 'um' (curinga). Com 5 jogadores = ~4 curingas + dados específicos. Use isso pra estimar a aposta." },
          { icon: "🎭", tip: "BLEFE CONTROLADO", desc: "Se a aposta tá baixa demais, suba alto pra forçar o oponente a duvidar (e perder)." },
          { icon: "📊", tip: "OBSERVE PADRÕES", desc: "Quando alguém sobe muito a quantidade, talvez tenha muitos dados daquela face. Pense duas vezes antes de duvidar." },
          { icon: "⏳", tip: "ESCASSEZ É FORÇA", desc: "Com poucos dados, sua aposta é mais difícil de prever. Use isso." },
        ].map(({ icon, tip, desc }) => (
          <div key={tip} className="flex gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-700/40 hover:border-emerald-500/20 transition-colors">
            <span className="text-lg">{icon}</span>
            <div>
              <p className="font-mono text-xs font-bold text-emerald-300 mb-0.5">{tip}</p>
              <p className="text-zinc-400 text-xs">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===================== DEFINIÇÃO DAS ETAPAS =====================
const STEPS_LOGIC = [
  { id: 1, icon: "🎰", label: "INÍCIO", color: "cyan",    title: "Configuração da Mesa",        Component: StepConfiguracao },
  { id: 2, icon: "🃏", label: "TURNO", color: "emerald",  title: "Fluxo de um Turno",           Component: StepTurno },
  { id: 3, icon: "🧠", label: "TIPOS", color: "purple",   title: "Tipos de Fórmulas Lógicas",  Component: StepLogica },
  { id: 4, icon: "⚡", label: "SÍMBOLOS", color: "yellow", title: "Tabela de Conectivos",        Component: StepConectivos },
  { id: 5, icon: "🔫", label: "ROLETA", color: "red",     title: "Roleta Russa",                Component: StepRoleta },
  { id: 6, icon: "🏆", label: "VITÓRIA", color: "emerald", title: "Como Vencer",                Component: StepVitoria },
];

const STEPS_DICE = [
  { id: 1, icon: "🫙", label: "INÍCIO",   color: "emerald", title: "Configuração da Mesa",     Component: StepDiceConfiguracao },
  { id: 2, icon: "🎲", label: "AÇÕES",   color: "cyan",    title: "As 3 Ações do Turno",      Component: StepDiceTurno },
  { id: 3, icon: "📈", label: "APOSTAR", color: "yellow",  title: "Como Apostar",             Component: StepDiceApostar },
  { id: 4, icon: "👁️", label: "DUVIDAR", color: "red",     title: "Como Duvidar Funciona",    Component: StepDiceDuvidar },
  { id: 5, icon: "🏆", label: "VITÓRIA", color: "emerald", title: "Como Vencer",              Component: StepDiceVitoria },
];

const TAB_ACTIVE: Record<string, string> = {
  cyan:    "border-cyan-500 text-cyan-300 bg-cyan-600/20 shadow-[0_0_12px_rgba(6,182,212,0.4)]",
  emerald: "border-emerald-500 text-emerald-300 bg-emerald-600/20 shadow-[0_0_12px_rgba(16,185,129,0.4)]",
  purple:  "border-purple-500 text-purple-300 bg-purple-600/20 shadow-[0_0_12px_rgba(168,85,247,0.4)]",
  yellow:  "border-yellow-500 text-yellow-300 bg-yellow-600/20 shadow-[0_0_12px_rgba(234,179,8,0.4)]",
  red:     "border-red-500 text-red-300 bg-red-600/20 shadow-[0_0_12px_rgba(239,68,68,0.4)]",
};

// ===================== COMPONENTE PRINCIPAL =====================
export function SettingsInstructionsPanel({ isVisible, onBack }: SettingsInstructionsPanelProps) {
  const [masterVolume, setMasterVolume] = useState(true);
  const [crtEffect, setCrtEffect] = useState(false);
  const [activeTab, setActiveTab] = useState<"instructions" | "settings">("instructions");
  const [activeStep, setActiveStep] = useState(0);
  const [rulesMode, setRulesMode] = useState<"logic" | "dice">("logic");

  const STEPS = rulesMode === "logic" ? STEPS_LOGIC : STEPS_DICE;
  const safeStepIdx = Math.min(activeStep, STEPS.length - 1);
  const step = STEPS[safeStepIdx];
  const { Component } = step;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
        >
          {/* BG */}
          <motion.div
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-black to-emerald-950/30"
          />
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.3) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ duration: 0.4 }}
            className="relative w-full max-w-4xl max-h-[95vh] mx-4 flex flex-col rounded-3xl border-2 border-cyan-500/30 bg-zinc-950/90 backdrop-blur-xl shadow-[0_0_60px_rgba(6,182,212,0.2)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 shrink-0">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-cyan-400" />
                <div>
                  <h1 className="text-xl tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono font-black">BOOLEAN BAR</h1>
                  <p className="text-xs tracking-[0.3em] text-cyan-400/40 font-mono">/// INSTRUÇÕES & CONFIG ///</p>
                </div>
              </div>
              <div className="flex gap-1.5 bg-black/40 p-1.5 rounded-xl border border-cyan-500/20">
                <button onClick={() => setActiveTab("instructions")} className={`px-5 py-2 rounded-lg font-mono text-xs tracking-wider transition-all duration-300 ${activeTab === "instructions" ? "bg-cyan-600 text-white" : "text-cyan-400/60 hover:text-cyan-400"}`}>INSTRUÇÕES</button>
                <button onClick={() => setActiveTab("settings")} className={`px-5 py-2 rounded-lg font-mono text-xs tracking-wider transition-all duration-300 ${activeTab === "settings" ? "bg-emerald-600 text-white" : "text-emerald-400/60 hover:text-emerald-400"}`}>CONFIG</button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <AnimatePresence mode="wait">

                {activeTab === "instructions" && (
                  <motion.div key="inst" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
                    {/* Step tabs */}
                    <div className="flex gap-1.5 px-5 py-2 border-b border-zinc-800 overflow-x-auto shrink-0">
                      {STEPS.map((s, i) => (
                        <button key={s.id} onClick={() => setActiveStep(i)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-xs tracking-wider whitespace-nowrap transition-all duration-300 border ${activeStep === i ? TAB_ACTIVE[s.color] : "border-zinc-700 text-zinc-500 hover:text-zinc-300"}`}>
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 overflow-y-auto p-5">
                      <AnimatePresence mode="wait">
                        <motion.div key={activeStep} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
                          <h2 className="text-base font-mono font-bold mb-4 text-white flex items-center gap-2">
                            <span>{step.icon}</span>
                            <span className="text-zinc-500">ETAPA {step.id}:</span>
                            <span>{step.title}</span>
                          </h2>
                          <Component />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 shrink-0">
                      <button onClick={() => setActiveStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0}
                        className="px-4 py-2 font-mono text-xs border border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        ← ANTERIOR
                      </button>
                      <div className="flex gap-1.5 items-center">
                        {STEPS.map((_, i) => (
                          <div key={i} onClick={() => setActiveStep(i)} className={`h-1.5 rounded-full cursor-pointer transition-all ${i === activeStep ? 'bg-cyan-400 w-6' : 'bg-zinc-700 w-2 hover:bg-zinc-500'}`} />
                        ))}
                      </div>
                      <button onClick={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))} disabled={activeStep === STEPS.length - 1}
                        className="px-4 py-2 font-mono text-xs border border-cyan-500/50 text-cyan-400 rounded-lg hover:border-cyan-400 hover:bg-cyan-950/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        PRÓXIMO →
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === "settings" && (
                  <motion.div key="set" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-6 space-y-4">
                    <h2 className="text-xl tracking-wider text-emerald-400 font-mono font-black">CONFIGURAÇÕES</h2>
                    <div className="bg-zinc-900/60 border-2 border-cyan-500/30 rounded-xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {masterVolume ? <Volume2 className="w-6 h-6 text-cyan-400" /> : <VolumeX className="w-6 h-6 text-zinc-500" />}
                        <div>
                          <h3 className="tracking-wider text-cyan-300 font-mono font-bold text-sm">MASTER VOLUME</h3>
                          <p className="text-xs text-zinc-400">Volume global do jogo</p>
                        </div>
                      </div>
                      <button onClick={() => setMasterVolume(!masterVolume)} className={`relative w-16 h-8 rounded-full border-2 transition-all duration-300 ${masterVolume ? "bg-cyan-600 border-cyan-400" : "bg-zinc-800 border-zinc-600"}`}>
                        <motion.div animate={{ x: masterVolume ? 28 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`absolute top-1 left-1 w-5 h-5 rounded-full ${masterVolume ? "bg-white" : "bg-zinc-600"}`} />
                      </button>
                    </div>
                    <div className="bg-zinc-900/60 border-2 border-emerald-500/30 rounded-xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Monitor className={`w-6 h-6 ${crtEffect ? "text-emerald-400" : "text-zinc-500"}`} />
                        <div>
                          <h3 className="tracking-wider text-emerald-300 font-mono font-bold text-sm">CRT MONITOR EFFECT</h3>
                          <p className="text-xs text-zinc-400">Efeito retro com scanlines</p>
                        </div>
                      </div>
                      <button onClick={() => setCrtEffect(!crtEffect)} className={`relative w-16 h-8 rounded-full border-2 transition-all duration-300 ${crtEffect ? "bg-emerald-600 border-emerald-400" : "bg-zinc-800 border-zinc-600"}`}>
                        <motion.div animate={{ x: crtEffect ? 28 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`absolute top-1 left-1 w-5 h-5 rounded-full ${crtEffect ? "bg-white" : "bg-zinc-600"}`} />
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-cyan-500/20 shrink-0">
              <p className="text-xs text-cyan-400/30 font-mono">/// v1.0.0 ///</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBack}
                className="relative px-8 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-xl border-2 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)] overflow-hidden">
                <motion.div animate={{ x: ["-200%","200%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                <span className="relative text-sm tracking-[0.2em] font-mono font-black flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> VOLTAR AO JOGO
                </span>
              </motion.button>
            </div>

            {/* Corner decorations */}
            <div className="absolute top-10 left-10 w-20 h-20 border-l-4 border-t-4 border-cyan-400/20 pointer-events-none" />
            <div className="absolute top-10 right-10 w-20 h-20 border-r-4 border-t-4 border-emerald-400/20 pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-20 h-20 border-l-4 border-b-4 border-emerald-400/20 pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-20 h-20 border-r-4 border-b-4 border-cyan-400/20 pointer-events-none" />
          </motion.div>

          {/* Toggle de modo de jogo — canto inferior direito (só aparece na aba de instruções) */}
          {activeTab === "instructions" && (
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[110] flex flex-col items-end gap-2">
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-mono">Manual</span>
              <div className="flex bg-black/80 border border-zinc-700 rounded-full p-1 backdrop-blur-md">
                <button
                  onClick={() => { setRulesMode("logic"); setActiveStep(0); }}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-mono text-[10px] sm:text-xs uppercase tracking-widest transition-all ${
                    rulesMode === "logic"
                      ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                      : "text-zinc-400 hover:text-cyan-300"
                  }`}
                  style={rulesMode === "logic" ? { fontWeight: 700 } : undefined}
                >
                  <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Boolean Bar</span>
                  <span className="sm:hidden">Lógica</span>
                </button>
                <button
                  onClick={() => { setRulesMode("dice"); setActiveStep(0); }}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-mono text-[10px] sm:text-xs uppercase tracking-widest transition-all ${
                    rulesMode === "dice"
                      ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(52,211,153,0.6)]"
                      : "text-zinc-400 hover:text-emerald-300"
                  }`}
                  style={rulesMode === "dice" ? { fontWeight: 700 } : undefined}
                >
                  <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Liar's Dice</span>
                  <span className="sm:hidden">Dados</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

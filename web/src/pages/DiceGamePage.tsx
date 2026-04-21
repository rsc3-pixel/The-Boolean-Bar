import { useState } from "react";
import { motion } from "motion/react";
import { Skull, Circle, Settings, ArrowLeft, Dices, ArrowUpCircle, CheckCircle2 } from "lucide-react";
import { OpponentDiceCard } from "../components/ui/OpponentDiceCard";
import { DiceFace } from "../components/ui/DiceFace";

interface DiceGamePageProps {
  playerNames: string[];
  onExit: () => void;
}

export function DiceGamePage({ playerNames, onExit }: DiceGamePageProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Mock Data for the UI demonstration
  const totalPlayers = playerNames.length || 6;
  const playersAlive = totalPlayers;
  const cylinderCapacity = 6;
  const bulletsInCylinder = 1;

  const opponents = (playerNames.length > 0 ? playerNames : ["Alice", "Bob", "Charlie", "Dave", "Eve"]).slice(0, 5).map((name) => ({
    name,
    lives: 3,
    diceRemaining: 5,
    isEliminated: false
  }));

  const playerHand = [2, 4, 4, 6, 1]; // Roll do jogador local
  const currentBid = { quantity: 5, face: 4 }; // Aposta atual na mesa
  const currentPlayerName = "VOCÊ";

  return (
    <div className="size-full bg-black overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 h-20 bg-zinc-950/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="h-full max-w-7xl mx-auto px-8 flex items-center justify-between">
          <h1 className="text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}>
            THE BOOLEAN BAR <span className="text-sm tracking-widest text-cyan-500 font-mono">/ DICE MODE</span>
          </h1>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="text-xs font-mono tracking-wider text-emerald-400">
                MOCK SERVER ON
              </span>
            </div>
            {/* Balas no cilindro */}
            <div className="flex items-center gap-3">
              <span className="text-xs tracking-widest text-zinc-400 font-mono">BALAS:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: cylinderCapacity }).map((_, i) => (
                  <Circle key={i} className={`w-3 h-3 ${i < bulletsInCylinder ? 'text-red-500 fill-red-500' : 'text-zinc-700 fill-zinc-700'}`} />
                ))}
              </div>
              <span className="text-sm font-mono text-red-400">{bulletsInCylinder}/{cylinderCapacity}</span>
            </div>
            {/* Jogadores vivos */}
            <div className="flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-400" />
              <span className="text-xs tracking-widest text-zinc-400 font-mono">VIVOS:</span>
              <span className="text-sm font-mono text-emerald-400">{playersAlive}/{totalPlayers}</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Área de jogo */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black game-area-wrapper">
        <style>{`
          .game-area-wrapper { zoom: 1; }
          @media (max-height: 850px) { .game-area-wrapper { zoom: 0.85; } }
          @media (max-height: 750px) { .game-area-wrapper { zoom: 0.75; } }
          @media (max-height: 650px) { .game-area-wrapper { zoom: 0.65; } }
        `}</style>
        <div className="w-full h-full relative flex flex-col justify-between max-h-[900px]">
          {/* Grid de fundo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
          </div>

          {/* Botão Back to Menu */}
          <motion.button
            onClick={() => { if(window.confirm("Voltar ao menu?")) onExit(); }}
            className="absolute top-8 left-8 z-30 flex items-center gap-2 px-5 py-3 bg-cyan-950/50 backdrop-blur-md border-2 border-cyan-500/40 rounded-xl text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/60 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-mono font-bold">VOLTAR</span>
          </motion.button>

          {/* Oponentes no topo */}
          <div className="relative mt-4 w-full z-10 max-w-6xl mx-auto px-8 flex justify-center gap-8">
            {opponents.map((opponent) => <OpponentDiceCard key={opponent.name} {...opponent} />)}
          </div>

          {/* Mesa central — Aposta atual + Botões */}
          <div className="flex-1 flex items-center justify-center p-4 z-0 min-h-[200px]">
            <div className="relative w-full max-w-[800px] aspect-[2/1] max-h-[350px] min-h-[200px] rounded-[100px] sm:rounded-[200px] bg-emerald-950/40 border-4 border-emerald-900/50 flex flex-col items-center justify-center gap-8 shadow-[0_0_50px_rgba(4,120,87,0.2)]">
              {/* Informação da Aposta (BID) */}
              <div className="flex items-center gap-6">
                <span className="text-3xl text-emerald-400 font-mono tracking-widest drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">
                  BID: {currentBid.quantity} DADOS DE
                </span>
                <div className="bg-emerald-950/80 p-2 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)] border border-emerald-500/50">
                  <DiceFace value={currentBid.face} size="lg" glowColor="emerald" />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-6 mt-4">
                <button
                  onClick={() => alert("Mock: Você duvidou!")}
                  className="group flex flex-col items-center justify-center gap-2 px-8 py-4 w-40 bg-red-950/60 hover:bg-red-900/80 border-2 border-red-500/80 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)]"
                >
                  <Skull className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="text-red-400 font-mono font-bold tracking-wider">DUVIDAR</span>
                </button>
                
                <button
                  onClick={() => alert("Mock: Exatamente isso!")}
                  className="group flex flex-col items-center justify-center gap-2 px-8 py-4 w-40 bg-zinc-900/60 hover:bg-zinc-800/80 border-2 border-zinc-500/80 rounded-xl transition-all shadow-[0_0_15px_rgba(161,161,170,0.3)] hover:shadow-[0_0_25px_rgba(161,161,170,0.5)]"
                >
                  <CheckCircle2 className="w-6 h-6 text-zinc-400 group-hover:scale-110 transition-transform" />
                  <span className="text-zinc-400 font-mono font-bold tracking-wider">EXATO</span>
                </button>

                <button
                  onClick={() => alert("Mock: Aumentar Aposta selecionado")}
                  className="group flex flex-col items-center justify-center gap-2 px-8 py-4 w-40 bg-cyan-950/60 hover:bg-cyan-900/80 border-2 border-cyan-500/80 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]"
                >
                  <ArrowUpCircle className="w-6 h-6 text-cyan-400 group-hover:-translate-y-1 transition-transform" />
                  <span className="text-cyan-400 font-mono font-bold tracking-wider">RAISE</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mão do jogador (Dados rolando) */}
          <div className="relative w-full mt-auto z-20 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-4 sm:pt-12 pb-2 sm:pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-8">
              {/* Label do jogador atual */}
              <div className="text-center mb-6">
                <span className="text-sm sm:text-base font-mono font-bold tracking-widest text-cyan-500/80">
                  <Dices className="inline w-5 h-5 mr-2" />
                  COPO DE {currentPlayerName}
                </span>
                <p className="animate-pulse text-zinc-600 font-mono text-[10px] tracking-widest mt-2 uppercase">
                  /// SUA ROLAGEM SECRETA ///
                </p>
              </div>
              
              <div className="flex justify-center items-end gap-4 sm:gap-6">
                {playerHand.map((val, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5, type: 'spring' }}
                  >
                    <DiceFace value={val} size="lg" glowColor="cyan" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, UserPlus, Bot, Dices, Trash2, Play } from "lucide-react";

interface DiceLobbyProps {
  onStartMatch: (players: { name: string; isBot: boolean }[]) => void;
  onBack: () => void;
}

interface LobbyPlayer {
  name: string;
  isBot: boolean;
}

export function DiceLobby({ onStartMatch, onBack }: DiceLobbyProps) {
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [inputName, setInputName] = useState("");
  const maxPlayers = 6;

  const addHuman = () => {
    const name = inputName.trim();
    if (!name || players.length >= maxPlayers) return;
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) return;
    setPlayers(prev => [...prev, { name, isBot: false }]);
    setInputName("");
  };

  const addBot = () => {
    if (players.length >= maxPlayers) return;
    const botNames = ["Barbossa", "Sparrow", "Davy", "Gibbs", "Calypso", "Turner"];
    const usedNames = players.map(p => p.name);
    const available = botNames.filter(n => !usedNames.includes(n));
    const name = available.length > 0 ? available[0] : `Bot${players.length + 1}`;
    setPlayers(prev => [...prev, { name, isBot: true }]);
  };

  const removePlayer = (index: number) => {
    setPlayers(prev => prev.filter((_, i) => i !== index));
  };

  const canStart = players.length >= 2 && players.some(p => !p.isBot);
  const humanCount = players.filter(p => !p.isBot).length;
  const botCount = players.filter(p => p.isBot).length;



  return (
    <div className="size-full bg-black overflow-hidden flex flex-col items-center font-sans relative">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(52, 211, 153, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.2) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-emerald-500/30" />
      <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-emerald-500/30" />
      <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-emerald-500/30" />
      <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-emerald-500/30" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center gap-2 pt-8"
      >
        <h1 className="text-5xl tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400" style={{ fontWeight: 900 }}>
          LOBBY
        </h1>
        <p className="text-xs tracking-[0.3em] text-emerald-500/60 font-mono uppercase">
          Liar's Dice — Configure os jogadores
        </p>
      </motion.div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onBack}
        className="absolute top-8 left-8 z-30 flex items-center gap-2 px-4 py-2 bg-zinc-950/50 backdrop-blur-md border border-emerald-500/30 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-mono font-bold tracking-wider">VOLTAR</span>
      </motion.button>

      {/* Circular table with seats */}
      <div className="relative flex-1 w-full max-w-[900px] mt-4 mb-4" style={{ minHeight: "480px" }}>
        {/* Central table */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full bg-emerald-950/30 border-2 border-emerald-500/20 flex flex-col items-center justify-center gap-2">
          <Dices className="w-10 h-10 text-emerald-400/40" />
          <span className="text-emerald-400/80 font-mono text-sm tracking-wider">
            {players.length} jogadores
          </span>
          <span className="text-emerald-500/40 font-mono text-xs">
            {players.length}/{maxPlayers} assentos
          </span>
        </div>

        {/* Seats */}
        {Array.from({ length: maxPlayers }).map((_, idx) => {
          const player = players[idx];
          const angle = idx * 60; // 0, 60, 120, 180, 240, 300
          return (
            <div
              key={idx}
              className="absolute top-1/2 left-1/2"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-180px) rotate(-${angle}deg)`,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
              {player ? (
                // Occupied seat
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] tracking-widest text-emerald-400/60 font-mono uppercase">
                    {player.isBot ? "BOT" : `ASSENTO ${idx + 1}`}
                  </span>
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center
                    ${player.isBot
                      ? 'bg-gradient-to-br from-purple-900/60 to-purple-950 border-2 border-purple-500/50'
                      : 'bg-gradient-to-br from-emerald-900/60 to-emerald-950 border-2 border-emerald-400/60'
                    }
                    shadow-[0_0_20px_rgba(52,211,153,0.2)]
                    relative
                  `}>
                    {player.isBot ? (
                      <Bot className="w-7 h-7 text-purple-400" />
                    ) : (
                      <span className="text-2xl font-bold text-emerald-300">{player.name.charAt(0)}</span>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => removePlayer(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <span className="text-sm font-mono font-bold tracking-wider text-emerald-300">
                    {player.name}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-500/50">5 DADOS</span>
                </div>
              ) : (
                // Empty seat
                <div className="flex flex-col items-center gap-2 opacity-30">
                  <span className="text-[10px] tracking-widest text-zinc-600 font-mono">VAGO</span>
                  <div className="w-16 h-16 rounded-full bg-zinc-900/40 border-2 border-dashed border-zinc-700/40 flex items-center justify-center">
                    <Dices className="w-6 h-6 text-zinc-700" />
                  </div>
                  <span className="text-xs font-mono text-zinc-700 border border-zinc-800 px-3 py-0.5 rounded">VAZIO</span>
                </div>
              )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Bottom controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 w-full max-w-[700px] pb-8 flex flex-col items-center gap-5"
      >
        {/* Add player controls */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addHuman()}
              placeholder="Nome do jogador..."
              maxLength={12}
              className="w-56 px-4 py-3 bg-zinc-950/80 border-2 border-emerald-500/40 rounded-lg text-emerald-300 font-mono text-sm focus:outline-none focus:border-emerald-400 placeholder:text-zinc-600 tracking-wider"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addHuman}
            disabled={players.length >= maxPlayers || !inputName.trim()}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-950/60 border-2 border-emerald-500/50 rounded-lg text-emerald-400 font-mono font-bold text-sm tracking-wider hover:bg-emerald-900/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-5 h-5" />
            + JOGADOR
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addBot}
            disabled={players.length >= maxPlayers}
            className="flex items-center gap-2 px-5 py-3 bg-purple-950/60 border-2 border-purple-500/50 rounded-lg text-purple-400 font-mono font-bold text-sm tracking-wider hover:bg-purple-900/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Bot className="w-5 h-5" />
            🤖 BOT
          </motion.button>
        </div>

        {/* Status + Start */}
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono text-emerald-500/60">
            👤 {humanCount} humanos · 🤖 {botCount} bots
          </span>

          <motion.button
            whileHover={canStart ? { scale: 1.03 } : {}}
            whileTap={canStart ? { scale: 0.97 } : {}}
            onClick={() => canStart && onStartMatch(players)}
            disabled={!canStart}
            className={`
              flex items-center gap-3 px-12 py-4 rounded-xl font-mono font-bold text-xl tracking-wider transition-all
              ${canStart
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-black border-2 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.5)] hover:shadow-[0_0_60px_rgba(52,211,153,0.7)]'
                : 'bg-zinc-900/50 text-zinc-600 border-2 border-zinc-700 cursor-not-allowed'
              }
            `}
          >
            <Play className="w-6 h-6" />
            INICIAR PARTIDA
          </motion.button>
        </div>

        {/* Help text */}
        <motion.p
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-[10px] tracking-[0.3em] text-emerald-500/30 font-mono uppercase"
        >
          {!canStart
            ? "/// ADICIONE AO MENOS 2 JOGADORES (1 HUMANO) ///"
            : "/// PRONTO PARA JOGAR — QUE COMECE O BLEFE ///"}
        </motion.p>
      </motion.div>
    </div>
  );
}

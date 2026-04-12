import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Plus, UserPlus, Bot, Crown, Skull, X } from "lucide-react";

interface MatchLobbyProps {
  onBackToMenu: () => void;
  onStartMatch: (players: Player[]) => void;
}

interface Player {
  id: string;
  name: string;
  type: "human" | "bot";
  isHost: boolean;
  avatar: number;
}

const avatarColors = [
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-pink-600",
  "from-orange-500 to-red-600",
  "from-yellow-500 to-amber-600",
  "from-indigo-500 to-violet-600",
  "from-rose-500 to-pink-600"
];

export function MatchLobby({ onBackToMenu, onStartMatch }: MatchLobbyProps) {
  const [players, setPlayers] = useState<Player[]>([
    { id: "1", name: "CIPHER", type: "human", isHost: true, avatar: 0 },
    { id: "2", name: "AXIOM", type: "bot", isHost: false, avatar: 1 },
    { id: "3", name: "NEXUS", type: "bot", isHost: false, avatar: 2 }
  ]);
  
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerType, setNewPlayerType] = useState<"bot" | "human">("bot");

  const maxPlayers = 7;
  const canAddMore = players.length < maxPlayers;
  const canStartMatch = players.length >= 2;

  const openAddPlayerModal = (type: "bot" | "human") => {
    if (!canAddMore) return;
    
    setNewPlayerType(type);
    
    // Set default name
    if (type === "bot") {
      const botNames = ["VECTOR", "PRISM", "OMEGA", "VOLT", "ECHO", "GHOST"];
      const availableName = botNames.find(name =>
        !players.some(p => p.name === name)
      ) || `BOT_${players.length + 1}`;
      setNewPlayerName(availableName);
    } else {
      setNewPlayerName(`JOGADOR_${players.length + 1}`);
    }
    
    setShowAddPlayerModal(true);
  };

  const confirmAddPlayer = () => {
    if (!canAddMore || !newPlayerName.trim()) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim().toUpperCase(),
      type: newPlayerType,
      isHost: false,
      avatar: players.length % avatarColors.length
    };

    setPlayers([...players, newPlayer]);
    setShowAddPlayerModal(false);
    setNewPlayerName("");
  };

  const cancelAddPlayer = () => {
    setShowAddPlayerModal(false);
    setNewPlayerName("");
  };

  const removePlayer = (id: string) => {
    const player = players.find(p => p.id === id);
    if (player?.isHost) return; // Can't remove host
    setPlayers(players.filter(p => p.id !== id));
  };

  return (
    <div className="size-full bg-gradient-to-br from-black via-zinc-950 to-zinc-900 overflow-hidden relative flex flex-col">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Animated scan lines */}
      <motion.div
        animate={{ y: ['-100%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none"
        style={{ height: '200%' }}
      />

      {/* BACK TO MENU button - Top Left */}
      <motion.button
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.05, x: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBackToMenu}
        className="absolute top-8 left-8 z-30 flex items-center gap-3 px-6 py-3 bg-zinc-950/60 backdrop-blur-xl border-2 border-cyan-500/30 rounded-xl text-cyan-300 hover:text-cyan-100 hover:bg-cyan-950/50 hover:border-cyan-400/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 group"
      >
        <motion.div
          animate={{ x: [-3, 3, -3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
        </motion.div>
        <span className="text-sm tracking-[0.2em] font-mono" style={{ fontWeight: 700 }}>
          BACK TO MENU
        </span>
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 pt-8 pb-6 flex flex-col items-center gap-4"
      >
        <h1 className="text-5xl tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}>
          MATCH LOBBY
        </h1>
        <p className="text-sm tracking-[0.25em] text-zinc-500 font-mono">
          /// PREPARE-SE PARA O CONFRONTO ///
        </p>
        <div className="w-96 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-12 pb-24">
        {/* Player List Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-5xl"
        >
          {/* Section title */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]" />
              <h2 className="text-2xl tracking-[0.2em] text-cyan-400 font-mono" style={{ fontWeight: 800 }}>
                PLAYER LIST
              </h2>
            </div>
            <div className="px-4 py-2 bg-zinc-900/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg">
              <span className="text-sm font-mono text-cyan-300">
                {players.length} / {maxPlayers} JOGADORES
              </span>
            </div>
          </div>

          {/* Player slots grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                className="group relative"
              >
                {/* Player card */}
                <div className="relative h-24 bg-zinc-900/40 backdrop-blur-xl border-2 border-cyan-500/20 rounded-xl overflow-hidden hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300">
                  {/* Glassmorphic overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

                  {/* Animated glow */}
                  <motion.div
                    animate={{
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.3
                    }}
                    className={`absolute inset-0 bg-gradient-to-r ${avatarColors[player.avatar]} opacity-10`}
                  />

                  <div className="relative h-full flex items-center gap-4 px-6">
                    {/* Avatar */}
                    <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${avatarColors[player.avatar]} flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]`}>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)'
                        }}
                      />
                      <span className="relative text-2xl font-mono" style={{ fontWeight: 900 }}>
                        {player.name[0]}
                      </span>

                      {/* Host crown */}
                      {player.isHost && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.6)]">
                          <Crown className="w-4 h-4 text-black" fill="black" />
                        </div>
                      )}
                    </div>

                    {/* Player info */}
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg tracking-wider text-cyan-300 font-mono" style={{ fontWeight: 700 }}>
                          {player.name}
                        </span>
                        {player.isHost && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-[10px] tracking-wider text-yellow-400 font-mono">
                            HOST
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {player.type === "bot" ? (
                          <>
                            <Bot className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs tracking-wider text-emerald-400 font-mono">BOT</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 text-cyan-400" />
                            <span className="text-xs tracking-wider text-cyan-400 font-mono">HUMANO</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Remove button (only for non-host players) */}
                    {!player.isHost && (
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removePlayer(player.id)}
                        className="w-8 h-8 bg-red-950/50 border border-red-500/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-900/60 hover:border-red-400/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300"
                      >
                        <Skull className="w-4 h-4 text-red-400" />
                      </motion.button>
                    )}
                  </div>

                  {/* Scan line effect */}
                  <motion.div
                    animate={{ y: ['-100%', '200%'] }}
                    transition={{ duration: 4, repeat: Infinity, delay: index * 0.5, ease: "linear" }}
                    className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent pointer-events-none"
                  />
                </div>
              </motion.div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: maxPlayers - players.length }).map((_, index) => (
              <motion.div
                key={`empty-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + (players.length + index) * 0.1 }}
                className="h-24 bg-zinc-950/20 backdrop-blur-sm border-2 border-dashed border-zinc-700/30 rounded-xl flex items-center justify-center"
              >
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <div className="w-12 h-12 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-zinc-600" />
                  </div>
                  <span className="text-xs tracking-wider text-zinc-600 font-mono">VAZIO</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex gap-4 justify-center"
          >
            {/* Add Bot button */}
            <motion.button
              whileHover={{ scale: canAddMore ? 1.05 : 1 }}
              whileTap={{ scale: canAddMore ? 0.95 : 1 }}
              onClick={() => openAddPlayerModal("bot")}
              disabled={!canAddMore}
              className={`relative px-8 py-4 rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                canAddMore
                  ? 'bg-emerald-950/40 border-emerald-500/40 hover:bg-emerald-900/50 hover:border-emerald-400/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                  : 'bg-zinc-900/20 border-zinc-700/30 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Pulsing effect when active */}
              {canAddMore && (
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-400/20 to-emerald-500/0"
                />
              )}

              <div className="relative flex items-center gap-3">
                <Bot className={`w-6 h-6 ${canAddMore ? 'text-emerald-400' : 'text-zinc-600'}`} />
                <span className={`text-lg tracking-[0.2em] font-mono ${canAddMore ? 'text-emerald-300' : 'text-zinc-600'}`} style={{ fontWeight: 700 }}>
                  + ADD BOT
                </span>
              </div>
            </motion.button>

            {/* Invite Opponent button */}
            <motion.button
              whileHover={{ scale: canAddMore ? 1.05 : 1 }}
              whileTap={{ scale: canAddMore ? 0.95 : 1 }}
              onClick={() => openAddPlayerModal("human")}
              disabled={!canAddMore}
              className={`relative px-8 py-4 rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                canAddMore
                  ? 'bg-cyan-950/40 border-cyan-500/40 hover:bg-cyan-900/50 hover:border-cyan-400/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]'
                  : 'bg-zinc-900/20 border-zinc-700/30 opacity-50 cursor-not-allowed'
              }`}
            >
              {/* Pulsing effect when active */}
              {canAddMore && (
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-400/20 to-cyan-500/0"
                />
              )}

              <div className="relative flex items-center gap-3">
                <UserPlus className={`w-6 h-6 ${canAddMore ? 'text-cyan-400' : 'text-zinc-600'}`} />
                <span className={`text-lg tracking-[0.2em] font-mono ${canAddMore ? 'text-cyan-300' : 'text-zinc-600'}`} style={{ fontWeight: 700 }}>
                  + INVITE OPPONENT
                </span>
              </div>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* START MATCH button - Bottom Right */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-8 right-8 z-20"
      >
        <motion.button
          whileHover={{ scale: canStartMatch ? 1.05 : 1 }}
          whileTap={{ scale: canStartMatch ? 0.95 : 1 }}
          onClick={() => canStartMatch && onStartMatch(players)}
          disabled={!canStartMatch}
          className={`relative px-12 py-6 rounded-xl border-2 overflow-hidden transition-all duration-300 ${
            canStartMatch
              ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 border-emerald-400/60 shadow-[0_0_50px_rgba(16,185,129,0.5)] hover:shadow-[0_0_80px_rgba(16,185,129,0.8)]'
              : 'bg-zinc-900/40 border-zinc-700/40 opacity-50 cursor-not-allowed'
          }`}
        >
          {/* Animated shine effect */}
          {canStartMatch && (
            <>
              <motion.div
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
              <motion.div
                animate={{
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-300/30 to-cyan-400/0"
              />
            </>
          )}

          <span className={`relative text-3xl tracking-[0.3em] font-sans drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] ${
            canStartMatch ? 'text-white' : 'text-zinc-600'
          }`} style={{ fontWeight: 900 }}>
            START MATCH
          </span>
        </motion.button>

        {/* Status text */}
        {!canStartMatch && (
          <motion.p
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-xs tracking-wider text-red-400/60 font-mono mt-3 text-center"
          >
            /// MÍNIMO 2 JOGADORES NECESSÁRIO ///
          </motion.p>
        )}
      </motion.div>

      {/* Corner decorative elements */}
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-cyan-500/20 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-cyan-500/20 rounded-bl-lg" />

      {/* Add Player Modal */}
      <AnimatePresence>
        {showAddPlayerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center"
            onClick={cancelAddPlayer}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-zinc-950/95 backdrop-blur-2xl border-2 border-cyan-500/40 rounded-2xl p-10 w-[500px] shadow-[0_0_60px_rgba(6,182,212,0.3)]"
            >
              {/* Animated scan line */}
              <motion.div
                animate={{ y: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent pointer-events-none"
              />

              {/* Header */}
              <div className="relative flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  {newPlayerType === "bot" ? (
                    <Bot className="w-8 h-8 text-emerald-400" strokeWidth={2} />
                  ) : (
                    <UserPlus className="w-8 h-8 text-cyan-400" strokeWidth={2} />
                  )}
                  <h2 className="text-2xl tracking-[0.2em] text-cyan-300 font-mono" style={{ fontWeight: 800 }}>
                    {newPlayerType === "bot" ? "ADICIONAR BOT" : "CONVIDAR JOGADOR"}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={cancelAddPlayer}
                  className="w-10 h-10 bg-red-950/50 border-2 border-red-500/40 rounded-lg flex items-center justify-center hover:bg-red-900/60 hover:border-red-400/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300"
                >
                  <X className="w-5 h-5 text-red-400" strokeWidth={2.5} />
                </motion.button>
              </div>

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-8" />

              {/* Input field */}
              <div className="relative mb-8">
                <label className="block text-xs tracking-[0.3em] text-cyan-500/70 font-mono uppercase mb-3">
                  NOME DO JOGADOR
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmAddPlayer();
                      if (e.key === 'Escape') cancelAddPlayer();
                    }}
                    autoFocus
                    maxLength={20}
                    className="w-full px-5 py-4 bg-zinc-900/60 backdrop-blur-sm border-2 border-cyan-500/30 rounded-xl text-lg tracking-[0.15em] text-cyan-100 font-mono placeholder:text-zinc-600 focus:border-cyan-400/60 focus:outline-none focus:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300"
                    placeholder="Digite o nome..."
                    style={{ textTransform: 'uppercase' }}
                  />
                  {/* Character counter */}
                  <span className="absolute right-4 -bottom-6 text-xs tracking-wider text-zinc-600 font-mono">
                    {newPlayerName.length} / 20
                  </span>
                  
                  {/* Glowing border effect on focus */}
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)'
                    }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="relative flex gap-4 justify-end mt-12">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cancelAddPlayer}
                  className="px-6 py-3 bg-zinc-900/60 border-2 border-zinc-700/50 rounded-xl text-zinc-400 hover:text-zinc-200 hover:border-zinc-600/70 font-mono tracking-wider transition-all duration-300"
                >
                  CANCELAR
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmAddPlayer}
                  disabled={!newPlayerName.trim()}
                  className={`relative px-8 py-3 rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                    newPlayerName.trim()
                      ? newPlayerType === "bot"
                        ? 'bg-emerald-950/40 border-emerald-500/60 hover:bg-emerald-900/60 hover:border-emerald-400/80 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                        : 'bg-cyan-950/40 border-cyan-500/60 hover:bg-cyan-900/60 hover:border-cyan-400/80 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]'
                      : 'bg-zinc-900/30 border-zinc-700/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Pulsing glow effect */}
                  {newPlayerName.trim() && (
                    <motion.div
                      animate={{
                        opacity: [0.4, 0.7, 0.4]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className={`absolute inset-0 bg-gradient-to-r ${
                        newPlayerType === "bot"
                          ? 'from-emerald-500/0 via-emerald-400/30 to-emerald-500/0'
                          : 'from-cyan-500/0 via-cyan-400/30 to-cyan-500/0'
                      }`}
                    />
                  )}

                  <div className="relative flex items-center gap-3">
                    {newPlayerType === "bot" ? (
                      <Bot className={`w-5 h-5 ${newPlayerName.trim() ? 'text-emerald-400' : 'text-zinc-600'}`} strokeWidth={2.5} />
                    ) : (
                      <UserPlus className={`w-5 h-5 ${newPlayerName.trim() ? 'text-cyan-400' : 'text-zinc-600'}`} strokeWidth={2.5} />
                    )}
                    <span className={`text-base tracking-[0.2em] font-mono ${newPlayerName.trim() ? (newPlayerType === "bot" ? 'text-emerald-300' : 'text-cyan-300') : 'text-zinc-600'}`} style={{ fontWeight: 700 }}>
                      ADICIONAR
                    </span>
                  </div>
                </motion.button>
              </div>

              {/* Corner decorations */}
              <div className="absolute top-3 left-3 w-12 h-12 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-xl" />
              <div className="absolute bottom-3 right-3 w-12 h-12 border-r-2 border-b-2 border-cyan-500/30 rounded-br-xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

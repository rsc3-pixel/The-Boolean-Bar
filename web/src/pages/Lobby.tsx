import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Skull, Atom, Zap, Target, Eye, Lock, Plus, X, Play, Bot } from "lucide-react";

interface LobbyProps {
  onStartMatch: (playerNames: string[]) => void;
}

const avatarIcons = [User, Skull, Atom, Zap, Target, Eye, Lock];
const MAX_PLAYERS = 8;
const MIN_HUMAN_PLAYERS = 2;

type Seat = { type: "human"; name: string } | { type: "bot" } | { type: "empty" };

function buildDefaultSeats(): Seat[] {
  // Começa tudo vazio — bots são só um tipo visual
  return Array.from({ length: MAX_PLAYERS }, () => ({ type: "empty" as const }));
}

export function Lobby({ onStartMatch }: LobbyProps) {
  const [seats, setSeats] = useState<Seat[]>(buildDefaultSeats);
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const humanCount = seats.filter(s => s.type === "human").length;
  const filledCount = seats.filter(s => s.type !== "empty").length;

  // Primeiro assento vazio disponível
  const nextEmptyIndex = seats.findIndex(s => s.type === "empty");

  const addHuman = () => {
    const name = inputValue.trim().toUpperCase();
    if (!name) { setError("Digite um nome antes de adicionar."); return; }
    if (seats.some(s => s.type === "human" && (s as any).name === name)) {
      setError("Esse nome já está na mesa."); return;
    }
    if (nextEmptyIndex === -1) { setError("Mesa cheia! Remova um assento primeiro."); return; }
    setSeats(prev => {
      const next = [...prev];
      next[nextEmptyIndex] = { type: "human", name };
      return next;
    });
    setInputValue("");
    setError("");
    inputRef.current?.focus();
  };

  const addBot = () => {
    if (nextEmptyIndex === -1) { setError("Mesa cheia!"); return; }
    setSeats(prev => {
      const next = [...prev];
      next[nextEmptyIndex] = { type: "bot" };
      return next;
    });
    setError("");
  };

  const removeSeat = (index: number) => {
    setSeats(prev => {
      const next = [...prev];
      next[index] = { type: "empty" };
      return next;
    });
    setError("");
  };

  const startEdit = (index: number) => {
    const s = seats[index];
    if (s.type !== "human") return;
    setEditingIndex(index);
    setEditValue(s.name);
  };

  const confirmEdit = () => {
    if (editingIndex === null) return;
    const name = editValue.trim().toUpperCase();
    if (!name) { setEditingIndex(null); return; }
    if (seats.some((s, i) => s.type === "human" && (s as any).name === name && i !== editingIndex)) {
      setError("Esse nome já está na mesa."); return;
    }
    setSeats(prev => {
      const next = [...prev];
      next[editingIndex] = { type: "human", name };
      return next;
    });
    setEditingIndex(null);
    setError("");
  };

  const handleStart = () => {
    // Envia APENAS os jogadores humanos — sem bots automáticos
    // O C agora lê o count na primeira linha e aceita N jogadores
    const humanNames = seats
      .filter(s => s.type === "human")
      .map(s => (s as { type: "human"; name: string }).name);
    onStartMatch(humanNames);
  };

  const canStart = humanCount >= MIN_HUMAN_PLAYERS;

  // Posições dos assentos ao redor da mesa (elipse)
  const seatAngles = Array.from({ length: MAX_PLAYERS }, (_, i) => {
    const angle = (i / MAX_PLAYERS) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle) * 410, y: Math.sin(angle) * 265 };
  });

  return (
    <div className="size-full bg-gradient-to-b from-black via-zinc-950 to-zinc-900 overflow-hidden flex flex-col items-center justify-center relative">
      {/* BG grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(6,182,212,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.2) 1px,transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-8 flex flex-col items-center gap-1"
      >
        <h2 className="text-4xl tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-black" style={{ fontFamily: 'Inter, sans-serif' }}>
          LOBBY
        </h2>
        <p className="text-xs tracking-[0.2em] text-zinc-500 font-mono">CONFIGURE OS JOGADORES À MESA</p>
        <div className="w-64 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </motion.div>

      {/* Mesa + assentos */}
      <div className="relative w-[900px] h-[570px] mt-10">

        {/* Brilho central */}
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-64 rounded-[200px] bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl"
        />

        {/* Superfície da mesa */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 rounded-[100px] bg-gradient-to-br from-emerald-950/20 via-emerald-900/10 to-emerald-950/20 border border-emerald-700/30 shadow-[inset_0_0_40px_rgba(6,78,59,0.2)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs font-mono text-emerald-500/60 tracking-widest">{humanCount} humano{humanCount !== 1 ? 's' : ''}</p>
            <p className="text-xs font-mono text-zinc-700 tracking-widest mt-0.5">{filledCount}/{MAX_PLAYERS} assentos</p>
          </div>
        </div>

        {/* Assentos */}
        {seatAngles.map(({ x, y }, index) => {
          const seat = seats[index];
          const Icon = avatarIcons[index % avatarIcons.length];
          const isEditing = editingIndex === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.07 * index, duration: 0.35, type: "spring" }}
              className="absolute"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                translateX: '-50%',
                translateY: '-50%',
              }}
            >
              <div className="flex flex-col items-center gap-1.5">
                {/* Label do assento */}
                <div className="text-[9px] tracking-widest font-mono"
                  style={{ color: seat.type === "human" ? "rgba(6,182,212,0.5)" : seat.type === "bot" ? "rgba(168,85,247,0.5)" : "rgba(82,82,82,0.4)" }}>
                  {seat.type === "bot" ? "BOT" : seat.type === "human" ? `ASSENTO ${index + 1}` : `VAGO`}
                </div>

                {/* Avatar */}
                <motion.div
                  whileHover={{ scale: seat.type !== "empty" ? 1.08 : 1.04 }}
                  onClick={() => seat.type === "human" && startEdit(index)}
                  className={`relative w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-300 
                    ${seat.type === "human"
                      ? "bg-gradient-to-br from-cyan-900/70 to-zinc-900 border-cyan-500/60 shadow-[0_0_18px_rgba(6,182,212,0.3)] cursor-pointer"
                      : seat.type === "bot"
                      ? "bg-gradient-to-br from-purple-950/60 to-zinc-900 border-purple-600/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                      : "bg-zinc-950/60 border-dashed border-zinc-700/30 opacity-40"
                    }`}
                >
                  {seat.type === "human" ? (
                    <Icon className="w-6 h-6 text-cyan-300" strokeWidth={1.5} />
                  ) : seat.type === "bot" ? (
                    <Bot className="w-6 h-6 text-purple-400/80" strokeWidth={1.5} />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-dashed border-zinc-700 flex items-center justify-center">
                      <span className="text-zinc-700 text-[10px]">?</span>
                    </div>
                  )}

                  {/* Pulse para humanos */}
                  {seat.type === "human" && (
                    <motion.div
                      animate={{ scale: [1, 1.7, 1], opacity: [0.35, 0, 0.35] }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.25 }}
                      className="absolute inset-0 rounded-full border border-cyan-400/40"
                    />
                  )}

                  {/* Botão remover */}
                  {seat.type !== "empty" && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.25 }}
                      onClick={e => { e.stopPropagation(); removeSeat(index); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-700 border border-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                    >
                      <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </motion.button>
                  )}
                </motion.div>

                {/* Nome / edição / label */}
                <AnimatePresence mode="wait">
                  {seat.type === "human" ? (
                    isEditing ? (
                      <motion.input
                        key="edit"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value.toUpperCase())}
                        onBlur={confirmEdit}
                        onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditingIndex(null); }}
                        maxLength={12}
                        className="w-28 px-2 py-1 bg-zinc-900 border-2 border-cyan-400 rounded text-center text-xs tracking-wider text-cyan-200 font-mono focus:outline-none"
                      />
                    ) : (
                      <motion.button
                        key="name"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => startEdit(index)}
                        className="w-28 px-2 py-1 bg-zinc-900/50 border border-cyan-500/30 rounded text-center text-xs tracking-wider text-cyan-300 font-mono hover:border-cyan-400/60 transition-all truncate"
                        title="Clique para editar"
                      >
                        {(seat as { type: "human"; name: string }).name}
                      </motion.button>
                    )
                  ) : seat.type === "bot" ? (
                    <motion.div
                      key="bot"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      className="w-28 px-2 py-1 border border-purple-700/30 bg-purple-950/20 rounded text-center text-xs tracking-wider text-purple-400 font-mono"
                    >
                      BOT
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.25 }}
                      className="w-28 px-2 py-1 border border-dashed border-zinc-700 rounded text-center text-xs tracking-wider text-zinc-600 font-mono"
                    >
                      VAZIO
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Painel inferior */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-6 flex flex-col items-center gap-3 w-full px-8"
      >
        {/* Input de jogador humano */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); setError(""); }}
              onKeyDown={e => { if (e.key === 'Enter') addHuman(); }}
              maxLength={12}
              placeholder="NOME DO JOGADOR..."
              disabled={nextEmptyIndex === -1}
              className="w-52 px-4 py-2.5 bg-zinc-900/70 border-2 border-cyan-500/30 rounded-lg text-center text-sm tracking-widest text-cyan-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-cyan-400/70 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* Botão adicionar humano */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={addHuman}
            disabled={nextEmptyIndex === -1 || !inputValue.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-700/70 border-2 border-cyan-400/50 rounded-lg text-cyan-100 font-mono text-xs tracking-wider hover:bg-cyan-600/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            JOGADOR
          </motion.button>

          {/* Separador */}
          <span className="text-zinc-700 font-mono text-xs">|</span>

          {/* Botão adicionar bot */}
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={addBot}
            disabled={nextEmptyIndex === -1}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-900/50 border-2 border-purple-600/40 rounded-lg text-purple-300 font-mono text-xs tracking-wider hover:bg-purple-800/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Bot className="w-3.5 h-3.5" />
            BOT
          </motion.button>
        </div>

        {/* Aviso: assentos vazios viram bots */}



        {/* Erro */}
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-xs font-mono text-red-400 tracking-wider">
              ⚠ {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Contagem + INICIAR */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-cyan-400" />
              <span className={humanCount >= MIN_HUMAN_PLAYERS ? 'text-cyan-400' : 'text-zinc-500'}>{humanCount}</span>
              <span className="text-zinc-600">humano{humanCount !== 1 ? 's' : ''}</span>
            </span>
            <span className="text-zinc-700">·</span>
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3 text-purple-400" />
              <span className="text-purple-400">{seats.filter(s => s.type === "bot").length}</span>
              <span className="text-zinc-600">bots</span>
            </span>
          </div>

          <motion.button
            whileHover={{ scale: canStart ? 1.05 : 1 }}
            whileTap={{ scale: canStart ? 0.95 : 1 }}
            onClick={handleStart}
            disabled={!canStart}
            className={`relative flex items-center gap-2 px-10 py-3.5 rounded-xl border-2 overflow-hidden font-mono tracking-widest font-black text-base transition-all duration-300
              ${canStart
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 border-emerald-400/60 text-white shadow-[0_0_35px_rgba(16,185,129,0.4)] hover:shadow-[0_0_55px_rgba(16,185,129,0.6)]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-600 cursor-not-allowed'
              }`}
          >
            {canStart && (
              <motion.div animate={{ x: ['-200%', '200%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
            )}
            <Play className="w-4 h-4 relative" />
            <span className="relative">INICIAR PARTIDA</span>
          </motion.button>
        </div>

        {!canStart && (
          <motion.p animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
            className="text-xs tracking-wider text-zinc-600 font-mono">
            /// ADICIONE AO MENOS {MIN_HUMAN_PLAYERS} JOGADORES HUMANOS ///
          </motion.p>
        )}
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-10 h-10 border-l-2 border-t-2 border-cyan-500/20" />
      <div className="absolute top-8 right-8 w-10 h-10 border-r-2 border-t-2 border-cyan-500/20" />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-l-2 border-b-2 border-cyan-500/20" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-r-2 border-b-2 border-cyan-500/20" />
    </div>
  );
}

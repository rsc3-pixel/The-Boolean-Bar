import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, AlertCircle, Eye, X, WifiOff, Skull } from "lucide-react";
import { DiceFace } from "../components/ui/DiceFace";
import { OpponentDiceCard } from "../components/ui/OpponentDiceCard";
import { useGameEngine } from "../hooks/useGameEngine";

interface DiceGameOnlineProps {
  onExit: () => void;
  engine: ReturnType<typeof useGameEngine>;
}

export function DiceGameOnline({ onExit, engine }: DiceGameOnlineProps) {
  const {
    diceState,
    diceBet,
    diceReveal,
    showDiceReveal,
    setShowDiceReveal,
    victoryState,
    sendInput,
    wsStatus,
    roomState,
    playerId,
  } = engine;

  // ─── Identidade do cliente ─────────────────────────────────────────────
  const myPlayer = roomState && playerId
    ? roomState.players.find(p => p.playerId === playerId) ?? null
    : null;
  const myName = myPlayer?.name ?? null;
  const mySlot = myPlayer?.slot ?? -1;
  const isMyTurn = diceState?.turn === mySlot;

  // ─── Estado da aposta (modal) ──────────────────────────────────────────
  const [showBetModal, setShowBetModal] = useState(false);
  const [betQty, setBetQty] = useState(1);
  const [betFace, setBetFace] = useState(2);

  // Pre-seleciona aposta mínima válida quando o modal abre
  useEffect(() => {
    if (showBetModal && diceState) {
      // Mínimo: subir a quantidade OU manter quantidade e subir face
      const curQ = diceState.currentBetQty;
      const curF = diceState.currentBetFace;
      if (curQ === 0) {
        setBetQty(1);
        setBetFace(2);
      } else if (curF < 6) {
        setBetQty(curQ);
        setBetFace(curF + 1);
      } else {
        setBetQty(curQ + 1);
        setBetFace(2);
      }
    }
  }, [showBetModal, diceState]);

  const handleApostar = () => setShowBetModal(true);
  const handleConfirmBet = () => {
    if (!isMyTurn) return;
    setShowBetModal(false);
    // Sequência que o engine espera: 'A', então qty, então face
    sendInput("A");
    setTimeout(() => sendInput(String(betQty)), 100);
    setTimeout(() => sendInput(String(betFace)), 200);
  };
  const handleDuvidar = () => {
    if (!isMyTurn || !diceState || diceState.currentBetQty === 0) return;
    if (window.confirm(`Duvidar da aposta atual (${diceState.currentBetQty}× face ${diceState.currentBetFace})?`)) {
      sendInput("D");
    }
  };
  const handlePedirContas = () => {
    if (!isMyTurn) return;
    if (window.confirm("Pedir as contas (sair da partida)? Você será eliminado.")) {
      sendInput("P");
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────
  if (!diceState) {
    return (
      <div className="size-full bg-black flex items-center justify-center text-emerald-400 font-mono">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-emerald-400 animate-pulse rounded-full" />
          {wsStatus === 'connected' ? "Aguardando engine de dados..." : "Conectando ao servidor..."}
        </div>
      </div>
    );
  }

  const opponents = diceState.players
    .map((p, i) => ({ ...p, slot: i }))
    .filter(p => p.slot !== mySlot);

  // Estou eliminado?
  const myInfo = diceState.players[mySlot];
  const iAmEliminated = !!myInfo && !myInfo.alive;
  const aliveCount = diceState.players.filter(p => p.alive).length;
  const expectedPlayer = diceState.players[diceState.turn];

  return (
    <div className="size-full bg-black overflow-hidden flex flex-col">
      {/* Header */}
      <header className="relative z-20 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-emerald-500/20 flex items-center justify-between px-6">
        <button
          onClick={() => {
            if (window.confirm("Sair da partida? A sala será encerrada pra todos.")) onExit();
          }}
          className="flex items-center gap-2 px-3 py-2 text-emerald-400 hover:text-emerald-200 font-mono text-xs uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Sair
        </button>

        <h1 className="text-2xl tracking-[0.3em] text-emerald-300 font-sans" style={{ fontWeight: 800 }}>
          🎲 LIAR'S DICE
        </h1>

        <div className="flex items-center gap-4 text-xs font-mono">
          {isMyTurn ? (
            <span className="text-emerald-400 animate-pulse">SUA VEZ</span>
          ) : (
            <span className="text-yellow-400">VEZ DE {expectedPlayer?.name?.toUpperCase() ?? "?"}</span>
          )}
          <span className="text-zinc-500">VIVOS: {aliveCount}/{diceState.totalPlayers}</span>
        </div>
      </header>

      {/* Banner de spectator */}
      {iAmEliminated && !victoryState && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-900/80 border-b border-red-500/40 backdrop-blur-sm py-2 text-center"
        >
          <span className="text-sm font-mono tracking-widest text-red-300/90">
            💀 VOCÊ FOI ELIMINADO — ASSISTINDO ({aliveCount} VIVOS)
          </span>
        </motion.div>
      )}

      {/* Área principal */}
      <div className="flex-1 relative flex flex-col items-center justify-between p-6 overflow-auto">
        {/* Oponentes — top */}
        <div className="flex flex-wrap justify-center gap-4 max-w-6xl">
          {opponents.map(o => (
            <OpponentDiceCard
              key={o.slot}
              name={o.name}
              diceRemaining={o.dice_count}
              isEliminated={!o.alive}
              isCurrentTurn={diceState.turn === o.slot}
            />
          ))}
        </div>

        {/* Mesa central — aposta atual */}
        <div className="flex flex-col items-center gap-3 my-6">
          <span className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-mono">Aposta na Mesa</span>
          {diceState.currentBetQty > 0 ? (
            <motion.div
              key={`${diceState.currentBetQty}-${diceState.currentBetFace}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-4 px-8 py-5 border-2 border-yellow-400/50 bg-yellow-950/30 rounded-2xl backdrop-blur-md"
            >
              <span className="text-5xl font-mono text-yellow-300" style={{ fontWeight: 800 }}>
                {diceState.currentBetQty}
              </span>
              <span className="text-yellow-200/70 font-mono">×</span>
              <DiceFace value={diceState.currentBetFace} size="lg" glowColor="emerald" />
              {diceBet?.caller && (
                <span className="text-xs text-yellow-400/60 font-mono ml-3 uppercase tracking-widest">
                  por {diceBet.caller}
                </span>
              )}
            </motion.div>
          ) : (
            <div className="px-8 py-5 border-2 border-dashed border-zinc-700 rounded-2xl">
              <span className="text-zinc-500 font-mono text-lg">A MESA ESTÁ ABERTA — APOSTE PRIMEIRO</span>
            </div>
          )}
          <span className="text-[10px] text-emerald-500/60 font-mono italic">Dica: o '1' é curinga (conta como qualquer face)</span>
        </div>

        {/* Mão própria + ações — bottom */}
        <div className="w-full max-w-3xl flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-3 p-5 bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl w-full">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs uppercase tracking-[0.3em] text-emerald-400 font-mono" style={{ fontWeight: 700 }}>
                Seus Dados ({myName ?? "Você"})
              </span>
              <span className="text-xs text-emerald-300/60 font-mono">
                {myInfo?.dice_count ?? 0} restantes
              </span>
            </div>
            <div className="flex gap-3 justify-center flex-wrap min-h-[100px] items-center">
              {iAmEliminated ? (
                <div className="flex items-center gap-3 text-red-400 font-mono">
                  <Skull className="w-8 h-8" />
                  <span className="text-lg">ELIMINADO</span>
                </div>
              ) : diceState.myDice.length > 0 ? (
                diceState.myDice.map((value, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, opacity: 0, rotate: -180 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <DiceFace value={value} size="xl" glowColor="emerald" />
                  </motion.div>
                ))
              ) : (
                <span className="text-zinc-600 font-mono text-sm">aguardando dados...</span>
              )}
            </div>
          </div>

          {/* Ações */}
          {!iAmEliminated && (
            <div className="grid grid-cols-3 gap-3 w-full">
              <button
                disabled={!isMyTurn}
                onClick={handleApostar}
                className="h-14 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-black font-sans uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                style={{ fontWeight: 700 }}
              >
                <span className="text-sm">📈 Apostar</span>
              </button>
              <button
                disabled={!isMyTurn || diceState.currentBetQty === 0}
                onClick={handleDuvidar}
                className="h-14 bg-red-700 hover:bg-red-600 disabled:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-sans uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                style={{ fontWeight: 700 }}
              >
                <Eye className="w-4 h-4" />
                Duvidar
              </button>
              <button
                disabled={!isMyTurn}
                onClick={handlePedirContas}
                className="h-14 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed border-2 border-zinc-700 rounded-xl text-zinc-300 font-mono text-xs uppercase tracking-widest transition-colors"
              >
                Pedir as Contas
              </button>
            </div>
          )}

          {!isMyTurn && !iAmEliminated && expectedPlayer && (
            <div className="flex items-center gap-2 text-yellow-400/80 font-mono text-xs">
              <AlertCircle className="w-4 h-4" />
              Aguardando {expectedPlayer.name} jogar...
              {!expectedPlayer.alive && <WifiOff className="w-3 h-3 text-red-400" />}
            </div>
          )}
        </div>
      </div>

      {/* Modal de aposta */}
      <AnimatePresence>
        {showBetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowBetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-950 border-2 border-cyan-500/40 rounded-2xl p-8 w-full max-w-md flex flex-col gap-5 shadow-[0_0_60px_rgba(6,182,212,0.3)]"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl tracking-[0.2em] text-cyan-300 font-sans uppercase" style={{ fontWeight: 700 }}>
                  Nova Aposta
                </h2>
                <button onClick={() => setShowBetModal(false)} className="text-zinc-500 hover:text-zinc-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-4 py-2 bg-zinc-900/50 rounded-md">
                <span>Aposta atual:</span>
                <span className="text-yellow-300">
                  {diceState.currentBetQty > 0 ? `${diceState.currentBetQty} × face ${diceState.currentBetFace}` : "abrindo a mesa"}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.3em] text-cyan-400/70 font-mono">Quantidade</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setBetQty(Math.max(1, betQty - 1))}
                    className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-cyan-400 text-xl"
                  >−</button>
                  <input
                    type="number"
                    value={betQty}
                    onChange={e => setBetQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 h-10 bg-black/60 border border-cyan-500/30 rounded-md text-center text-cyan-100 text-xl font-mono"
                  />
                  <button
                    onClick={() => setBetQty(betQty + 1)}
                    className="w-10 h-10 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded text-cyan-400 text-xl"
                  >+</button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-[0.3em] text-cyan-400/70 font-mono">Face do Dado (2-6)</span>
                <div className="flex gap-2 justify-center">
                  {[2, 3, 4, 5, 6].map(f => (
                    <button
                      key={f}
                      onClick={() => setBetFace(f)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        betFace === f
                          ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                          : "border-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <DiceFace value={f} size="sm" glowColor={betFace === f ? "emerald" : "zinc"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowBetModal(false)}
                  className="flex-1 h-11 border border-zinc-700 rounded-md text-zinc-400 font-mono text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmBet}
                  className="flex-[2] h-11 bg-cyan-500 hover:bg-cyan-400 rounded-md text-black font-sans uppercase tracking-widest"
                  style={{ fontWeight: 700 }}
                >
                  Confirmar Aposta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay de revelação */}
      <AnimatePresence>
        {showDiceReveal && diceReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 overflow-auto"
          >
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center mb-6">
              <h2 className="text-3xl text-yellow-300 font-sans tracking-[0.2em] uppercase" style={{ fontWeight: 800 }}>
                {diceReveal.doubter} duvidou!
              </h2>
              <p className="text-zinc-400 mt-2 font-mono text-sm">
                Aposta era {diceReveal.betQty}× face {diceReveal.betFace} — Total real: {diceReveal.totalReal}
              </p>
            </motion.div>

            {/* Dados de todos */}
            <div className="flex flex-wrap gap-4 justify-center max-w-5xl mb-6">
              {diceReveal.allDice.map((dice, slot) => {
                const playerName = diceState.players[slot]?.name ?? `?`;
                return (
                  <motion.div
                    key={slot}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: slot * 0.15 }}
                    className="flex flex-col items-center gap-2 p-3 bg-zinc-900/60 border border-zinc-700 rounded-xl"
                  >
                    <span className="text-xs font-mono text-zinc-300 uppercase tracking-widest">{playerName}</span>
                    <div className="flex gap-1">
                      {dice.length === 0
                        ? <span className="text-zinc-600 text-xs font-mono">(eliminado)</span>
                        : dice.map((v, i) => (
                            <DiceFace
                              key={i}
                              value={v}
                              size="md"
                              glowColor={v === diceReveal.betFace || v === 1 ? "emerald" : "zinc"}
                            />
                          ))
                      }
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Veredicto */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5 }}
              className={`px-8 py-4 rounded-2xl border-2 text-center ${
                diceReveal.betValid
                  ? "border-emerald-400/60 bg-emerald-950/40"
                  : "border-red-500/60 bg-red-950/40"
              }`}
            >
              <p className={`text-xl font-sans uppercase tracking-widest ${diceReveal.betValid ? "text-emerald-300" : "text-red-300"}`} style={{ fontWeight: 700 }}>
                {diceReveal.betValid ? "Aposta Válida" : "Faltou Dado!"}
              </p>
              <p className="text-zinc-300 mt-2 font-mono text-sm">
                <span className="text-yellow-300">{diceReveal.loser}</span> perde 1 dado
                {diceReveal.eliminated && " — ELIMINADO!"}
                {!diceReveal.eliminated && ` (restam ${diceReveal.loserDiceCount})`}
              </p>
            </motion.div>

            <button
              onClick={() => setShowDiceReveal(false)}
              className="mt-6 px-6 py-2 text-zinc-400 hover:text-zinc-200 font-mono text-xs uppercase tracking-widest"
            >
              Continuar →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vitória */}
      <AnimatePresence>
        {victoryState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 1 }}
              className="text-center"
            >
              <div className="text-7xl mb-4">🏆</div>
              <h2 className="text-4xl text-yellow-300 font-sans tracking-[0.2em] uppercase mb-2" style={{ fontWeight: 800 }}>
                {victoryState.winner === myName ? "Você Venceu!" : "Fim de Partida"}
              </h2>
              <p className="text-emerald-400 font-mono text-lg">
                Vencedor: {victoryState.winner}
              </p>
              <button
                onClick={onExit}
                className="mt-8 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-black font-sans uppercase tracking-widest"
                style={{ fontWeight: 700 }}
              >
                Voltar ao Menu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

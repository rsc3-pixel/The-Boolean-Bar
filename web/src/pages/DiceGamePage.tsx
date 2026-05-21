import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Dices, ArrowUpCircle, CheckCircle2, X, Skull, Trophy } from "lucide-react";
import { OpponentDiceCard } from "../components/ui/OpponentDiceCard";
import { DiceFace } from "../components/ui/DiceFace";
import { useDiceGame } from "../hooks/useDiceGame";
import { DiceRevealOverlay } from "../components/modals/DiceRevealOverlay";

interface DiceGamePageProps {
  playerConfigs: { name: string; isBot: boolean }[];
  onExit: () => void;
}

export function DiceGamePage({ playerConfigs, onExit }: DiceGamePageProps) {
  const [showRaiseBidModal, setShowRaiseBidModal] = useState(false);
  const [showLogSettings, setShowLogSettings] = useState(false);

  const {
    state,
    currentPlayer,
    isHumanTurn,
    humanPlayer,
    totalDiceInPlay,
    initGame,
    startRound,
    placeBid,
    challenge,
    callExact,
    applyRoundResult,
    triggerBotIfNeeded,
    isValidRaise
  } = useDiceGame();

  useEffect(() => {
    if (playerConfigs.length > 0) {
      initGame(playerConfigs);
    }
  }, [playerConfigs, initGame]);

  useEffect(() => {
    if (state.phase === "waiting" && state.players.length > 0) {
      startRound();
    } else if (state.phase === "bidding") {
      triggerBotIfNeeded();
    }
  }, [state.phase, state.players.length, startRound, triggerBotIfNeeded]);

  const [bidQuantity, setBidQuantity] = useState(1);
  const [bidFace, setBidFace] = useState(1);

  useEffect(() => {
    if (showRaiseBidModal) {
      if (state.currentBid) {
        setBidQuantity(state.currentBid.quantity + 1);
        setBidFace(state.currentBid.face);
      } else {
        setBidQuantity(1);
        setBidFace(1);
      }
    }
  }, [showRaiseBidModal, state.currentBid]);

  const handleConfirmBid = () => {
    if (!isValidRaise(bidQuantity, bidFace)) {
      alert("Aposta inválida! Deve aumentar a quantidade ou o valor da face com mesma quantidade.");
      return;
    }
    placeBid(bidQuantity, bidFace);
    setShowRaiseBidModal(false);
  };

  const opponents = state.players.filter(p => p.isBot || p.id !== humanPlayer?.id);

  // Status computation for human player
  const humanHasDice = humanPlayer && !humanPlayer.isEliminated;

  return (
    <div className="size-full bg-black overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 h-20 bg-zinc-950/80 backdrop-blur-xl border-b border-emerald-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex-none"
      >
        <div className="h-full max-w-7xl mx-auto px-8 flex items-center justify-between">
          <h1 className="text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}>
            THE BOOLEAN BAR <span className="text-sm tracking-widest text-emerald-400 font-mono">/ LIAR'S DICE</span>
          </h1>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                RODADA: <span className="text-emerald-400 text-sm">{state.roundNumber}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest text-zinc-400 font-mono flex items-center gap-2">
                DADOS EM JOGO: <span className="text-emerald-400 text-sm">{totalDiceInPlay}</span>
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Game Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col bg-black game-area-wrapper">
        <style>{`
          .game-area-wrapper { zoom: 1; }
          @media (max-height: 850px) { .game-area-wrapper { zoom: 0.85; } }
          @media (max-height: 750px) { .game-area-wrapper { zoom: 0.75; } }
          @media (max-height: 650px) { .game-area-wrapper { zoom: 0.65; } }
        `}</style>
        
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(52, 211, 153, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(52, 211, 153, 0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        </div>

        {/* Back to Menu */}
        <motion.button
          onClick={() => onExit()}
          className="absolute top-8 left-8 z-50 pointer-events-auto flex items-center gap-2 px-5 py-3 bg-zinc-950/50 backdrop-blur-md border-2 border-emerald-500/40 rounded-xl text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/60 transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-mono font-bold">VOLTAR</span>
        </motion.button>

        {/* Opponents Area */}
        <div className="relative mt-24 mb-4 z-10 w-full max-w-6xl mx-auto px-8 flex justify-center flex-wrap gap-8">
          {opponents.map((opponent) => (
            <OpponentDiceCard
              key={opponent.id}
              name={opponent.name}
              diceRemaining={opponent.diceCount}
              isEliminated={opponent.isEliminated}
              isCurrentTurn={state.currentTurnIndex === opponent.id}
            />
          ))}
        </div>

        {/* Central Table */}
        <div className="flex-1 flex items-center justify-center p-4 z-0 min-h-[250px]">
          {state.phase === "gameOver" ? (
             <div className="relative w-full max-w-[800px] aspect-[2/1] rounded-[100px] bg-emerald-950/60 border-4 border-emerald-500 shadow-[0_0_80px_rgba(52,211,153,0.3)] flex flex-col items-center justify-center gap-6">
               <Trophy className="w-16 h-16 text-emerald-400 animate-pulse" />
               <h2 className="text-4xl text-emerald-300 font-sans tracking-[0.2em] font-black">
                 {state.players.find(p => p.id === state.winnerId)?.name} VENCEU!
               </h2>
               <motion.button onClick={onExit} className="px-8 py-3 mt-4 bg-emerald-600 text-black font-mono font-bold tracking-wider rounded-xl hover:bg-emerald-500 transition-colors">
                 VOLTAR AO MENU
               </motion.button>
             </div>
          ) : (
            <div className="relative w-full max-w-[800px] aspect-[2/1] max-h-[350px] min-h-[200px] rounded-[100px] sm:rounded-[200px] bg-emerald-950/40 border-4 border-emerald-900/50 flex flex-col items-center justify-center gap-8 shadow-[0_0_50px_rgba(4,120,87,0.2)]">
              
              {/* Bot thinking indicator */}
              {!isHumanTurn && state.phase === "bidding" && (
                <div className="absolute -top-12 px-6 py-2 bg-purple-950/80 border border-purple-500/50 rounded-full text-purple-300 font-mono text-sm tracking-widest flex items-center gap-3 animate-pulse">
                  <span>{currentPlayer?.name} PENSANDO</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              {/* Status or Bid Info */}
              {state.phase === "rolling" ? (
                <h2 className="text-3xl text-emerald-400 font-mono tracking-widest animate-pulse">ROLANDO DADOS...</h2>
              ) : state.phase === "roundEnd" ? (
                <div className="flex flex-col items-center gap-6">
                  <h2 className="text-3xl text-amber-500 font-sans tracking-widest font-bold">FIM DA RODADA</h2>
                  <motion.button onClick={startRound} className="px-8 py-3 bg-emerald-600 text-black font-mono font-bold tracking-wider rounded-xl hover:bg-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                    PRÓXIMA RODADA
                  </motion.button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-6">
                    {state.currentBid ? (
                      <>
                        <span className="text-3xl text-emerald-400 font-mono tracking-widest drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">
                          BID: {state.currentBid.quantity} DADOS DE
                        </span>
                        <div className="bg-emerald-950/80 p-2 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)] border border-emerald-500/50">
                          <DiceFace value={state.currentBid.face} size="lg" glowColor="emerald" />
                        </div>
                      </>
                    ) : (
                      <span className="text-2xl text-emerald-500/60 font-mono tracking-widest">
                        A MESA ESTÁ ABERTA
                      </span>
                    )}
                  </div>

                  {/* Human Action Buttons */}
                  <AnimatePresence>
                    {isHumanTurn && state.phase === "bidding" && (
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex gap-6 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={challenge} disabled={!state.currentBid}
                          className="group flex flex-col items-center justify-center gap-2 px-8 py-4 w-40 bg-red-950/60 hover:bg-red-900/80 border-2 border-red-500/80 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] disabled:opacity-30 disabled:hover:scale-100"
                        >
                          <Skull className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                          <span className="text-red-400 font-mono font-bold tracking-wider">DUVIDAR</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={callExact} disabled={!state.currentBid}
                          className="group flex flex-col items-center justify-center gap-2 px-8 py-4 w-40 bg-zinc-900/60 hover:bg-zinc-800/80 border-2 border-zinc-500/80 rounded-xl transition-all shadow-[0_0_15px_rgba(161,161,170,0.3)] hover:shadow-[0_0_25px_rgba(161,161,170,0.5)] disabled:opacity-30 disabled:hover:scale-100"
                        >
                          <CheckCircle2 className="w-6 h-6 text-zinc-400 group-hover:scale-110 transition-transform" />
                          <span className="text-zinc-400 font-mono font-bold tracking-wider">EXATO</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setShowRaiseBidModal(true)}
                          className="group flex flex-col items-center justify-center gap-2 px-8 py-4 w-40 bg-emerald-950/60 hover:bg-emerald-900/80 border-2 border-emerald-500/80 rounded-xl transition-all shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:shadow-[0_0_25px_rgba(52,211,153,0.6)]"
                        >
                          <ArrowUpCircle className="w-6 h-6 text-emerald-400 group-hover:-translate-y-1 transition-transform" />
                          <span className="text-emerald-400 font-mono font-bold tracking-wider">RAISE</span>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          )}
        </div>

        {/* Human Player's dice hand */}
        <div className="relative w-full mt-auto z-20 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-4 pb-8 border-t border-emerald-500/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-8">
            <div className="text-center mb-6">
              <span className={`text-sm sm:text-base font-mono font-bold tracking-widest ${isHumanTurn ? 'text-emerald-400' : 'text-emerald-500/50'}`}>
                <Dices className="inline w-5 h-5 mr-2" />
                COPO DE {humanPlayer?.name || "OBSERVADOR"}
              </span>
              {humanHasDice && (
                <p className="animate-pulse text-zinc-600 font-mono text-[10px] tracking-widest mt-2 uppercase">
                  /// SUA ROLAGEM SECRETA ///
                </p>
              )}
            </div>
            
            <div className="flex justify-center flex-wrap gap-4 sm:gap-6 min-h-[80px]">
              {humanPlayer ? (
                humanPlayer.isEliminated ? (
                   <span className="text-zinc-500 font-mono text-xl tracking-widest items-center flex"> VOCÊ FOI ELIMINADO </span>
                ) : (
                  humanPlayer.dice.map((val, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: 50, opacity: 0 }}
                      animate={{
                        y: 0,
                        opacity: 1
                      }}
                      transition={{
                        delay: state.phase === "rolling" ? 0 : index * 0.1,
                        duration: 0.5,
                        type: 'spring'
                      }}
                      className={state.phase === "rolling" ? "animate-[spin_0.3s_linear_infinite]" : ""}
                    >
                      <DiceFace value={val} size="lg" glowColor="emerald" />
                    </motion.div>
                  ))
                )
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Raise Bid Modal */}
      <AnimatePresence>
        {showRaiseBidModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[500px] bg-gradient-to-br from-zinc-950/95 via-black to-zinc-950/95 border-2 border-emerald-500/30 rounded-2xl p-8 shadow-[0_0_60px_rgba(52,211,153,0.2)]"
            >
              <button
                onClick={() => setShowRaiseBidModal(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <ArrowUpCircle className="w-7 h-7 text-emerald-400" />
                <h2 className="text-2xl tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200 font-mono" style={{ fontWeight: 700 }}>
                  AUMENTAR APOSTA
                </h2>
              </div>

              <div className="mb-6">
                <span className="text-xs tracking-[0.3em] text-zinc-500 font-mono mb-3 block">QUANTIDADE DE DADOS:</span>
                <div className="flex items-center gap-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setBidQuantity(Math.max(1, bidQuantity - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-lg text-2xl text-zinc-300 font-mono hover:bg-zinc-800 transition-colors"
                  >
                    −
                  </motion.button>
                  <span className="text-5xl font-mono text-emerald-400 w-16 text-center" style={{ fontWeight: 700 }}>
                    {bidQuantity}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setBidQuantity(Math.min(totalDiceInPlay, bidQuantity + 1))}
                    className="w-12 h-12 flex items-center justify-center bg-zinc-900 border border-zinc-700 rounded-lg text-2xl text-zinc-300 font-mono hover:bg-zinc-800 transition-colors"
                  >
                    +
                  </motion.button>
                </div>
              </div>

              <div className="mb-8">
                <span className="text-xs tracking-[0.3em] text-zinc-500 font-mono mb-3 block">FACE DO DADO:</span>
                <div className="flex items-center justify-center gap-2 flex-wrap sm:flex-nowrap">
                  {[1, 2, 3, 4, 5, 6].map((face) => (
                    <motion.button
                      key={face}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setBidFace(face)}
                      className={`p-1.5 sm:p-2 flex-shrink-0 rounded-xl transition-all duration-200 ${
                        bidFace === face
                          ? 'bg-emerald-950/80 border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                          : 'bg-zinc-900/50 border-2 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <DiceFace value={face} size="md" glowColor={bidFace === face ? "emerald" : "zinc"} />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-6 p-4 bg-zinc-900/30 border border-emerald-500/10 rounded-lg">
                <span className="text-xs tracking-wider text-zinc-600 font-mono">NOVA APOSTA:</span>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-2xl text-emerald-400 font-mono font-bold">{bidQuantity}</span>
                  <span className="text-lg text-zinc-500 font-mono">dados de</span>
                  <div className="bg-zinc-900/50 p-1 rounded-lg border border-emerald-500/30">
                    <DiceFace value={bidFace} size="sm" glowColor="emerald" />
                  </div>
                </div>
                {!isValidRaise(bidQuantity, bidFace) && (
                   <div className="text-red-400 text-xs mt-2 font-mono">Aposta deve superar {state.currentBid?.quantity}x de {state.currentBid?.face}.</div>
                )}
              </div>

              <motion.button
                whileHover={isValidRaise(bidQuantity, bidFace) ? { scale: 1.02 } : {}}
                whileTap={isValidRaise(bidQuantity, bidFace) ? { scale: 0.98 } : {}}
                onClick={handleConfirmBid}
                disabled={!isValidRaise(bidQuantity, bidFace)}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-black font-mono font-bold text-xl tracking-wider rounded-xl border border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)] disabled:opacity-50 disabled:grayscale transition-all"
              >
                CONFIRMAR APOSTA
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Log Widget */}
      <div className="absolute top-[100px] right-8 z-30 w-[550px] max-h-[500px] overflow-y-auto bg-zinc-950/80 backdrop-blur-md border border-emerald-500/20 rounded-xl font-mono text-sm text-emerald-500/80 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-emerald-500/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500/40 shadow-[0_0_30px_rgba(4,120,87,0.1)] transition-colors">
        <div className="font-bold text-emerald-400 border-b border-emerald-500/20 px-6 py-4 sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10 flex justify-between items-center text-base">
          <span>HISTÓRICO DA RODADA</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="flex flex-col gap-3 p-6 pt-4">
          {state.actionLog.slice(-20).map((log, i) => (
            <div key={i} className="leading-relaxed border-l-2 border-emerald-500/30 pl-4 opacity-90 transition-all hover:opacity-100 hover:border-emerald-400">
              {log}
            </div>
          ))}
        </div>
      </div>

      <DiceRevealOverlay 
        isVisible={state.phase === "revealing"} 
        result={state.revealResult} 
        onContinue={applyRoundResult} 
      />
    </div>
  );
}

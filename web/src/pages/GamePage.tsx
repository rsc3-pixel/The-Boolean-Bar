import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Skull, Circle, Settings, ArrowLeft, Pause } from "lucide-react";
import { LogicCard } from "../components/ui/LogicCard";
import { OpponentCard } from "../components/ui/OpponentCard";
import { BluffModal } from "../components/modals/BluffModal";
import { DoubtCalledOverlay } from "../components/modals/DoubtCalledOverlay";
import { TruthTableProcessor } from "../components/modals/TruthTableProcessor";
import { RouletteScreen } from "../components/modals/RouletteScreen";
import { SurvivalReliefOverlay } from "../components/modals/SurvivalReliefOverlay";
import { PlayerEliminatedScreen } from "../components/screens/PlayerEliminatedScreen";
import { VictoryScreen } from "../components/screens/VictoryScreen";
import { SettingsInstructionsPanel } from "../components/modals/SettingsInstructionsPanel";
import { useGameEngine } from "../hooks/useGameEngine";

interface GamePageProps {
  playerNames: string[];
  onExit: () => void;
  engine: ReturnType<typeof useGameEngine>;
}

export function GamePage({ playerNames, onExit, engine }: GamePageProps) {
  const {
    showDoubtOverlay, setShowDoubtOverlay,
    showRoulette, setShowRoulette,
    showVictory, setShowVictory,
    gameState,
    doubtState,
    doubtResult,
    rouletteResult,
    victoryState,
    sendInput,
    wsStatus,
    // Phase 3: turn awareness
    roomState,
    playerId,
    // Phase 5: ranking
    eliminationOrder,
  } = engine;

  // ─── Phase 3: turn awareness ─────────────────────────────────────────────
  // Em modo solo (1 cliente controla todos), gate fica desabilitado e os controles aparecem sempre.
  const isMultiplayer = !!roomState && !roomState.isSoloMode;
  const myPlayerInRoom = roomState && playerId
    ? roomState.players.find(p => p.playerId === playerId)
    : null;
  const myName = myPlayerInRoom?.name ?? null;
  const mySlot = myPlayerInRoom?.slot ?? -1;

  // Quando NÃO é phase de dúvida → vez do jogador no slot gameState.turn
  // Quando É phase de dúvida → vez do caller (oponente sendo perguntado)
  const isMyTurn = !isMultiplayer || (gameState?.turn === mySlot);
  const isMyDoubt = !isMultiplayer || (doubtState?.caller === myName);

  // Nome de quem deve agir agora (pra mostrar "Aguardando X..." nos outros clientes)
  const expectedPlayerName = isMultiplayer && roomState
    ? (doubtState ? doubtState.caller : roomState.players[gameState?.turn ?? -1]?.name)
    : null;
  const expectedPlayerEntry = isMultiplayer && roomState && expectedPlayerName
    ? roomState.players.find(p => p.name === expectedPlayerName)
    : null;
  const expectedIsConnected = expectedPlayerEntry?.connected ?? true;

  // ─── Phase 5: end-game screens só pra quem é o protagonista ──────────────
  // Em multiplayer, só o jogador que perdeu a roleta vê PlayerEliminatedScreen,
  // e só o vencedor vê VictoryScreen. Solo mode mantém comportamento atual
  // (todas as telas pro único cliente).

  // Estou eliminado? Verifica direto no gameState.players (alive=false).
  const myInGame = isMultiplayer && myName && gameState
    ? gameState.players.find(p => p.name === myName)
    : null;
  const iAmEliminated = !!myInGame && !myInGame.alive;
  const aliveCount = gameState?.players.filter(p => p.alive).length ?? 0;

  // Ranking final: vencedor + reverse(eliminationOrder).
  // Ex: 4 players, ordem morte = ["D","C","B"], winner = "A"
  // → finalRanking = ["A", "B", "C", "D"]  (1º, 2º, 3º, 4º)
  const finalRanking = victoryState
    ? [victoryState.winner, ...[...eliminationOrder].reverse().filter(n => n !== victoryState.winner)]
    : [];
  const myRankPosition = myName ? finalRanking.indexOf(myName) + 1 : 0;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardFormula, setSelectedCardFormula] = useState("");
  const [showTruthTable, setShowTruthTable] = useState(false);
  const [showSurvivalRelief, setShowSurvivalRelief] = useState(false);
  const [showEliminated, setShowEliminated] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Guarda o resultado do confronto e da roleta para usar ao final das animações
  const [pendingDoubtResult, setPendingDoubtResult] = useState<typeof doubtResult>(null);
  const [pendingRouletteResult, setPendingRouletteResult] = useState<typeof rouletteResult>(null);

  // Persiste a última mão válida recebida do C para não sumir entre atualizações de state
  const lastHandRef = useRef<string[]>([]);
  if (gameState && gameState.currentHand && gameState.currentHand.length > 0) {
    lastHandRef.current = gameState.currentHand;
  }

  // Quando o C emite doubt_result, guardamos para usar após a animação da TruthTable
  useEffect(() => {
    if (doubtResult) {
      setPendingDoubtResult(doubtResult);
    }
  }, [doubtResult]);

  // Quando o C emite roulette_result, guardamos para usar após a animação da Roleta
  useEffect(() => {
    if (rouletteResult) {
      setPendingRouletteResult(rouletteResult);
    }
  }, [rouletteResult]);

  // Auto-close doubt overlay após 3 segundos → exibe TruthTable
  useEffect(() => {
    if (showDoubtOverlay) {
      const timer = setTimeout(() => {
        setShowDoubtOverlay(false);
        setShowTruthTable(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showDoubtOverlay]);

  // Handle: conclusão da TruthTable
  // O veredicto real vem do pendingDoubtResult (C já calculou)
  // A animação é apenas visual — o resultado já está disponível
  const handleTruthTableComplete = () => {
    setShowTruthTable(false);
    // O C já vai emitir roulette_result após roleta_russa()
    // Só precisamos destravar o "Pressione Enter para continuar" do C
    // Aguarda a roleta (já acionada pelo hook via doubt_result)
    sendInput("\n");
  };

  // Handle: conclusão da animação da Roleta
  // Usa o pendingRouletteResult real do C (não decide sozinho)
  const handleRouletteComplete = () => {
    setShowRoulette(false);
    if (!pendingRouletteResult) return;
    // Phase 5: em multiplayer, só o jogador que GIROU a roleta vê o resultado.
    if (isMultiplayer && pendingRouletteResult.player !== myName) return;
    if (pendingRouletteResult.survived) {
      setShowSurvivalRelief(true);
    } else if (!isMultiplayer) {
      // Solo mode: eliminado imediatamente (cliente único controla todos).
      setShowEliminated(true);
    }
    // Em multiplayer, se eu morri: o useEffect abaixo decide se mostro tela
    // de eliminação (game ends) ou banner de spectator (jogo continua).
  };

  // Phase 5: disparo da PlayerEliminatedScreen quando o JOGO ACABA com vitória
  // de outra pessoa. Eu vi o "morri" na roleta antes; agora vejo o ranking final.
  useEffect(() => {
    if (!victoryState || !isMultiplayer || !myName) return;
    if (victoryState.winner !== myName) {
      setShowEliminated(true);
    }
  }, [victoryState, isMultiplayer, myName]);

  // Estado derivado de gameState (sem mocks)
  const opponents = gameState
    ? gameState.players.slice(0, 6).map((p) => ({
        name: p.name,
        lives: p.lives,
        cardsInHand: p.cards,
        isEliminated: !p.alive
      }))
    : playerNames.slice(0, 6).map((name) => ({
        name,
        lives: 3,
        cardsInHand: 5,
        isEliminated: false
      }));

  // Usa a última mão válida do C — não some entre re-renders
  const playerHand = (gameState?.currentHand?.length ?? 0) > 0
    ? gameState!.currentHand
    : lastHandRef.current;
  const currentFormula = doubtState ? doubtState.card : "";
  const bulletsInCylinder = gameState ? gameState.bullets : (pendingRouletteResult?.bullets ?? 1);
  const cylinderCapacity = 6;
  const totalPlayers = gameState ? gameState.players.length : playerNames.length;
  const playersAlive = gameState
    ? gameState.players.filter(p => p.alive).length
    : opponents.filter(o => !o.isEliminated).length + 1;
  // Nome do jogador atual (quem está com a mão visível)
  const currentPlayerName = gameState
    ? (gameState.players[gameState.turn]?.name ?? playerNames[0] ?? "VOCÊ")
    : (playerNames[0] ?? "VOCÊ");

  // Dados da roleta vindos do C
  const roulettePlayerName = pendingDoubtResult?.loser ?? doubtState?.caller ?? "";
  const eliminatedPlayerCards = pendingRouletteResult
    ? gameState?.players.find(p => p.name === pendingRouletteResult.player)?.cards ?? 0
    : 0;
  const finalPosition = totalPlayers - playersAlive + 1;

  // Tipo declarado real para a TruthTable
  const claimedTypeLabel = doubtState
    ? (doubtState.bluff === 1 ? "TAUTOLOGIA" : doubtState.bluff === 2 ? "CONTRADIÇÃO" : "CONTINGÊNCIA")
    : "—";

  return (
    <div className="size-full bg-black overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-20 h-14 sm:h-20 bg-zinc-950/80 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="h-full max-w-7xl mx-auto px-3 sm:px-8 flex items-center justify-between">
          <h1 className="text-base sm:text-3xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-emerald-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900 }}>
            <span className="sm:hidden">BOOLEAN</span>
            <span className="hidden sm:inline">THE BOOLEAN BAR</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-8">
            {/* Status WebSocket */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
              <span className="hidden sm:inline text-xs font-mono tracking-wider" style={{ color: wsStatus === 'connected' ? '#34d399' : wsStatus === 'connecting' ? '#facc15' : '#ef4444' }}>
                {wsStatus === 'connected' ? 'C ENGINE ON' : wsStatus === 'connecting' ? 'CONECTANDO...' : 'OFFLINE'}
              </span>
            </div>
            {/* Indicador de turno (Phase 3) */}
            <div className="flex items-center gap-2">
              {!gameState ? (
                <span className="text-[10px] sm:text-xs font-mono text-zinc-600">AGUARDANDO...</span>
              ) : isMultiplayer ? (
                isMyTurn || isMyDoubt ? (
                  <span className="text-[10px] sm:text-xs font-mono text-emerald-400 animate-pulse">SUA VEZ</span>
                ) : (
                  <span className="text-[10px] sm:text-xs font-mono text-yellow-400 truncate max-w-[80px] sm:max-w-none">VEZ DE {expectedPlayerName?.toUpperCase() ?? '?'}</span>
                )
              ) : (
                <span className="text-[10px] sm:text-xs font-mono text-emerald-400">TURNO {gameState.turn}</span>
              )}
            </div>
            {/* Balas no cilindro — esconder no mobile (info redundante) */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs tracking-widest text-zinc-400 font-mono">BALAS:</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: cylinderCapacity }).map((_, i) => (
                  <Circle key={i} className={`w-3 h-3 ${i < bulletsInCylinder ? 'text-red-500 fill-red-500' : 'text-zinc-700 fill-zinc-700'}`} />
                ))}
              </div>
              <span className="text-sm font-mono text-red-400">{bulletsInCylinder}/{cylinderCapacity}</span>
            </div>
            {/* Jogadores vivos */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Skull className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              <span className="hidden sm:inline text-xs tracking-widest text-zinc-400 font-mono">VIVOS:</span>
              <span className="text-xs sm:text-sm font-mono text-emerald-400">{playersAlive}/{totalPlayers}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(true)}
              className="p-1.5 sm:p-2 bg-cyan-600/20 border border-cyan-500/30 rounded-lg hover:bg-cyan-600/40 hover:border-cyan-400/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Phase 5: banner de spectator quando estou eliminado mas o jogo continua */}
      {isMultiplayer && iAmEliminated && !victoryState && aliveCount > 1 && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 bg-zinc-900/80 border-b border-red-500/40 backdrop-blur-sm py-2 text-center"
        >
          <span className="text-sm font-mono tracking-widest text-red-300/90">
            💀 VOCÊ FOI ELIMINADO — ASSISTINDO O RESTO DA PARTIDA ({aliveCount} JOGADORES VIVOS)
          </span>
        </motion.div>
      )}

      {/* Banner de turno (Phase 3 — só multiplayer, só quando não é minha vez) */}
      {isMultiplayer && !iAmEliminated && gameState && !isMyTurn && !isMyDoubt && expectedPlayerName && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`relative z-10 backdrop-blur-sm py-2 text-center border-b ${
            expectedIsConnected
              ? 'bg-yellow-950/40 border-yellow-500/30'
              : 'bg-red-950/40 border-red-500/40'
          }`}
        >
          <span className={`text-sm font-mono tracking-widest ${expectedIsConnected ? 'text-yellow-300' : 'text-red-300'}`}>
            {expectedIsConnected
              ? <>⏳ AGUARDANDO <span style={{ fontWeight: 700 }}>{expectedPlayerName.toUpperCase()}</span> JOGAR...</>
              : <>📡 <span style={{ fontWeight: 700 }}>{expectedPlayerName.toUpperCase()}</span> DESCONECTOU — AGUARDANDO RECONEXÃO (60s)...</>
            }
          </span>
        </motion.div>
      )}

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
            onClick={() => {
              const msg = isMultiplayer
                ? "Sair da partida? A sala será encerrada pra todos os jogadores."
                : "Voltar ao menu?";
              if (window.confirm(msg)) onExit();
            }}
            className="absolute top-3 left-3 sm:top-8 sm:left-8 z-30 flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-3 bg-cyan-950/50 backdrop-blur-md border-2 border-cyan-500/40 rounded-xl text-cyan-300 hover:text-cyan-100 hover:bg-cyan-900/60 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-sm font-mono font-bold">BACK TO MENU</span>
          </motion.button>

          {/* Botão Pause */}
          <motion.button
            onClick={() => setIsPaused(!isPaused)}
            className="absolute top-3 right-3 sm:top-8 sm:right-8 z-30 p-2 sm:p-3 bg-zinc-950/60 backdrop-blur-md border-2 border-zinc-600/40 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-cyan-950/50 transition-all duration-300"
          >
            <Pause className="w-6 h-6" strokeWidth={2.5} />
          </motion.button>

          {/* Tela de pausa */}
          {isPaused && (
            <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-lg flex items-center justify-center">
              <div className="bg-zinc-950/90 border-2 border-cyan-500/30 rounded-2xl p-12 text-center text-cyan-400 font-mono">
                <h2>PAUSADO</h2>
                <div className="flex gap-4 mt-8">
                  <button onClick={() => setIsPaused(false)} className="px-8 py-4 bg-cyan-600 text-white rounded">CONTINUAR</button>
                  <button onClick={() => { setIsPaused(false); onExit(); }} className="px-8 py-4 bg-red-600 text-white rounded">SAIR</button>
                </div>
              </div>
            </div>
          )}

          {/* Oponentes */}
          <div className="relative mt-4 w-full z-10 max-w-6xl mx-auto px-2 sm:px-8 grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 justify-items-center">
            {opponents.map((opponent) => <OpponentCard key={opponent.name} {...opponent} />)}
          </div>

          {/* Mesa central — carta jogada + botões de dúvida */}
          <div className="flex-1 flex items-center justify-center p-4 z-0 min-h-[200px]">
            <div className="relative w-full max-w-[700px] aspect-[2/1] max-h-[300px] min-h-[160px] rounded-[100px] sm:rounded-[200px] bg-emerald-950/40 border-4 border-emerald-900/50 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {currentFormula ? (
                <LogicCard formula={currentFormula} isCenter />
              ) : (
                <div className="text-zinc-600 font-mono text-xl tracking-widest">
                  {wsStatus === 'connected' ? 'AGUARDANDO JOGADA...' : 'OFFLINE'}
                </div>
              )}

              {/* Declaração e ações (só aparecem quando há doubt_state) */}
              {doubtState && (
                <>
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-xs text-zinc-500">DECLARADO:</span>
                    <span className="text-2xl text-emerald-400">{claimedTypeLabel}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      disabled={!isMyDoubt}
                      onClick={() => {
                        if (!isMyDoubt) return;
                        sendInput("1"); // 1 = duvidar — overlay aparece via doubt_result
                      }}
                      className="px-10 py-4 bg-red-700 text-white rounded-lg border-2 border-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono tracking-wider"
                    >
                      🚨 DUVIDO
                    </button>
                    <button
                      disabled={!isMyDoubt}
                      onClick={() => {
                        if (!isMyDoubt) return;
                        sendInput("0"); // 0 = acreditar
                      }}
                      className="px-10 py-3 bg-zinc-800 text-zinc-300 rounded-lg border-2 border-zinc-700 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-mono tracking-wider"
                    >
                      ACREDITO
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mão do jogador (cartas + botão de jogar) */}
          <div className="relative w-full mt-auto z-20 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent pt-4 sm:pt-12 pb-2 sm:pb-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-8">
              {/* Label do jogador atual */}
              <div className="text-center mb-2">
                <span className="text-sm sm:text-base font-mono font-bold tracking-widest text-cyan-500/80">
                  {playerHand.length > 0 ? `🎴 MÃO DE ${currentPlayerName}` : ''}
                </span>
              </div>
              {playerHand.length > 0 ? (
                <div className={`flex justify-center items-end gap-1 sm:gap-3 scale-75 sm:scale-100 origin-bottom transition-opacity ${!isMyTurn && !doubtState ? 'opacity-40 pointer-events-none' : ''}`}>
                  {playerHand.map((formula, index) => (
                    <div key={formula + index} style={{ transformOrigin: 'bottom center', transform: `rotate(${(index - Math.floor(playerHand.length / 2)) * 3}deg)` }}>
                      <LogicCard
                        formula={formula}
                        onClick={() => {
                          if (!isMyTurn) return;
                          setSelectedCardFormula(formula);
                          setIsModalOpen(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-32 gap-2">
                  <div className="text-zinc-700 font-mono text-xs tracking-widest">
                    {wsStatus === 'connected' ? '/// AGUARDANDO ENGINE C ENVIAR ESTADO ///' : '/// CONECTANDO AO ENGINE ///'}
                  </div>
                  {wsStatus === 'connected' && (
                    <div className="text-zinc-600 font-mono text-[10px] tracking-wider animate-pulse">
                      Verifique o terminal do C Engine para input pendente
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === Modais e Overlays — todos com dados reais do C === */}

      {/* Modal de Blefe: jogador escolhe a carta e declara o tipo */}
      <BluffModal
        isOpen={isModalOpen && isMyTurn}
        selectedFormula={selectedCardFormula}
        onClose={() => setIsModalOpen(false)}
        onConfirm={(bluffType) => {
          setIsModalOpen(false);
          if (!isMyTurn) return;
          const cardIdx = (playerHand.indexOf(selectedCardFormula) + 1).toString();
          let blefeNum = "3"; // CONTINGÊNCIA
          if (bluffType === "TAUTOLOGIA") blefeNum = "1";
          if (bluffType === "CONTRADIÇÃO") blefeNum = "2";
          sendInput(cardIdx);
          setTimeout(() => sendInput(blefeNum), 200);
        }}
      />

      {/* Overlay: animação de "Dúvida chamada!" */}
      <DoubtCalledOverlay
        isVisible={showDoubtOverlay}
        callerName={doubtState?.caller ?? playerNames[6] ?? "JOGADOR"}
        targetName={doubtState?.target ?? opponents[0]?.name ?? "OPONENTE"}
        claimedBluff={claimedTypeLabel}
      />

      {/* Processador de Tabela-Verdade — animação visual, veredicto vem do C */}
      <TruthTableProcessor
        isVisible={showTruthTable}
        formula={currentFormula}
        claimedType={claimedTypeLabel}
        onComplete={handleTruthTableComplete}
      />

      {/* Roleta Russa — nome do perdedor vem do doubt_result real */}
      <RouletteScreen
        isVisible={showRoulette}
        playerName={roulettePlayerName}
        bulletsInCylinder={bulletsInCylinder}
        totalChambers={cylinderCapacity}
        actualResult={pendingRouletteResult ? { survived: pendingRouletteResult.survived } : null}
        onTriggerPull={() => {}}
        onComplete={handleRouletteComplete}
      />

      {/* Sobreviveu: dados reais — em multiplayer só pro próprio sobrevivente */}
      <SurvivalReliefOverlay
        isVisible={showSurvivalRelief && (!isMultiplayer || pendingRouletteResult?.player === myName)}
        playerName={pendingRouletteResult?.player ?? roulettePlayerName}
        livesRemaining={pendingRouletteResult?.lives ?? 2}
        newBulletCount={pendingRouletteResult?.bullets ?? bulletsInCylinder}
        totalChambers={cylinderCapacity}
        onContinue={() => setShowSurvivalRelief(false)}
      />

      {/* Eliminado: posição e cards do roulette_result — em multiplayer só pro próprio eliminado */}
      <PlayerEliminatedScreen
        isVisible={showEliminated && (!isMultiplayer || pendingRouletteResult?.player === myName || (isMultiplayer && iAmEliminated && !!victoryState))}
        playerName={isMultiplayer && myName ? myName : (pendingRouletteResult?.player ?? roulettePlayerName)}
        cardsBurned={eliminatedPlayerCards}
        finalPosition={isMultiplayer && myRankPosition > 0 ? myRankPosition : finalPosition}
        totalPlayers={isMultiplayer && roomState ? roomState.players.length : undefined}
        ranking={isMultiplayer && finalRanking.length > 0 ? finalRanking : undefined}
        onDismiss={() => setShowEliminated(false)}
      />

      {/* Vitória: vencedor real do C — em multiplayer só aparece pro vencedor */}
      <VictoryScreen
        isVisible={showVictory && (!isMultiplayer || victoryState?.winner === myName)}
        playerName={victoryState?.winner ?? playerNames[playerNames.length - 1] ?? "JOGADOR"}
        opponentsDefeated={victoryState ? victoryState.totalPlayers - 1 : totalPlayers - 1}
        triggersPulled={gameState?.bullets ?? 0}
        bluffsSuccessful={0}
        doubtsWon={0}
        ranking={isMultiplayer && finalRanking.length > 0 ? finalRanking : undefined}
        onLeaveBar={() => { setShowVictory(false); onExit(); }}
      />

      <SettingsInstructionsPanel isVisible={showSettings} onBack={() => setShowSettings(false)} />
    </div>
  );
}

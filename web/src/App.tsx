import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { MainMenu } from "./pages/MainMenu";
import { Lobby } from "./pages/Lobby";
import { MatchLobby } from "./pages/MatchLobby";
import { GamePage } from "./pages/GamePage";
import { DiceGamePage } from "./pages/DiceGamePage";
import { DiceGameOnline } from "./pages/DiceGameOnline";
import { DiceLobby } from "./pages/DiceLobby";
import { OnlineLobby, type GameModeKind } from "./pages/OnlineLobby";
import { WaitingRoom } from "./pages/WaitingRoom";
import { SettingsInstructionsPanel } from "./components/modals/SettingsInstructionsPanel";
import { useGameEngine } from "./hooks/useGameEngine";
import { audioCues } from "./utils/audioCues";

type GameScreen = "menu" | "lobby" | "matchLobby" | "game" | "diceLobby" | "diceGame" | "onlineLobby" | "waitingRoom";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("menu");
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [dicePlayers, setDicePlayers] = useState<{name: string, isBot: boolean}[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [gameMode, setGameMode] = useState<GameModeKind>("logic");
  // Música de fundo (loop). Estado persistido em localStorage.
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("booleanbar_music") !== "off"; }
    catch { return true; }
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Instância unificada do Motor de Jogo (Mantém conexão persistente)
  const gameEngine = useGameEngine();

  // ─── Música de fundo ─────────────────────────────────────────────────────
  // Mobile (especialmente iOS Safari) bloqueia autoplay agressivamente.
  // Estratégia: tenta no mount (provavelmente falha), e fica em loop tentando
  // a cada interação do usuário até `play()` resolver com sucesso. Aí sim
  // remove os listeners.
  useEffect(() => {
    const audio = new Audio("/audio/casino-ambience.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";
    // playsInline ajuda no iOS — evita comportamento de fullscreen
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    audioRef.current = audio;

    let removed = false;
    const onInteract = () => {
      if (removed) return;
      const enabled = localStorage.getItem("booleanbar_music") !== "off";
      if (!enabled) return;
      audio.play().then(() => {
        // Sucesso! Remove os listeners.
        removed = true;
        window.removeEventListener("click", onInteract);
        window.removeEventListener("keydown", onInteract);
        window.removeEventListener("touchstart", onInteract);
        window.removeEventListener("pointerdown", onInteract);
        // Aproveita a gesture pra resumir AudioContext dos efeitos sonoros
        audioCues.resume();
      }).catch(() => {
        // Falhou (talvez ainda não houve gesture). Tenta de novo na próxima.
      });
    };

    // Primeira tentativa (pode falhar silencioso)
    onInteract();
    // Listeners ficam ativos até play() resolver
    window.addEventListener("click", onInteract);
    window.addEventListener("keydown", onInteract);
    window.addEventListener("touchstart", onInteract, { passive: true });
    window.addEventListener("pointerdown", onInteract);

    return () => {
      removed = true;
      audio.pause();
      audio.src = "";
      audioRef.current = null;
      window.removeEventListener("click", onInteract);
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("pointerdown", onInteract);
    };
  }, []);

  // Aplica mudança de toggle
  useEffect(() => {
    try { localStorage.setItem("booleanbar_music", musicEnabled ? "on" : "off"); } catch {}
    audioCues.setEnabled(musicEnabled);   // toggle controla música + efeitos
    if (!audioRef.current) return;
    if (musicEnabled) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [musicEnabled]);

  // ─── Multiplayer screen transitions (Phase 2 + Phase 4 reconnect) ────────
  // Ao entrar em uma sala (create/join/reconnect), navega pra tela certa.
  // Se gameStarted=true (reconnect mid-game), pula direto pro "game".
  useEffect(() => {
    if (!gameEngine.roomState) return;
    const inWaitingFlow = currentScreen === "menu" || currentScreen === "onlineLobby";
    if (inWaitingFlow) {
      if (gameEngine.roomState.gameStarted) {
        setPlayerNames(gameEngine.roomState.players.map(p => p.name));
        setCurrentScreen("game");
      } else {
        setCurrentScreen("waitingRoom");
      }
    }
  }, [gameEngine.roomState, currentScreen]);

  // Quando o host inicia o jogo (broadcast game_starting), todos vão pro game.
  useEffect(() => {
    if (gameEngine.gameStarting && currentScreen === "waitingRoom" && gameEngine.roomState) {
      setPlayerNames(gameEngine.roomState.players.map(p => p.name));
      setCurrentScreen("game");
    }
  }, [gameEngine.gameStarting, gameEngine.roomState, currentScreen]);

  // Sala foi fechada → volta pro lobby online com mensagem de erro.
  useEffect(() => {
    if (!gameEngine.roomState && (currentScreen === "waitingRoom" || currentScreen === "game")) {
      // Só faz fallback se estávamos numa sala multiplayer
      if (gameEngine.roomError?.code === "room_closed") {
        setCurrentScreen("onlineLobby");
      }
    }
  }, [gameEngine.roomState, gameEngine.roomError, currentScreen]);

  // Conteúdo da tela atual (resolvido no switch abaixo)
  let screenContent: ReactNode = null;

  if (currentScreen === "menu") {
    screenContent = (
      <MainMenu
        onEnterOnline={() => setCurrentScreen("onlineLobby")}
        onOpenRules={() => setShowSettings(true)}
        onFlee={() => gameEngine.sendShutdown()}
      />
    );
  } else if (currentScreen === "onlineLobby") {
    screenContent = (
      <OnlineLobby
        wsStatus={gameEngine.wsStatus}
        errorMessage={gameEngine.roomError?.message ?? null}
        gameMode={gameMode}
        onGameModeChange={setGameMode}
        onCreateRoom={(name) => gameEngine.createRoom(name, gameMode)}
        onJoinRoom={(roomId, name) => gameEngine.joinRoom(roomId, name)}
        onBack={() => setCurrentScreen("menu")}
        onClearError={() => gameEngine.clearRoomError()}
      />
    );
  } else if (currentScreen === "waitingRoom" && gameEngine.roomState && gameEngine.playerId) {
    screenContent = (
      <WaitingRoom
        room={gameEngine.roomState}
        myPlayerId={gameEngine.playerId}
        errorMessage={gameEngine.roomError?.message ?? null}
        onAddBot={() => gameEngine.addBot()}
        onRemoveBot={(botId) => gameEngine.removeBot(botId)}
        onStart={() => gameEngine.startRoomGame()}
        onLeave={() => {
          gameEngine.leaveRoom();
          setCurrentScreen("menu");
        }}
        onClearError={() => gameEngine.clearRoomError()}
      />
    );
  } else if (currentScreen === "lobby") {
    screenContent = (
      <Lobby
        onStartMatch={(names) => {
          setPlayerNames(names);
          setCurrentScreen("game");
          gameEngine.startGame(names);
        }}
      />
    );
  } else if (currentScreen === "matchLobby") {
    screenContent = (
      <MatchLobby
        onBackToMenu={() => setCurrentScreen("menu")}
        onStartMatch={(players) => {
          const names = players.map(p => p.name);
          setPlayerNames(names);
          setCurrentScreen("game");
          gameEngine.startGame(names);
        }}
      />
    );
  } else if (currentScreen === "game") {
    const exitHandler = () => {
      if (gameEngine.roomState && !gameEngine.roomState.isSoloMode) {
        gameEngine.leaveRoom();
      }
      setCurrentScreen("menu");
    };
    if (gameEngine.roomState?.gameMode === "dice") {
      screenContent = <DiceGameOnline onExit={exitHandler} engine={gameEngine} />;
    } else {
      screenContent = (
        <GamePage
          playerNames={playerNames}
          onExit={exitHandler}
          engine={gameEngine}
        />
      );
    }
  } else if (currentScreen === "diceLobby") {
    screenContent = (
      <DiceLobby
        onStartMatch={(players) => {
          setDicePlayers(players);
          setCurrentScreen("diceGame");
        }}
        onBack={() => setCurrentScreen("menu")}
      />
    );
  } else if (currentScreen === "diceGame") {
    screenContent = (
      <DiceGamePage
        playerConfigs={dicePlayers}
        onExit={() => setCurrentScreen("menu")}
      />
    );
  }

  // Phase 7: crossfade entre telas. mode="wait" garante que a tela velha
  // sai 100% antes da nova entrar (sem layout overlap). Cada tela é keyed
  // pelo `currentScreen` então AnimatePresence detecta transição.
  // Edge case: dentro da screen "game", o conteúdo pode trocar entre
  // GamePage (logic) e DiceGameOnline (dice) sem mudar a key — não anima
  // de novo, o que é o comportamento correto (mesma tela lógica).

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="size-full"
        >
          {screenContent}
        </motion.div>
      </AnimatePresence>

      {/* Settings modal — disponível em qualquer tela quando aberto */}
      <SettingsInstructionsPanel
        isVisible={showSettings}
        onBack={() => setShowSettings(false)}
        musicEnabled={musicEnabled}
        onMusicToggle={setMusicEnabled}
      />

      {/* Botão flutuante de áudio — canto inferior esquerdo, sempre visível */}
      <button
        onClick={() => setMusicEnabled(!musicEnabled)}
        title={musicEnabled ? "Desligar som" : "Ligar som"}
        aria-label={musicEnabled ? "Desligar som" : "Ligar som"}
        className={`fixed bottom-4 left-4 z-[200] w-12 h-12 sm:w-14 sm:h-14 rounded-full backdrop-blur-md border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
          musicEnabled
            ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/30 hover:scale-110 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            : "bg-zinc-900/80 border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:scale-110"
        }`}
      >
        {musicEnabled ? <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />}
      </button>
    </>
  );
}
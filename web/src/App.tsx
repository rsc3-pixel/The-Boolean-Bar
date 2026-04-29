import { useState, useEffect, useRef } from "react";
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
    audio.volume = 0.25;
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

  if (currentScreen === "menu") {
    return (
      <>
        <MainMenu
          onEnterOnline={() => setCurrentScreen("onlineLobby")}
          onOpenRules={() => setShowSettings(true)}
          onFlee={() => gameEngine.sendShutdown()}
        />
        <SettingsInstructionsPanel
          isVisible={showSettings}
          onBack={() => setShowSettings(false)}
          musicEnabled={musicEnabled}
          onMusicToggle={setMusicEnabled}
        />
      </>
    );
  }

  if (currentScreen === "onlineLobby") {
    return (
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
  }

  if (currentScreen === "waitingRoom" && gameEngine.roomState && gameEngine.playerId) {
    return (
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
  }

  if (currentScreen === "lobby") {
    return (
      <Lobby 
        onStartMatch={(names) => { 
          setPlayerNames(names); 
          setCurrentScreen("game"); 
          gameEngine.startGame(names); 
        }} 
      />
    );
  }

  if (currentScreen === "matchLobby") {
    return (
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
  }

  if (currentScreen === "game") {
    const exitHandler = () => {
      if (gameEngine.roomState && !gameEngine.roomState.isSoloMode) {
        gameEngine.leaveRoom();
      }
      setCurrentScreen("menu");
    };

    // Routing por gameMode: dice → DiceGameOnline; default → GamePage (logic)
    if (gameEngine.roomState?.gameMode === "dice") {
      return <DiceGameOnline onExit={exitHandler} engine={gameEngine} />;
    }
    return (
      <GamePage
         playerNames={playerNames}
         onExit={exitHandler}
         engine={gameEngine}
      />
    );
  }

  if (currentScreen === "diceLobby") {
    return (
      <DiceLobby 
        onStartMatch={(players) => {
          setDicePlayers(players);
          setCurrentScreen("diceGame");
        }}
        onBack={() => setCurrentScreen("menu")}
      />
    );
  }

  if (currentScreen === "diceGame") {
    return (
      <DiceGamePage 
         playerConfigs={dicePlayers} 
         onExit={() => setCurrentScreen("menu")} 
      />
    );
  }

  return null;
}
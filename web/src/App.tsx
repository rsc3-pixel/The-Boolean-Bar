import { useState, useEffect } from "react";
import { MainMenu } from "./pages/MainMenu";
import { Lobby } from "./pages/Lobby";
import { MatchLobby } from "./pages/MatchLobby";
import { GamePage } from "./pages/GamePage";
import { DiceGamePage } from "./pages/DiceGamePage";
import { DiceLobby } from "./pages/DiceLobby";
import { OnlineLobby } from "./pages/OnlineLobby";
import { WaitingRoom } from "./pages/WaitingRoom";
import { SettingsInstructionsPanel } from "./components/modals/SettingsInstructionsPanel";
import { useGameEngine } from "./hooks/useGameEngine";

type GameScreen = "menu" | "lobby" | "matchLobby" | "game" | "diceLobby" | "diceGame" | "onlineLobby" | "waitingRoom";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("menu");
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [dicePlayers, setDicePlayers] = useState<{name: string, isBot: boolean}[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Instância unificada do Motor de Jogo (Mantém conexão persistente)
  const gameEngine = useGameEngine();

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
          onEnter={() => setCurrentScreen("lobby")}
          onEnterDice={() => setCurrentScreen("diceLobby")}
          onEnterOnline={() => setCurrentScreen("onlineLobby")}
          onOpenRules={() => setShowSettings(true)}
          onFlee={() => gameEngine.sendShutdown()}
        />
        <SettingsInstructionsPanel isVisible={showSettings} onBack={() => setShowSettings(false)} />
      </>
    );
  }

  if (currentScreen === "onlineLobby") {
    return (
      <OnlineLobby
        wsStatus={gameEngine.wsStatus}
        errorMessage={gameEngine.roomError?.message ?? null}
        onCreateRoom={(name) => gameEngine.createRoom(name)}
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
    return (
      <GamePage 
         playerNames={playerNames} 
         onExit={() => setCurrentScreen("menu")} 
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
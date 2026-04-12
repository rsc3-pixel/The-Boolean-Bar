import { useState } from "react";
import { MainMenu } from "./pages/MainMenu";
import { Lobby } from "./pages/Lobby";
import { MatchLobby } from "./pages/MatchLobby";
import { GamePage } from "./pages/GamePage";
import { SettingsInstructionsPanel } from "./components/modals/SettingsInstructionsPanel";
import { useGameEngine } from "./hooks/useGameEngine";

type GameScreen = "menu" | "lobby" | "matchLobby" | "game";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("menu");
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Instância unificada do Motor de Jogo (Mantém conexão persistente)
  const gameEngine = useGameEngine();

  if (currentScreen === "menu") {
    return (
      <>
        <MainMenu
          onEnter={() => setCurrentScreen("lobby")}
          onOpenRules={() => setShowSettings(true)}
          onFlee={() => gameEngine.sendShutdown()}
        />
        <SettingsInstructionsPanel isVisible={showSettings} onBack={() => setShowSettings(false)} />
      </>
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

  return null;
}
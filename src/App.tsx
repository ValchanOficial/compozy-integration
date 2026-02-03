import "./App.css";
import { GameCanvas } from "@/components/GameCanvas";
import { GameHUD } from "@/components/GameHUD";
import { MainMenu } from "@/components/MainMenu";
import { useGameStore } from "@/stores/gameStore";

function App() {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const setGameStatus = useGameStore((state) => state.setGameStatus);

  const handleStartGame = (): void => {
    setGameStatus("playing");
  };

  const isInMenu = gameStatus === "menu";

  return (
    <div className="app">
      <header className="app-header">
        <h1>Snake Game</h1>
        <p>A modern Snake game built with React and Phaser</p>
      </header>
      <main className="app-main">
        {isInMenu ? (
          <MainMenu onStartGame={handleStartGame} />
        ) : (
          <div className="game-area">
            <GameHUD />
            <GameCanvas containerId="game-container" />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

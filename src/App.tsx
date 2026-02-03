import { useState, useCallback, useEffect } from "react";
import "./App.css";
import { GameCanvas } from "@/components/GameCanvas";
import { GameHUD } from "@/components/GameHUD";
import { MainMenu } from "@/components/MainMenu";
import { Leaderboard } from "@/components/Leaderboard";
import { useGameStore } from "@/stores/gameStore";
import { getUser } from "@/services/supabase";

function App() {
  const gameStatus = useGameStore((state) => state.gameStatus);
  const setGameStatus = useGameStore((state) => state.setGameStatus);
  const resetGame = useGameStore((state) => state.resetGame);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    undefined
  );

  // Fetch current user ID for highlighting in leaderboard
  useEffect(() => {
    const fetchUserId = async (): Promise<void> => {
      const { user } = await getUser();
      setCurrentUserId(user?.id);
    };
    fetchUserId();
  }, []);

  const handleStartGame = useCallback((): void => {
    setShowLeaderboard(false);
    setGameStatus("playing");
  }, [setGameStatus]);

  const handleViewLeaderboard = useCallback((): void => {
    setShowLeaderboard(true);
  }, []);

  const handleReturnToMenu = useCallback((): void => {
    setShowLeaderboard(false);
    resetGame();
    setGameStatus("menu");
  }, [resetGame, setGameStatus]);

  const isInMenu = gameStatus === "menu";
  const isGameOver = gameStatus === "gameover";
  const isPlaying = gameStatus === "playing" || gameStatus === "paused";

  return (
    <div className="app">
      <header className="app-header">
        <h1>Snake Game</h1>
        <p>A modern Snake game built with React and Phaser</p>
      </header>
      <main className="app-main">
        {showLeaderboard || isGameOver ? (
          <Leaderboard
            onReturnToMenu={handleReturnToMenu}
            currentUserId={currentUserId}
          />
        ) : isInMenu ? (
          <MainMenu
            onStartGame={handleStartGame}
            onViewLeaderboard={handleViewLeaderboard}
          />
        ) : isPlaying ? (
          <div className="game-area">
            <GameHUD />
            <GameCanvas containerId="game-container" />
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;

import { useGameStore } from "@/stores/gameStore";
import { Difficulty } from "@/types";
import "./GameHUD.css";

/**
 * Maps difficulty values to display labels.
 */
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Normal",
  hard: "Hard",
};

/**
 * GameHUD component that displays game information during active gameplay.
 * Shows current score, high score, difficulty level, and game status.
 */
export function GameHUD(): JSX.Element {
  const score = useGameStore((state) => state.score);
  const highScore = useGameStore((state) => state.highScore);
  const difficulty = useGameStore((state) => state.difficulty);
  const gameStatus = useGameStore((state) => state.gameStatus);

  const difficultyLabel = DIFFICULTY_LABELS[difficulty];
  const isPaused = gameStatus === "paused";
  const isGameOver = gameStatus === "gameover";

  return (
    <div className="game-hud" data-testid="game-hud">
      <div className="hud-left">
        <div className="hud-item" data-testid="score-display">
          <span className="hud-label">Score:</span>
          <span className="hud-value">{score}</span>
        </div>
        <div className="hud-item" data-testid="high-score-display">
          <span className="hud-label">High:</span>
          <span className="hud-value">{highScore}</span>
        </div>
      </div>

      <div className="hud-center">
        {isPaused && (
          <div className="game-status paused" data-testid="paused-indicator">
            PAUSED
          </div>
        )}
        {isGameOver && (
          <div
            className="game-status gameover"
            data-testid="gameover-indicator"
          >
            GAME OVER
          </div>
        )}
      </div>

      <div className="hud-right">
        <div
          className={`difficulty-indicator difficulty-${difficulty}`}
          data-testid="difficulty-indicator"
        >
          <span className="hud-label">Difficulty:</span>
          <span className="hud-value">{difficultyLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default GameHUD;

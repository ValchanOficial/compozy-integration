import { useGameStore } from "@/stores/gameStore";
import { Difficulty } from "@/types";
import { AudioControls } from "./AudioControls";
import { useResponsive } from "@/hooks/useResponsive";
import "./MainMenu.css";

/**
 * Props for the MainMenu component.
 */
export interface MainMenuProps {
  /** Callback function when the user starts the game */
  onStartGame: () => void;
  /** Optional callback function when the user views the leaderboard */
  onViewLeaderboard?: () => void;
}

/**
 * Difficulty level configuration with display labels and descriptions.
 */
interface DifficultyOption {
  value: Difficulty;
  label: string;
  description: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: "easy", label: "Easy", description: "150ms - Relaxed pace" },
  { value: "medium", label: "Normal", description: "100ms - Balanced" },
  { value: "hard", label: "Hard", description: "60ms - Fast & challenging" },
];

/**
 * MainMenu component that displays difficulty selection and start game button.
 * Allows players to select a difficulty level before starting the game.
 */
export function MainMenu({
  onStartGame,
  onViewLeaderboard,
}: MainMenuProps): JSX.Element {
  const difficulty = useGameStore((state) => state.difficulty);
  const setDifficulty = useGameStore((state) => state.setDifficulty);
  const { isMobile, isTablet } = useResponsive();

  /**
   * Handle difficulty selection.
   */
  const handleDifficultySelect = (newDifficulty: Difficulty): void => {
    setDifficulty(newDifficulty);
  };

  /**
   * Handle start game button click.
   */
  const handleStartGame = (): void => {
    onStartGame();
  };

  return (
    <div className="main-menu" data-testid="main-menu">
      <h2 className="main-menu-title">Select Difficulty</h2>

      <div className="difficulty-selector" data-testid="difficulty-selector">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`difficulty-button ${difficulty === option.value ? "selected" : ""}`}
            onClick={() => handleDifficultySelect(option.value)}
            data-testid={`difficulty-${option.value}`}
            aria-pressed={difficulty === option.value}
          >
            <span className="difficulty-label">{option.label}</span>
            <span className="difficulty-description">{option.description}</span>
          </button>
        ))}
      </div>

      <button
        className="start-button"
        onClick={handleStartGame}
        data-testid="start-game-button"
      >
        Start Game
      </button>

      {onViewLeaderboard && (
        <button
          className="leaderboard-button"
          onClick={onViewLeaderboard}
          data-testid="view-leaderboard-button"
        >
          View Leaderboard
        </button>
      )}

      <div className="controls-info">
        <p className="controls-info--keyboard">
          <strong>Controls:</strong> Arrow keys or WASD to move
        </p>
        <p className="controls-info--touch">
          <strong>Controls:</strong> Swipe to move
        </p>
        <p>
          <strong>Pause:</strong> ESC or P
        </p>
      </div>

      <AudioControls
        compact={isMobile || isTablet}
        className="main-menu-audio-controls"
      />
    </div>
  );
}

export default MainMenu;

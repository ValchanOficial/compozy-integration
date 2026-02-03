import { useState, useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import type { Difficulty, LeaderboardEntry } from "@/types";
import { getUser } from "@/services/supabase";
import "./Leaderboard.css";

/**
 * Props for the Leaderboard component.
 */
export interface LeaderboardProps {
  /** Callback when user clicks to return to menu */
  onReturnToMenu?: () => void;
  /** Optional current user ID for highlighting */
  currentUserId?: string;
}

/**
 * Difficulty filter option configuration.
 */
interface FilterOption {
  value: Difficulty | null;
  label: string;
}

/**
 * Available filter options for the leaderboard.
 */
const FILTER_OPTIONS: FilterOption[] = [
  { value: null, label: "All" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Normal" },
  { value: "hard", label: "Hard" },
];

/**
 * Maps difficulty values to display labels.
 */
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Normal",
  hard: "Hard",
};

/**
 * Formats a date string for display.
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Leaderboard component displays global high scores with filtering by difficulty,
 * player rank highlighting, and score submission capabilities.
 */
export function Leaderboard({
  onReturnToMenu,
  currentUserId,
}: LeaderboardProps): JSX.Element {
  const score = useGameStore((state) => state.score);
  const difficulty = useGameStore((state) => state.difficulty);
  const gameStatus = useGameStore((state) => state.gameStatus);

  const [
    { entries, isLoading, error, selectedDifficulty },
    { setDifficulty, submitNewScore },
  ] = useLeaderboard({
    initialDifficulty: null,
    enablePolling: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [nickname, setNickname] = useState("");

  /**
   * Handles difficulty filter selection.
   */
  const handleFilterChange = useCallback(
    (filterValue: Difficulty | null): void => {
      setDifficulty(filterValue);
    },
    [setDifficulty]
  );

  /**
   * Handles score submission.
   */
  const handleSubmitScore = useCallback(async (): Promise<void> => {
    if (!nickname.trim()) {
      setSubmitError("Please enter a nickname");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    // Check if user is authenticated
    const userResult = await getUser();
    if (!userResult.user) {
      setSubmitError("Please log in to submit scores to the leaderboard");
      setIsSubmitting(false);
      return;
    }

    const result = await submitNewScore({
      username: nickname.trim(),
      score,
      difficulty,
    });

    setIsSubmitting(false);

    if (result.error) {
      setSubmitError(result.error);
    } else {
      setSubmitSuccess(true);
      setNickname("");
    }
  }, [nickname, score, difficulty, submitNewScore]);

  /**
   * Handles nickname input change.
   */
  const handleNicknameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setNickname(event.target.value);
      if (submitError) {
        setSubmitError(null);
      }
    },
    [submitError]
  );

  /**
   * Checks if an entry belongs to the current player.
   */
  const isCurrentPlayer = useCallback(
    (entry: LeaderboardEntry): boolean => {
      if (currentUserId) {
        return entry.user_id === currentUserId;
      }
      return false;
    },
    [currentUserId]
  );

  /**
   * Finds the current player's rank in the leaderboard.
   */
  const getCurrentPlayerRank = useCallback((): number | null => {
    if (!currentUserId) return null;

    const index = entries.findIndex((entry) => entry.user_id === currentUserId);
    return index >= 0 ? index + 1 : null;
  }, [entries, currentUserId]);

  const playerRank = getCurrentPlayerRank();
  const isGameOver = gameStatus === "gameover";
  const canSubmit = isGameOver && score > 0 && !submitSuccess;

  return (
    <div className="leaderboard" data-testid="leaderboard">
      <h2 className="leaderboard-title">Leaderboard</h2>

      {/* Difficulty Filter Tabs */}
      <div className="leaderboard-filters" data-testid="leaderboard-filters">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value ?? "all"}
            className={`filter-button ${selectedDifficulty === option.value ? "selected" : ""}`}
            onClick={() => handleFilterChange(option.value)}
            data-testid={`filter-${option.value ?? "all"}`}
            aria-pressed={selectedDifficulty === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Current Player Rank */}
      {playerRank !== null && (
        <div className="player-rank" data-testid="player-rank">
          Your rank: <span className="rank-value">#{playerRank}</span>
        </div>
      )}

      {/* Score Submission Form (shown on game over) */}
      {canSubmit && (
        <div className="score-submission" data-testid="score-submission">
          <h3 className="submission-title">Submit Your Score</h3>
          <div className="submission-info">
            <span className="submission-score">Score: {score}</span>
            <span className="submission-difficulty">
              Difficulty: {DIFFICULTY_LABELS[difficulty]}
            </span>
          </div>
          <div className="submission-form">
            <input
              type="text"
              className="nickname-input"
              placeholder="Enter nickname"
              value={nickname}
              onChange={handleNicknameChange}
              maxLength={20}
              data-testid="nickname-input"
              disabled={isSubmitting}
            />
            <button
              className="submit-button"
              onClick={handleSubmitScore}
              disabled={isSubmitting || !nickname.trim()}
              data-testid="submit-score-button"
            >
              {isSubmitting ? "Submitting..." : "Submit Score"}
            </button>
          </div>
          {submitError && (
            <div className="submission-error" data-testid="submission-error">
              {submitError}
            </div>
          )}
        </div>
      )}

      {/* Submit Success Message */}
      {submitSuccess && (
        <div className="submission-success" data-testid="submission-success">
          Score submitted successfully!
        </div>
      )}

      {/* Loading State */}
      {isLoading && entries.length === 0 && (
        <div className="leaderboard-loading" data-testid="leaderboard-loading">
          <div className="loading-spinner" />
          <span>Loading scores...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="leaderboard-error" data-testid="leaderboard-error">
          <span className="error-icon">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && entries.length === 0 && (
        <div className="leaderboard-empty" data-testid="leaderboard-empty">
          <span className="empty-icon">🏆</span>
          <span>No scores yet. Be the first to play!</span>
        </div>
      )}

      {/* Leaderboard Table */}
      {entries.length > 0 && (
        <div
          className="leaderboard-table-container"
          data-testid="leaderboard-table-container"
        >
          <table className="leaderboard-table" data-testid="leaderboard-table">
            <thead>
              <tr>
                <th className="rank-column">Rank</th>
                <th className="player-column">Player</th>
                <th className="score-column">Score</th>
                <th className="difficulty-column">Difficulty</th>
                <th className="date-column">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`leaderboard-row ${isCurrentPlayer(entry) ? "current-player" : ""}`}
                  data-testid={`leaderboard-row-${index}`}
                >
                  <td className="rank-column">
                    <span
                      className={`rank ${index < 3 ? `rank-${index + 1}` : ""}`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="player-column">
                    <span className="player-name">{entry.username}</span>
                    {isCurrentPlayer(entry) && (
                      <span className="you-badge" data-testid="you-badge">
                        You
                      </span>
                    )}
                  </td>
                  <td className="score-column">
                    <span className="score-value">
                      {entry.score.toLocaleString()}
                    </span>
                  </td>
                  <td className="difficulty-column">
                    <span
                      className={`difficulty-badge difficulty-${entry.difficulty}`}
                    >
                      {DIFFICULTY_LABELS[entry.difficulty as Difficulty] ||
                        entry.difficulty}
                    </span>
                  </td>
                  <td className="date-column">
                    <span className="date-value">
                      {formatDate(entry.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Return to Menu Button */}
      {onReturnToMenu && (
        <button
          className="return-button"
          onClick={onReturnToMenu}
          data-testid="return-to-menu-button"
        >
          Return to Menu
        </button>
      )}
    </div>
  );
}

export default Leaderboard;

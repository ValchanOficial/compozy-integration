import { Difficulty, GuestScore, GuestScoreData } from "@/types";

/**
 * LocalStorage keys for guest score persistence.
 */
const STORAGE_KEYS = {
  GUEST_SCORES: "snake_game_guest_scores",
} as const;

/**
 * Default empty score data structure.
 */
const DEFAULT_SCORE_DATA: GuestScoreData = {
  easy: null,
  medium: null,
  hard: null,
};

/**
 * Checks if LocalStorage is available in the current browser.
 * @returns true if LocalStorage is available and functional
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a value is a valid GuestScore object.
 * @param value - The value to validate
 * @returns true if the value is a valid GuestScore
 */
function isValidGuestScore(value: unknown): value is GuestScore {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.score === "number" &&
    Number.isFinite(obj.score) &&
    obj.score >= 0 &&
    typeof obj.difficulty === "string" &&
    ["easy", "medium", "hard"].includes(obj.difficulty) &&
    typeof obj.timestamp === "string" &&
    !isNaN(Date.parse(obj.timestamp))
  );
}

/**
 * Validates that a value is a valid GuestScoreData object.
 * @param value - The value to validate
 * @returns true if the value is valid GuestScoreData
 */
function isValidGuestScoreData(value: unknown): value is GuestScoreData {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  for (const difficulty of difficulties) {
    const score = obj[difficulty];
    if (score !== null && !isValidGuestScore(score)) {
      return false;
    }
  }

  return true;
}

/**
 * Retrieves all guest scores from LocalStorage.
 * Returns default empty data if LocalStorage is unavailable or data is corrupted.
 * @returns GuestScoreData object with scores for all difficulties
 */
export function getGuestScores(): GuestScoreData {
  if (!isLocalStorageAvailable()) {
    return { ...DEFAULT_SCORE_DATA };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.GUEST_SCORES);

    if (raw === null) {
      return { ...DEFAULT_SCORE_DATA };
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isValidGuestScoreData(parsed)) {
      // Data is corrupted, clear it and return defaults
      window.localStorage.removeItem(STORAGE_KEYS.GUEST_SCORES);
      return { ...DEFAULT_SCORE_DATA };
    }

    return {
      easy: parsed.easy,
      medium: parsed.medium,
      hard: parsed.hard,
    };
  } catch {
    // JSON parse error, return defaults
    return { ...DEFAULT_SCORE_DATA };
  }
}

/**
 * Retrieves the high score for a specific difficulty level.
 * @param difficulty - The difficulty level to get the score for
 * @returns The GuestScore object if exists, null otherwise
 */
export function getHighScoreForDifficulty(
  difficulty: Difficulty
): GuestScore | null {
  const scores = getGuestScores();
  return scores[difficulty];
}

/**
 * Retrieves just the score value for a specific difficulty level.
 * @param difficulty - The difficulty level to get the score for
 * @returns The score value if exists, 0 otherwise
 */
export function getHighScoreValue(difficulty: Difficulty): number {
  const score = getHighScoreForDifficulty(difficulty);
  return score?.score ?? 0;
}

/**
 * Saves a guest score to LocalStorage.
 * Only saves if the new score is higher than the existing one.
 * @param score - The score value to save
 * @param difficulty - The difficulty level
 * @returns true if the score was saved, false otherwise
 */
export function saveGuestScore(score: number, difficulty: Difficulty): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  // Validate input
  if (!Number.isFinite(score) || score < 0) {
    return false;
  }

  if (!["easy", "medium", "hard"].includes(difficulty)) {
    return false;
  }

  try {
    const currentScores = getGuestScores();
    const existingScore = currentScores[difficulty];

    // Only update if new score is higher
    if (existingScore !== null && existingScore.score >= score) {
      return false;
    }

    const newScore: GuestScore = {
      score,
      difficulty,
      timestamp: new Date().toISOString(),
    };

    const updatedScores: GuestScoreData = {
      ...currentScores,
      [difficulty]: newScore,
    };

    window.localStorage.setItem(
      STORAGE_KEYS.GUEST_SCORES,
      JSON.stringify(updatedScores)
    );

    return true;
  } catch (error) {
    // Handle quota exceeded error
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      // Attempt to clear old data and retry once
      try {
        clearGuestScores();
        const newScore: GuestScore = {
          score,
          difficulty,
          timestamp: new Date().toISOString(),
        };
        const freshScores: GuestScoreData = {
          ...DEFAULT_SCORE_DATA,
          [difficulty]: newScore,
        };
        window.localStorage.setItem(
          STORAGE_KEYS.GUEST_SCORES,
          JSON.stringify(freshScores)
        );
        return true;
      } catch {
        // Still failed, give up
        return false;
      }
    }
    return false;
  }
}

/**
 * Clears all guest scores from LocalStorage.
 * @returns true if scores were cleared, false if LocalStorage is unavailable
 */
export function clearGuestScores(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEYS.GUEST_SCORES);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets all high scores as a simple object mapping difficulty to score value.
 * Useful for displaying scores in the UI.
 * @returns Object with difficulty keys and score values
 */
export function getAllHighScoreValues(): Record<Difficulty, number> {
  const scores = getGuestScores();
  return {
    easy: scores.easy?.score ?? 0,
    medium: scores.medium?.score ?? 0,
    hard: scores.hard?.score ?? 0,
  };
}

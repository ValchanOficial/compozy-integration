/**
 * Shared TypeScript type definitions for the Snake game.
 */

export type Difficulty = "easy" | "medium" | "hard";

export type GameStatus = "menu" | "playing" | "paused" | "gameover";

export interface GameState {
  score: number;
  highScore: number;
  difficulty: Difficulty;
  gameStatus: GameStatus;
  setScore: (score: number) => void;
  setHighScore: (highScore: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setGameStatus: (status: GameStatus) => void;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  score: number;
  difficulty: string;
  created_at: string;
}

/**
 * Guest score data stored in LocalStorage.
 * Contains the score value, difficulty level, and timestamp.
 */
export interface GuestScore {
  /** The score value achieved */
  score: number;
  /** Difficulty level when score was achieved */
  difficulty: Difficulty;
  /** Timestamp when the score was saved (ISO 8601 format) */
  timestamp: string;
}

/**
 * All guest scores stored in LocalStorage, organized by difficulty.
 */
export interface GuestScoreData {
  /** High score for easy difficulty */
  easy: GuestScore | null;
  /** High score for medium difficulty */
  medium: GuestScore | null;
  /** High score for hard difficulty */
  hard: GuestScore | null;
}

/**
 * Audio settings stored in LocalStorage.
 */
export interface AudioSettings {
  /** Sound effects volume (0-1) */
  effectsVolume: number;
  /** Background music volume (0-1) */
  musicVolume: number;
  /** Whether all audio is muted */
  isMuted: boolean;
}

/**
 * Screen breakpoint identifiers for responsive design.
 */
export type ScreenBreakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/**
 * Swipe direction for touch controls.
 */
export type SwipeDirection = "up" | "down" | "left" | "right" | null;

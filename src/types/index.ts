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

import { create } from "zustand";
import { Difficulty, GameStatus, GameState } from "@/types";
import { getHighScoreValue, saveGuestScore } from "@/services/localStorage";

/**
 * Zustand store for game state management.
 * Accessible by both React components (via hooks) and Phaser (via getState()).
 */
export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  highScore: 0,
  difficulty: "medium",
  gameStatus: "menu",

  setScore: (score: number) => {
    const { highScore } = get();
    set({
      score,
      highScore: Math.max(score, highScore),
    });
  },

  setHighScore: (highScore: number) => {
    set({ highScore });
  },

  setDifficulty: (difficulty: Difficulty) => {
    set({ difficulty });
  },

  setGameStatus: (gameStatus: GameStatus) => {
    set({ gameStatus });
  },
}));

/**
 * Get the current state without React hooks.
 * Useful for Phaser scenes to read/write state.
 */
export const getGameState = (): GameState => useGameStore.getState();

/**
 * Reset game state to initial values.
 * Used when starting a new game.
 */
export const resetGameState = (): void => {
  useGameStore.setState({
    score: 0,
    gameStatus: "playing",
  });
};

/**
 * Increment score by a value (default 10 points per food).
 */
export const incrementScore = (value: number = 10): void => {
  const state = useGameStore.getState();
  state.setScore(state.score + value);
};

/**
 * Load high score from LocalStorage for the current difficulty.
 * Called when the game starts or difficulty changes.
 */
export const loadHighScoreFromStorage = (): void => {
  const state = useGameStore.getState();
  const storedHighScore = getHighScoreValue(state.difficulty);
  if (storedHighScore > state.highScore) {
    state.setHighScore(storedHighScore);
  }
};

/**
 * Save the current score to LocalStorage if it's a new high score.
 * Called when the game ends.
 * @returns true if the score was saved (new high score), false otherwise
 */
export const saveScoreToStorage = (): boolean => {
  const state = useGameStore.getState();
  return saveGuestScore(state.score, state.difficulty);
};

/**
 * Initialize game state with high score from LocalStorage.
 * Called on app startup.
 */
export const initializeGameStore = (): void => {
  loadHighScoreFromStorage();
};

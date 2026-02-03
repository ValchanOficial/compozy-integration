import {
  applyAudioSettings,
  getDefaultAudioSettings,
  loadAudioSettings,
  saveAudioSettings as persistAudioSettings,
} from "@/services/audioService";
import { getHighScoreValue, saveGuestScore } from "@/services/localStorage";
import { type AudioSettings, type Difficulty, type GameStatus } from "@/types";
import { create } from "zustand";

/**
 * Extended GameState interface with audio settings.
 */
export interface GameState {
  score: number;
  highScore: number;
  difficulty: Difficulty;
  gameStatus: GameStatus;
  audioSettings: AudioSettings;
  setScore: (score: number) => void;
  setHighScore: (highScore: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setGameStatus: (status: GameStatus) => void;
  setEffectsVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  resetGame: () => void;
}

/**
 * Zustand store for game state management.
 * Accessible by both React components (via hooks) and Phaser (via getState()).
 */
export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  highScore: 0,
  difficulty: "medium",
  gameStatus: "menu",
  audioSettings: getDefaultAudioSettings(),

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

  setEffectsVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const newSettings = {
      ...get().audioSettings,
      effectsVolume: clampedVolume,
    };
    set({ audioSettings: newSettings });
    applyAudioSettings(newSettings);
    persistAudioSettings(newSettings);
  },

  setMusicVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    const newSettings = {
      ...get().audioSettings,
      musicVolume: clampedVolume,
    };
    set({ audioSettings: newSettings });
    applyAudioSettings(newSettings);
    persistAudioSettings(newSettings);
  },

  setMuted: (muted: boolean) => {
    const newSettings = {
      ...get().audioSettings,
      isMuted: muted,
    };
    set({ audioSettings: newSettings });
    applyAudioSettings(newSettings);
    persistAudioSettings(newSettings);
  },

  toggleMuted: () => {
    const { audioSettings } = get();
    const newSettings = {
      ...audioSettings,
      isMuted: !audioSettings.isMuted,
    };
    set({ audioSettings: newSettings });
    applyAudioSettings(newSettings);
    persistAudioSettings(newSettings);
  },

  resetGame: () => {
    set({
      score: 0,
      gameStatus: "menu",
    });
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
 * Initialize game state with high score and audio settings from LocalStorage.
 * Called on app startup.
 */
export const initializeGameStore = (): void => {
  loadHighScoreFromStorage();

  // Load audio settings from localStorage
  const savedAudioSettings = loadAudioSettings();
  useGameStore.setState({ audioSettings: savedAudioSettings });
};

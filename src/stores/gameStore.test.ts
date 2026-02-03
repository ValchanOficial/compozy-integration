import { describe, it, expect, beforeEach } from "vitest";
import {
  useGameStore,
  getGameState,
  resetGameState,
  incrementScore,
  loadHighScoreFromStorage,
  saveScoreToStorage,
  initializeGameStore,
} from "./gameStore";
import { saveGuestScore, clearGuestScores } from "@/services/localStorage";

describe("gameStore", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearGuestScores();
    // Reset store to initial state before each test
    useGameStore.setState({
      score: 0,
      highScore: 0,
      difficulty: "medium",
      gameStatus: "menu",
    });
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const state = getGameState();
      expect(state.score).toBe(0);
      expect(state.highScore).toBe(0);
      expect(state.difficulty).toBe("medium");
      expect(state.gameStatus).toBe("menu");
    });
  });

  describe("setScore", () => {
    it("updates score correctly", () => {
      const state = getGameState();
      state.setScore(100);
      expect(getGameState().score).toBe(100);
    });

    it("updates high score when score exceeds it", () => {
      const state = getGameState();
      state.setScore(50);
      expect(getGameState().highScore).toBe(50);

      state.setScore(100);
      expect(getGameState().highScore).toBe(100);
    });

    it("does not lower high score when score decreases", () => {
      const state = getGameState();
      state.setScore(100);
      state.setScore(50);
      expect(getGameState().highScore).toBe(100);
    });
  });

  describe("setHighScore", () => {
    it("updates high score directly", () => {
      const state = getGameState();
      state.setHighScore(200);
      expect(getGameState().highScore).toBe(200);
    });
  });

  describe("setDifficulty", () => {
    it("updates difficulty to easy", () => {
      const state = getGameState();
      state.setDifficulty("easy");
      expect(getGameState().difficulty).toBe("easy");
    });

    it("updates difficulty to hard", () => {
      const state = getGameState();
      state.setDifficulty("hard");
      expect(getGameState().difficulty).toBe("hard");
    });
  });

  describe("setGameStatus", () => {
    it("updates status to playing", () => {
      const state = getGameState();
      state.setGameStatus("playing");
      expect(getGameState().gameStatus).toBe("playing");
    });

    it("updates status to paused", () => {
      const state = getGameState();
      state.setGameStatus("paused");
      expect(getGameState().gameStatus).toBe("paused");
    });

    it("updates status to gameover", () => {
      const state = getGameState();
      state.setGameStatus("gameover");
      expect(getGameState().gameStatus).toBe("gameover");
    });

    it("updates status to menu", () => {
      const state = getGameState();
      state.setGameStatus("playing");
      state.setGameStatus("menu");
      expect(getGameState().gameStatus).toBe("menu");
    });
  });

  describe("resetGameState", () => {
    it("resets score to 0", () => {
      const state = getGameState();
      state.setScore(100);
      resetGameState();
      expect(getGameState().score).toBe(0);
    });

    it("sets game status to playing", () => {
      resetGameState();
      expect(getGameState().gameStatus).toBe("playing");
    });

    it("preserves high score", () => {
      const state = getGameState();
      state.setScore(100);
      resetGameState();
      expect(getGameState().highScore).toBe(100);
    });

    it("preserves difficulty", () => {
      const state = getGameState();
      state.setDifficulty("hard");
      resetGameState();
      expect(getGameState().difficulty).toBe("hard");
    });
  });

  describe("incrementScore", () => {
    it("increments score by default value (10)", () => {
      incrementScore();
      expect(getGameState().score).toBe(10);
    });

    it("increments score by custom value", () => {
      incrementScore(25);
      expect(getGameState().score).toBe(25);
    });

    it("accumulates score correctly", () => {
      incrementScore(10);
      incrementScore(10);
      incrementScore(10);
      expect(getGameState().score).toBe(30);
    });

    it("updates high score when incrementing", () => {
      incrementScore(50);
      expect(getGameState().highScore).toBe(50);

      incrementScore(30);
      expect(getGameState().highScore).toBe(80);
    });
  });

  describe("getGameState", () => {
    it("returns state accessible outside React", () => {
      const state = getGameState();
      state.setScore(42);

      // Access state again without hooks
      const newState = getGameState();
      expect(newState.score).toBe(42);
    });

    it("allows Phaser to read and write state", () => {
      // Simulate Phaser updating state
      const state = getGameState();
      state.setScore(100);
      state.setGameStatus("gameover");

      // Verify state was updated
      expect(getGameState().score).toBe(100);
      expect(getGameState().gameStatus).toBe("gameover");
    });
  });

  describe("store reactivity", () => {
    it("updates are immediately visible", () => {
      const state = getGameState();
      state.setScore(1);
      expect(getGameState().score).toBe(1);

      state.setScore(2);
      expect(getGameState().score).toBe(2);

      state.setScore(3);
      expect(getGameState().score).toBe(3);
    });
  });

  describe("loadHighScoreFromStorage", () => {
    it("loads high score from localStorage for current difficulty", () => {
      // Save a score to localStorage
      saveGuestScore(150, "medium");

      // Load it into the store
      loadHighScoreFromStorage();

      expect(getGameState().highScore).toBe(150);
    });

    it("does not lower high score if store value is higher", () => {
      const state = getGameState();
      state.setHighScore(200);

      // Save lower score to localStorage
      saveGuestScore(100, "medium");

      // Try to load - should not lower the high score
      loadHighScoreFromStorage();

      expect(getGameState().highScore).toBe(200);
    });

    it("loads correct score based on current difficulty", () => {
      saveGuestScore(100, "easy");
      saveGuestScore(200, "medium");
      saveGuestScore(300, "hard");

      // Default difficulty is medium
      loadHighScoreFromStorage();
      expect(getGameState().highScore).toBe(200);

      // Change to hard and reload
      const state = getGameState();
      state.setDifficulty("hard");
      useGameStore.setState({ highScore: 0 });
      loadHighScoreFromStorage();
      expect(getGameState().highScore).toBe(300);
    });
  });

  describe("saveScoreToStorage", () => {
    it("saves current score to localStorage", () => {
      const state = getGameState();
      state.setScore(250);

      const result = saveScoreToStorage();

      expect(result).toBe(true);
    });

    it("returns false when score is lower than existing", () => {
      saveGuestScore(200, "medium");

      const state = getGameState();
      state.setScore(100);

      const result = saveScoreToStorage();

      expect(result).toBe(false);
    });

    it("saves score for current difficulty", () => {
      const state = getGameState();
      state.setDifficulty("hard");
      state.setScore(500);

      saveScoreToStorage();

      // Change difficulty and verify scores are separate
      state.setDifficulty("easy");
      state.setScore(100);
      saveScoreToStorage();

      // Check both were saved correctly
      state.setDifficulty("hard");
      useGameStore.setState({ highScore: 0 });
      loadHighScoreFromStorage();
      expect(getGameState().highScore).toBe(500);

      state.setDifficulty("easy");
      useGameStore.setState({ highScore: 0 });
      loadHighScoreFromStorage();
      expect(getGameState().highScore).toBe(100);
    });
  });

  describe("initializeGameStore", () => {
    it("loads high score from storage on initialization", () => {
      saveGuestScore(300, "medium");
      useGameStore.setState({ highScore: 0 });

      initializeGameStore();

      expect(getGameState().highScore).toBe(300);
    });
  });
});

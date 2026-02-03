import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  isLocalStorageAvailable,
  getGuestScores,
  getHighScoreForDifficulty,
  getHighScoreValue,
  saveGuestScore,
  clearGuestScores,
  getAllHighScoreValues,
} from "./localStorage";
import { GuestScoreData } from "@/types";

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
};

describe("localStorage service", () => {
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("isLocalStorageAvailable", () => {
    it("returns true when localStorage is available", () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });

    it("returns false when localStorage throws on setItem", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });
      expect(isLocalStorageAvailable()).toBe(false);
    });

    it("returns false when localStorage throws on removeItem", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });
      expect(isLocalStorageAvailable()).toBe(false);
    });
  });

  describe("getGuestScores", () => {
    it("returns default values when no data exists", () => {
      const scores = getGuestScores();
      expect(scores).toEqual({
        easy: null,
        medium: null,
        hard: null,
      });
    });

    it("returns stored scores when valid data exists", () => {
      const storedData: GuestScoreData = {
        easy: {
          score: 100,
          difficulty: "easy",
          timestamp: "2024-01-15T09:00:00.000Z",
        },
        medium: null,
        hard: {
          score: 300,
          difficulty: "hard",
          timestamp: "2024-01-15T09:30:00.000Z",
        },
      };
      localStorageMock._setStore({
        snake_game_guest_scores: JSON.stringify(storedData),
      });

      const scores = getGuestScores();
      expect(scores.easy?.score).toBe(100);
      expect(scores.medium).toBeNull();
      expect(scores.hard?.score).toBe(300);
    });

    it("returns default values when localStorage is unavailable", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      const scores = getGuestScores();
      expect(scores).toEqual({
        easy: null,
        medium: null,
        hard: null,
      });
    });

    it("returns default values and clears corrupted data", () => {
      localStorageMock._setStore({
        snake_game_guest_scores: "invalid json {{{",
      });

      const scores = getGuestScores();
      expect(scores).toEqual({
        easy: null,
        medium: null,
        hard: null,
      });
    });

    it("clears data with invalid score structure", () => {
      localStorageMock._setStore({
        snake_game_guest_scores: JSON.stringify({
          easy: {
            score: "not a number",
            difficulty: "easy",
            timestamp: "2024-01-15T09:00:00.000Z",
          },
          medium: null,
          hard: null,
        }),
      });

      const scores = getGuestScores();
      expect(scores).toEqual({
        easy: null,
        medium: null,
        hard: null,
      });
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "snake_game_guest_scores"
      );
    });

    it("clears data with invalid difficulty value", () => {
      localStorageMock._setStore({
        snake_game_guest_scores: JSON.stringify({
          easy: {
            score: 100,
            difficulty: "invalid",
            timestamp: "2024-01-15T09:00:00.000Z",
          },
          medium: null,
          hard: null,
        }),
      });

      const scores = getGuestScores();
      expect(scores).toEqual({
        easy: null,
        medium: null,
        hard: null,
      });
    });

    it("clears data with invalid timestamp", () => {
      localStorageMock._setStore({
        snake_game_guest_scores: JSON.stringify({
          easy: { score: 100, difficulty: "easy", timestamp: "not a date" },
          medium: null,
          hard: null,
        }),
      });

      const scores = getGuestScores();
      expect(scores).toEqual({
        easy: null,
        medium: null,
        hard: null,
      });
    });

    it("clears data with negative score", () => {
      localStorageMock._setStore({
        snake_game_guest_scores: JSON.stringify({
          easy: {
            score: -50,
            difficulty: "easy",
            timestamp: "2024-01-15T09:00:00.000Z",
          },
          medium: null,
          hard: null,
        }),
      });

      const scores = getGuestScores();
      expect(scores).toEqual({
        easy: null,
        medium: null,
        hard: null,
      });
    });

    it("clears data with Infinity score", () => {
      localStorageMock._setStore({
        snake_game_guest_scores: JSON.stringify({
          easy: {
            score: Infinity,
            difficulty: "easy",
            timestamp: "2024-01-15T09:00:00.000Z",
          },
          medium: null,
          hard: null,
        }),
      });

      // Note: JSON.stringify converts Infinity to null, so this tests null score handling
      const scores = getGuestScores();
      expect(scores).toEqual({
        easy: null,
        medium: null,
        hard: null,
      });
    });

    it("clears data with NaN score", () => {
      localStorageMock._setStore({
        snake_game_guest_scores: JSON.stringify({
          easy: {
            score: NaN,
            difficulty: "easy",
            timestamp: "2024-01-15T09:00:00.000Z",
          },
          medium: null,
          hard: null,
        }),
      });

      // Note: JSON.stringify converts NaN to null
      const scores = getGuestScores();
      expect(scores).toEqual({
        easy: null,
        medium: null,
        hard: null,
      });
    });
  });

  describe("getHighScoreForDifficulty", () => {
    it("returns null when no score exists for difficulty", () => {
      expect(getHighScoreForDifficulty("easy")).toBeNull();
      expect(getHighScoreForDifficulty("medium")).toBeNull();
      expect(getHighScoreForDifficulty("hard")).toBeNull();
    });

    it("returns score for specific difficulty", () => {
      const storedData: GuestScoreData = {
        easy: {
          score: 100,
          difficulty: "easy",
          timestamp: "2024-01-15T09:00:00.000Z",
        },
        medium: {
          score: 200,
          difficulty: "medium",
          timestamp: "2024-01-15T09:15:00.000Z",
        },
        hard: {
          score: 300,
          difficulty: "hard",
          timestamp: "2024-01-15T09:30:00.000Z",
        },
      };
      localStorageMock._setStore({
        snake_game_guest_scores: JSON.stringify(storedData),
      });

      const easyScore = getHighScoreForDifficulty("easy");
      expect(easyScore?.score).toBe(100);
      expect(easyScore?.difficulty).toBe("easy");

      const mediumScore = getHighScoreForDifficulty("medium");
      expect(mediumScore?.score).toBe(200);

      const hardScore = getHighScoreForDifficulty("hard");
      expect(hardScore?.score).toBe(300);
    });
  });

  describe("getHighScoreValue", () => {
    it("returns 0 when no score exists", () => {
      expect(getHighScoreValue("easy")).toBe(0);
      expect(getHighScoreValue("medium")).toBe(0);
      expect(getHighScoreValue("hard")).toBe(0);
    });

    it("returns score value for difficulty", () => {
      const storedData: GuestScoreData = {
        easy: {
          score: 150,
          difficulty: "easy",
          timestamp: "2024-01-15T09:00:00.000Z",
        },
        medium: null,
        hard: {
          score: 350,
          difficulty: "hard",
          timestamp: "2024-01-15T09:30:00.000Z",
        },
      };
      localStorageMock._setStore({
        snake_game_guest_scores: JSON.stringify(storedData),
      });

      expect(getHighScoreValue("easy")).toBe(150);
      expect(getHighScoreValue("medium")).toBe(0);
      expect(getHighScoreValue("hard")).toBe(350);
    });
  });

  describe("saveGuestScore", () => {
    it("saves score successfully for each difficulty level", () => {
      expect(saveGuestScore(100, "easy")).toBe(true);
      expect(saveGuestScore(200, "medium")).toBe(true);
      expect(saveGuestScore(300, "hard")).toBe(true);

      const scores = getGuestScores();
      expect(scores.easy?.score).toBe(100);
      expect(scores.medium?.score).toBe(200);
      expect(scores.hard?.score).toBe(300);
    });

    it("saves score with correct timestamp", () => {
      saveGuestScore(100, "easy");
      const scores = getGuestScores();
      expect(scores.easy?.timestamp).toBe("2024-01-15T10:00:00.000Z");
    });

    it("only updates score if new score is higher", () => {
      saveGuestScore(100, "easy");
      expect(getHighScoreValue("easy")).toBe(100);

      // Try to save lower score
      const result = saveGuestScore(50, "easy");
      expect(result).toBe(false);
      expect(getHighScoreValue("easy")).toBe(100);

      // Try to save equal score
      const result2 = saveGuestScore(100, "easy");
      expect(result2).toBe(false);
      expect(getHighScoreValue("easy")).toBe(100);

      // Save higher score
      const result3 = saveGuestScore(150, "easy");
      expect(result3).toBe(true);
      expect(getHighScoreValue("easy")).toBe(150);
    });

    it("returns false when localStorage is unavailable", () => {
      // isLocalStorageAvailable checks via setItem, so we need to mock that
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      const result = saveGuestScore(100, "easy");
      expect(result).toBe(false);
    });

    it("returns false for invalid score values", () => {
      expect(saveGuestScore(-10, "easy")).toBe(false);
      expect(saveGuestScore(Infinity, "easy")).toBe(false);
      expect(saveGuestScore(NaN, "easy")).toBe(false);
    });

    it("returns false for invalid difficulty", () => {
      // @ts-expect-error Testing invalid input
      expect(saveGuestScore(100, "invalid")).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(saveGuestScore(100, "")).toBe(false);
    });

    it("handles quota exceeded error by clearing and retrying", () => {
      let callCount = 0;
      localStorageMock.setItem.mockImplementation(
        (key: string, value: string) => {
          callCount++;
          // First two calls are for isLocalStorageAvailable check (test key set/remove)
          // Third call is the actual save that fails
          // Fourth call is after clearing and retry
          if (callCount === 3) {
            const error = new DOMException(
              "Quota exceeded",
              "QuotaExceededError"
            );
            throw error;
          }
          // Other calls succeed
          localStorageMock._getStore()[key] = value;
        }
      );

      const result = saveGuestScore(100, "easy");
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        "snake_game_guest_scores"
      );
    });

    it("returns false when quota exceeded retry also fails", () => {
      localStorageMock.setItem.mockImplementation(() => {
        const error = new DOMException("Quota exceeded", "QuotaExceededError");
        throw error;
      });

      const result = saveGuestScore(100, "easy");
      expect(result).toBe(false);
    });

    it("preserves scores for other difficulties when saving", () => {
      saveGuestScore(100, "easy");
      saveGuestScore(200, "medium");
      saveGuestScore(300, "hard");

      // Update one difficulty
      saveGuestScore(150, "easy");

      const scores = getGuestScores();
      expect(scores.easy?.score).toBe(150);
      expect(scores.medium?.score).toBe(200);
      expect(scores.hard?.score).toBe(300);
    });
  });

  describe("clearGuestScores", () => {
    it("clears all guest scores", () => {
      saveGuestScore(100, "easy");
      saveGuestScore(200, "medium");

      const result = clearGuestScores();
      expect(result).toBe(true);

      const scores = getGuestScores();
      expect(scores.easy).toBeNull();
      expect(scores.medium).toBeNull();
      expect(scores.hard).toBeNull();
    });

    it("returns false when localStorage is unavailable", () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });
      // First make localStorage "available" for the check
      // but fail on remove

      // We need to override isLocalStorageAvailable for this test
      // Actually, the function checks via getItem - let's test different scenario
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Storage disabled");
      });

      const result = clearGuestScores();
      expect(result).toBe(false);
    });
  });

  describe("getAllHighScoreValues", () => {
    it("returns all zeros when no scores exist", () => {
      const scores = getAllHighScoreValues();
      expect(scores).toEqual({
        easy: 0,
        medium: 0,
        hard: 0,
      });
    });

    it("returns all score values", () => {
      saveGuestScore(100, "easy");
      saveGuestScore(200, "medium");
      saveGuestScore(300, "hard");

      const scores = getAllHighScoreValues();
      expect(scores).toEqual({
        easy: 100,
        medium: 200,
        hard: 300,
      });
    });

    it("returns 0 for difficulties without scores", () => {
      saveGuestScore(100, "easy");

      const scores = getAllHighScoreValues();
      expect(scores).toEqual({
        easy: 100,
        medium: 0,
        hard: 0,
      });
    });
  });

  describe("integration tests", () => {
    it("saves guest score and retrieves it correctly", () => {
      // Save a score
      const saved = saveGuestScore(250, "medium");
      expect(saved).toBe(true);

      // Retrieve the same score
      const score = getHighScoreForDifficulty("medium");
      expect(score).not.toBeNull();
      expect(score?.score).toBe(250);
      expect(score?.difficulty).toBe("medium");
    });

    it("scores are isolated per difficulty level", () => {
      saveGuestScore(100, "easy");
      saveGuestScore(200, "medium");
      saveGuestScore(300, "hard");

      // Verify isolation
      expect(getHighScoreValue("easy")).toBe(100);
      expect(getHighScoreValue("medium")).toBe(200);
      expect(getHighScoreValue("hard")).toBe(300);

      // Update one doesn't affect others
      saveGuestScore(150, "easy");
      expect(getHighScoreValue("easy")).toBe(150);
      expect(getHighScoreValue("medium")).toBe(200);
      expect(getHighScoreValue("hard")).toBe(300);
    });

    it("simulates page reload by clearing mock and reloading", () => {
      // Save scores
      saveGuestScore(100, "easy");
      saveGuestScore(200, "medium");

      // Get the raw stored data (simulating what persists across reloads)
      const rawData = localStorageMock._getStore()["snake_game_guest_scores"];

      // Clear mock's internal call history (but not the actual stored data)
      // This simulates a "page reload" where we still have the data
      vi.clearAllMocks();

      // Create a fresh mock with the same data
      const newMock = createLocalStorageMock();
      newMock._setStore({ snake_game_guest_scores: rawData });
      Object.defineProperty(window, "localStorage", {
        value: newMock,
        writable: true,
      });

      // Verify scores persist
      expect(getHighScoreValue("easy")).toBe(100);
      expect(getHighScoreValue("medium")).toBe(200);
    });
  });
});

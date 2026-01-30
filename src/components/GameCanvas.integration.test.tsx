import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import {
  useGameStore,
  getGameState,
  resetGameState,
  incrementScore,
} from "@/stores/gameStore";

// Mock Phaser for integration tests
vi.mock("phaser", () => {
  const mockGame = {
    destroy: vi.fn(),
    scale: {
      resize: vi.fn(),
      width: 800,
      height: 600,
    },
  };

  return {
    default: {
      Game: vi.fn(() => mockGame),
      AUTO: 0,
      Scale: {
        FIT: "FIT",
        CENTER_BOTH: "CENTER_BOTH",
      },
    },
  };
});

// Mock GameScene
vi.mock("@/game/scenes/GameScene", () => ({
  GameScene: vi.fn(),
}));

// Mock GAME_CONFIG
vi.mock("@/game/config", () => ({
  GAME_CONFIG: {
    type: 0,
    width: 800,
    height: 600,
    backgroundColor: "#1a1a2e",
    parent: "game-container",
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scale: {
      mode: "FIT",
      autoCenter: "CENTER_BOTH",
    },
    scene: [],
  },
}));

/**
 * React component that displays game state from Zustand store.
 * Used to verify that Phaser updates trigger React re-renders.
 */
function GameStateDisplay() {
  const { score, highScore, difficulty, gameStatus } = useGameStore();

  return (
    <div data-testid="game-state-display">
      <span data-testid="score">{score}</span>
      <span data-testid="high-score">{highScore}</span>
      <span data-testid="difficulty">{difficulty}</span>
      <span data-testid="game-status">{gameStatus}</span>
    </div>
  );
}

describe("React-Phaser Integration via Zustand", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store to initial state before each test
    useGameStore.setState({
      score: 0,
      highScore: 0,
      difficulty: "medium",
      gameStatus: "menu",
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("Phaser to React communication", () => {
    it("React component updates when Phaser updates score via getState()", () => {
      const { getByTestId } = render(<GameStateDisplay />);

      expect(getByTestId("score").textContent).toBe("0");

      // Simulate Phaser updating score via getState()
      act(() => {
        const state = getGameState();
        state.setScore(100);
      });

      expect(getByTestId("score").textContent).toBe("100");
    });

    it("React component updates when Phaser changes game status", () => {
      const { getByTestId } = render(<GameStateDisplay />);

      expect(getByTestId("game-status").textContent).toBe("menu");

      // Simulate Phaser starting game
      act(() => {
        const state = getGameState();
        state.setGameStatus("playing");
      });

      expect(getByTestId("game-status").textContent).toBe("playing");
    });

    it("React component updates highScore when Phaser beats previous highScore", () => {
      const { getByTestId } = render(<GameStateDisplay />);

      expect(getByTestId("high-score").textContent).toBe("0");

      // Simulate Phaser achieving new high score
      act(() => {
        incrementScore(150);
      });

      expect(getByTestId("high-score").textContent).toBe("150");
    });

    it("highScore persists when Phaser resets game", () => {
      const { getByTestId } = render(<GameStateDisplay />);

      // Achieve high score
      act(() => {
        incrementScore(200);
      });

      expect(getByTestId("high-score").textContent).toBe("200");

      // Reset game (simulating game over and restart)
      act(() => {
        resetGameState();
      });

      // Score resets but high score remains
      expect(getByTestId("score").textContent).toBe("0");
      expect(getByTestId("high-score").textContent).toBe("200");
    });

    it("React receives rapid score updates from Phaser", () => {
      const { getByTestId } = render(<GameStateDisplay />);

      // Simulate rapid food collection
      act(() => {
        incrementScore(10);
        incrementScore(10);
        incrementScore(10);
        incrementScore(10);
        incrementScore(10);
      });

      expect(getByTestId("score").textContent).toBe("50");
    });
  });

  describe("React to Phaser communication", () => {
    it("Phaser reads difficulty setting from store on initialization", () => {
      // Simulate React component setting difficulty before game starts
      act(() => {
        useGameStore.setState({ difficulty: "hard" });
      });

      // Simulate Phaser reading difficulty via getState()
      const state = getGameState();
      expect(state.difficulty).toBe("hard");
    });

    it("Phaser can read game status set by React", () => {
      // React component changes status (e.g., pause button)
      act(() => {
        useGameStore.setState({ gameStatus: "paused" });
      });

      // Phaser reads the status
      const state = getGameState();
      expect(state.gameStatus).toBe("paused");
    });

    it("difficulty changes are immediately available to Phaser", () => {
      const { getByTestId } = render(<GameStateDisplay />);

      // React UI changes difficulty
      act(() => {
        const state = getGameState();
        state.setDifficulty("easy");
      });

      // Verify React sees update
      expect(getByTestId("difficulty").textContent).toBe("easy");

      // Verify Phaser can read it
      expect(getGameState().difficulty).toBe("easy");
    });
  });

  describe("bidirectional state synchronization", () => {
    it("state changes from either side are synchronized", () => {
      const { getByTestId } = render(<GameStateDisplay />);

      // Initial state
      expect(getByTestId("score").textContent).toBe("0");
      expect(getByTestId("game-status").textContent).toBe("menu");

      // Phaser starts game
      act(() => {
        getGameState().setGameStatus("playing");
      });
      expect(getByTestId("game-status").textContent).toBe("playing");

      // Phaser updates score multiple times
      act(() => {
        incrementScore(10);
        incrementScore(10);
      });
      expect(getByTestId("score").textContent).toBe("20");

      // React pauses game
      act(() => {
        useGameStore.setState({ gameStatus: "paused" });
      });
      expect(getGameState().gameStatus).toBe("paused");

      // Phaser detects paused state
      expect(getGameState().gameStatus).toBe("paused");
    });

    it("resetGameState works correctly for game restart flow", () => {
      const { getByTestId } = render(<GameStateDisplay />);

      // Play game and achieve score
      act(() => {
        getGameState().setGameStatus("playing");
        incrementScore(100);
        getGameState().setGameStatus("gameover");
      });

      expect(getByTestId("score").textContent).toBe("100");
      expect(getByTestId("game-status").textContent).toBe("gameover");

      // User restarts game
      act(() => {
        resetGameState();
      });

      expect(getByTestId("score").textContent).toBe("0");
      expect(getByTestId("game-status").textContent).toBe("playing");
      expect(getByTestId("high-score").textContent).toBe("100"); // Preserved
    });
  });

  describe("store accessibility patterns", () => {
    it("getGameState returns current state without hook", () => {
      // Set state via hook-based setState
      useGameStore.setState({ score: 42 });

      // Read via non-React method
      const state = getGameState();
      expect(state.score).toBe(42);
    });

    it("store methods are callable from non-React context", () => {
      // This simulates Phaser calling store methods
      const state = getGameState();

      // All methods should be functions
      expect(typeof state.setScore).toBe("function");
      expect(typeof state.setHighScore).toBe("function");
      expect(typeof state.setDifficulty).toBe("function");
      expect(typeof state.setGameStatus).toBe("function");

      // Methods should work correctly
      state.setScore(50);
      expect(getGameState().score).toBe(50);

      state.setDifficulty("hard");
      expect(getGameState().difficulty).toBe("hard");

      state.setGameStatus("playing");
      expect(getGameState().gameStatus).toBe("playing");
    });

    it("direct setState works for batch updates", () => {
      useGameStore.setState({
        score: 100,
        highScore: 200,
        difficulty: "hard",
        gameStatus: "gameover",
      });

      const state = getGameState();
      expect(state.score).toBe(100);
      expect(state.highScore).toBe(200);
      expect(state.difficulty).toBe("hard");
      expect(state.gameStatus).toBe("gameover");
    });
  });

  describe("game flow simulation", () => {
    it("simulates complete game lifecycle", () => {
      const { getByTestId } = render(<GameStateDisplay />);

      // 1. Initial menu state
      expect(getByTestId("game-status").textContent).toBe("menu");

      // 2. User selects difficulty
      act(() => {
        getGameState().setDifficulty("hard");
      });
      expect(getByTestId("difficulty").textContent).toBe("hard");

      // 3. Game starts
      act(() => {
        resetGameState(); // This sets status to "playing" and score to 0
      });
      expect(getByTestId("game-status").textContent).toBe("playing");
      expect(getByTestId("score").textContent).toBe("0");

      // 4. Player collects food
      act(() => {
        incrementScore(10);
        incrementScore(10);
        incrementScore(10);
      });
      expect(getByTestId("score").textContent).toBe("30");
      expect(getByTestId("high-score").textContent).toBe("30");

      // 5. Player pauses
      act(() => {
        getGameState().setGameStatus("paused");
      });
      expect(getByTestId("game-status").textContent).toBe("paused");

      // 6. Player resumes
      act(() => {
        getGameState().setGameStatus("playing");
      });
      expect(getByTestId("game-status").textContent).toBe("playing");

      // 7. Player collects more food
      act(() => {
        incrementScore(20);
      });
      expect(getByTestId("score").textContent).toBe("50");

      // 8. Game over (collision)
      act(() => {
        getGameState().setGameStatus("gameover");
      });
      expect(getByTestId("game-status").textContent).toBe("gameover");

      // 9. High score is recorded
      expect(getByTestId("high-score").textContent).toBe("50");

      // 10. Player restarts
      act(() => {
        resetGameState();
      });
      expect(getByTestId("score").textContent).toBe("0");
      expect(getByTestId("high-score").textContent).toBe("50"); // Preserved
      expect(getByTestId("difficulty").textContent).toBe("hard"); // Preserved
    });
  });
});

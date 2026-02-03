import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";
import { useGameStore } from "@/stores/gameStore";

// Mock Phaser to prevent canvas-related errors in test environment
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

describe("App Component", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.setState({
      score: 0,
      highScore: 0,
      difficulty: "medium",
      gameStatus: "menu",
    });
  });

  it("should render the app with Snake Game title", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Snake Game/i })).toBeDefined();
  });

  it("should have the app header with description", () => {
    render(<App />);

    expect(
      screen.getByText(/A modern Snake game built with React and Phaser/i)
    ).toBeDefined();
  });

  describe("menu state", () => {
    it("should render MainMenu when gameStatus is menu", () => {
      render(<App />);

      expect(screen.getByTestId("main-menu")).toBeInTheDocument();
      expect(screen.queryByTestId("game-canvas")).not.toBeInTheDocument();
    });

    it("should render difficulty selector in MainMenu", () => {
      render(<App />);

      expect(screen.getByTestId("difficulty-selector")).toBeInTheDocument();
      expect(screen.getByTestId("difficulty-easy")).toBeInTheDocument();
      expect(screen.getByTestId("difficulty-medium")).toBeInTheDocument();
      expect(screen.getByTestId("difficulty-hard")).toBeInTheDocument();
    });

    it("should render start game button in MainMenu", () => {
      render(<App />);

      expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
    });
  });

  describe("game state transitions", () => {
    it("should transition to playing state when start game is clicked", () => {
      render(<App />);

      const startButton = screen.getByTestId("start-game-button");
      fireEvent.click(startButton);

      expect(useGameStore.getState().gameStatus).toBe("playing");
    });

    it("should render GameCanvas and GameHUD when playing", () => {
      render(<App />);

      // Start the game
      fireEvent.click(screen.getByTestId("start-game-button"));

      expect(screen.getByTestId("game-canvas")).toBeInTheDocument();
      expect(screen.getByTestId("game-hud")).toBeInTheDocument();
      expect(screen.queryByTestId("main-menu")).not.toBeInTheDocument();
    });

    it("should render game container when playing", () => {
      render(<App />);

      // Start the game
      fireEvent.click(screen.getByTestId("start-game-button"));

      const gameContainer = document.getElementById("game-container");
      expect(gameContainer).toBeDefined();
    });
  });

  describe("difficulty selection integration", () => {
    it("should preserve difficulty selection when starting game", () => {
      render(<App />);

      // Select hard difficulty
      fireEvent.click(screen.getByTestId("difficulty-hard"));
      expect(useGameStore.getState().difficulty).toBe("hard");

      // Start game
      fireEvent.click(screen.getByTestId("start-game-button"));

      // Difficulty should still be hard
      expect(useGameStore.getState().difficulty).toBe("hard");
    });

    it("should display selected difficulty in HUD after starting game", () => {
      render(<App />);

      // Select hard difficulty
      fireEvent.click(screen.getByTestId("difficulty-hard"));

      // Start game
      fireEvent.click(screen.getByTestId("start-game-button"));

      // Check HUD shows Hard difficulty
      expect(screen.getByTestId("difficulty-indicator")).toBeInTheDocument();
      expect(screen.getByText("Hard")).toBeInTheDocument();
    });

    it("should show Normal in HUD for default medium difficulty", () => {
      render(<App />);

      // Start game with default difficulty
      fireEvent.click(screen.getByTestId("start-game-button"));

      expect(screen.getByText("Normal")).toBeInTheDocument();
    });

    it("should show Easy in HUD when easy difficulty is selected", () => {
      render(<App />);

      // Select easy difficulty
      fireEvent.click(screen.getByTestId("difficulty-easy"));

      // Start game
      fireEvent.click(screen.getByTestId("start-game-button"));

      expect(screen.getByText("Easy")).toBeInTheDocument();
    });
  });

  describe("full flow integration", () => {
    it("should complete full flow: select difficulty -> start game -> correct HUD display", () => {
      render(<App />);

      // 1. Should be in menu
      expect(screen.getByTestId("main-menu")).toBeInTheDocument();

      // 2. Select hard difficulty
      fireEvent.click(screen.getByTestId("difficulty-hard"));
      expect(useGameStore.getState().difficulty).toBe("hard");

      // 3. Start game
      fireEvent.click(screen.getByTestId("start-game-button"));

      // 4. Should show game view with HUD
      expect(screen.getByTestId("game-hud")).toBeInTheDocument();
      expect(screen.getByTestId("game-canvas")).toBeInTheDocument();

      // 5. HUD should show correct difficulty
      expect(screen.getByText("Hard")).toBeInTheDocument();

      // 6. HUD should show score and high score displays
      const scoreDisplay = screen.getByTestId("score-display");
      const highScoreDisplay = screen.getByTestId("high-score-display");
      expect(scoreDisplay).toBeInTheDocument();
      expect(highScoreDisplay).toBeInTheDocument();
    });
  });
});

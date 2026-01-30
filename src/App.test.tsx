import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

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
  it("should render the app with Snake Game title", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Snake Game/i })).toBeDefined();
  });

  it("should render the game container element", () => {
    render(<App />);

    const gameContainer = document.getElementById("game-container");
    expect(gameContainer).toBeDefined();
  });

  it("should have the app header with description", () => {
    render(<App />);

    expect(
      screen.getByText(/A modern Snake game built with React and Phaser/i)
    ).toBeDefined();
  });

  it("should render the GameCanvas component", () => {
    render(<App />);

    const gameCanvas = screen.getByTestId("game-canvas");
    expect(gameCanvas).toBeDefined();
  });
});

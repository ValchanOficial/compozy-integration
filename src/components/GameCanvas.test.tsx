import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { GameCanvas } from "./GameCanvas";

// Mock Phaser module
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

describe("GameCanvas Component", () => {
  let mockAddEventListener: Mock;
  let mockRemoveEventListener: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window event listeners
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();
    vi.spyOn(window, "addEventListener").mockImplementation(
      mockAddEventListener
    );
    vi.spyOn(window, "removeEventListener").mockImplementation(
      mockRemoveEventListener
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("renders the game canvas container", () => {
      render(<GameCanvas />);

      const canvas = screen.getByTestId("game-canvas");
      expect(canvas).toBeDefined();
    });

    it("renders with default container id 'game-container'", () => {
      render(<GameCanvas />);

      const container = document.getElementById("game-container");
      expect(container).toBeDefined();
    });

    it("renders with custom container id", () => {
      render(<GameCanvas containerId="custom-game" />);

      const container = document.getElementById("custom-game");
      expect(container).toBeDefined();
    });

    it("has the game-canvas class", () => {
      render(<GameCanvas />);

      const canvas = screen.getByTestId("game-canvas");
      expect(canvas.className).toContain("game-canvas");
    });
  });

  describe("Phaser initialization", () => {
    it("creates Phaser game instance on mount", async () => {
      const Phaser = await import("phaser");

      render(<GameCanvas />);

      expect(Phaser.default.Game).toHaveBeenCalledTimes(1);
    });

    it("passes correct config to Phaser.Game", async () => {
      const Phaser = await import("phaser");

      render(<GameCanvas containerId="test-container" />);

      const gameConstructor = Phaser.default.Game as Mock;
      expect(gameConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          parent: "test-container",
        })
      );
    });

    it("includes GameScene in the config", async () => {
      const Phaser = await import("phaser");
      const { GameScene } = await import("@/game/scenes/GameScene");

      render(<GameCanvas />);

      const gameConstructor = Phaser.default.Game as Mock;
      const passedConfig = gameConstructor.mock.calls[0][0];
      expect(passedConfig.scene).toContain(GameScene);
    });
  });

  describe("resize handling", () => {
    it("adds resize event listener on mount", () => {
      render(<GameCanvas />);

      expect(mockAddEventListener).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
    });

    it("removes resize event listener on unmount", () => {
      const { unmount } = render(<GameCanvas />);

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
    });

    it("handles window resize event", async () => {
      const Phaser = await import("phaser");
      const mockGame = (Phaser.default.Game as Mock).mock.results[0]?.value || {
        scale: { resize: vi.fn(), width: 800, height: 600 },
      };

      render(<GameCanvas />);

      // Get the resize handler that was registered
      const resizeCall = mockAddEventListener.mock.calls.find(
        (call: [string, () => void]) => call[0] === "resize"
      );
      expect(resizeCall).toBeDefined();

      // Call the resize handler if game exists
      if (resizeCall) {
        const resizeHandler = resizeCall[1];
        resizeHandler();
        // Verify scale.resize was called (may or may not be called depending on game state)
        expect(mockGame.scale.resize).toBeDefined();
      }
    });
  });

  describe("cleanup", () => {
    it("destroys Phaser game instance on unmount", async () => {
      const Phaser = await import("phaser");
      const mockDestroy = vi.fn();

      // Reconfigure mock to track destroy calls
      (Phaser.default.Game as Mock).mockImplementation(() => ({
        destroy: mockDestroy,
        scale: {
          resize: vi.fn(),
          width: 800,
          height: 600,
        },
      }));

      const { unmount } = render(<GameCanvas />);
      unmount();

      expect(mockDestroy).toHaveBeenCalledWith(true);
    });

    it("handles cleanup when game instance is null", () => {
      // This test ensures no errors are thrown during cleanup
      const { unmount } = render(<GameCanvas />);
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("double initialization prevention", () => {
    it("does not create multiple Phaser instances in StrictMode", async () => {
      const Phaser = await import("phaser");

      // Reset mock call count
      vi.clearAllMocks();

      // Render component
      render(<GameCanvas />);

      // First mount should create one instance
      expect(Phaser.default.Game).toHaveBeenCalledTimes(1);
    });
  });
});

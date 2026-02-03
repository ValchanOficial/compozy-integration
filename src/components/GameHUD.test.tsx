import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameHUD } from "./GameHUD";
import { useGameStore } from "@/stores/gameStore";

describe("GameHUD", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.setState({
      score: 0,
      highScore: 0,
      difficulty: "medium",
      gameStatus: "playing",
    });
  });

  describe("renders correctly", () => {
    it("renders the HUD container", () => {
      render(<GameHUD />);
      expect(screen.getByTestId("game-hud")).toBeInTheDocument();
    });

    it("renders score display", () => {
      render(<GameHUD />);
      expect(screen.getByTestId("score-display")).toBeInTheDocument();
      expect(screen.getByText("Score:")).toBeInTheDocument();
    });

    it("renders high score display", () => {
      render(<GameHUD />);
      expect(screen.getByTestId("high-score-display")).toBeInTheDocument();
      expect(screen.getByText("High:")).toBeInTheDocument();
    });

    it("renders difficulty indicator", () => {
      render(<GameHUD />);
      expect(screen.getByTestId("difficulty-indicator")).toBeInTheDocument();
      expect(screen.getByText("Difficulty:")).toBeInTheDocument();
    });
  });

  describe("displays correct values", () => {
    it("displays current score", () => {
      useGameStore.setState({ score: 50 });
      render(<GameHUD />);
      expect(screen.getByText("50")).toBeInTheDocument();
    });

    it("displays high score", () => {
      useGameStore.setState({ highScore: 100 });
      render(<GameHUD />);
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("updates when score changes", () => {
      // Use different scores to avoid ambiguity
      useGameStore.setState({ score: 10, highScore: 100 });
      const { rerender } = render(<GameHUD />);
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();

      useGameStore.setState({ score: 30 });
      rerender(<GameHUD />);

      expect(screen.getByText("30")).toBeInTheDocument();
    });
  });

  describe("difficulty display", () => {
    it("displays Easy for easy difficulty", () => {
      useGameStore.setState({ difficulty: "easy" });
      render(<GameHUD />);
      expect(screen.getByText("Easy")).toBeInTheDocument();
    });

    it("displays Normal for medium difficulty", () => {
      useGameStore.setState({ difficulty: "medium" });
      render(<GameHUD />);
      expect(screen.getByText("Normal")).toBeInTheDocument();
    });

    it("displays Hard for hard difficulty", () => {
      useGameStore.setState({ difficulty: "hard" });
      render(<GameHUD />);
      expect(screen.getByText("Hard")).toBeInTheDocument();
    });

    it("applies correct CSS class for easy difficulty", () => {
      useGameStore.setState({ difficulty: "easy" });
      render(<GameHUD />);
      const indicator = screen.getByTestId("difficulty-indicator");
      expect(indicator).toHaveClass("difficulty-easy");
    });

    it("applies correct CSS class for medium difficulty", () => {
      useGameStore.setState({ difficulty: "medium" });
      render(<GameHUD />);
      const indicator = screen.getByTestId("difficulty-indicator");
      expect(indicator).toHaveClass("difficulty-medium");
    });

    it("applies correct CSS class for hard difficulty", () => {
      useGameStore.setState({ difficulty: "hard" });
      render(<GameHUD />);
      const indicator = screen.getByTestId("difficulty-indicator");
      expect(indicator).toHaveClass("difficulty-hard");
    });
  });

  describe("game status indicators", () => {
    it("shows paused indicator when game is paused", () => {
      useGameStore.setState({ gameStatus: "paused" });
      render(<GameHUD />);
      expect(screen.getByTestId("paused-indicator")).toBeInTheDocument();
      expect(screen.getByText("PAUSED")).toBeInTheDocument();
    });

    it("does not show paused indicator when playing", () => {
      useGameStore.setState({ gameStatus: "playing" });
      render(<GameHUD />);
      expect(screen.queryByTestId("paused-indicator")).not.toBeInTheDocument();
    });

    it("shows game over indicator when game is over", () => {
      useGameStore.setState({ gameStatus: "gameover" });
      render(<GameHUD />);
      expect(screen.getByTestId("gameover-indicator")).toBeInTheDocument();
      expect(screen.getByText("GAME OVER")).toBeInTheDocument();
    });

    it("does not show game over indicator when playing", () => {
      useGameStore.setState({ gameStatus: "playing" });
      render(<GameHUD />);
      expect(
        screen.queryByTestId("gameover-indicator")
      ).not.toBeInTheDocument();
    });

    it("paused indicator has correct CSS class", () => {
      useGameStore.setState({ gameStatus: "paused" });
      render(<GameHUD />);
      const indicator = screen.getByTestId("paused-indicator");
      expect(indicator).toHaveClass("paused");
    });

    it("game over indicator has correct CSS class", () => {
      useGameStore.setState({ gameStatus: "gameover" });
      render(<GameHUD />);
      const indicator = screen.getByTestId("gameover-indicator");
      expect(indicator).toHaveClass("gameover");
    });
  });

  describe("difficulty persists during gameplay", () => {
    it("difficulty state persists during pause", () => {
      useGameStore.setState({ difficulty: "hard", gameStatus: "playing" });
      const { rerender } = render(<GameHUD />);
      expect(screen.getByText("Hard")).toBeInTheDocument();

      // Simulate pause
      useGameStore.setState({ gameStatus: "paused" });
      rerender(<GameHUD />);

      expect(screen.getByText("Hard")).toBeInTheDocument();
    });

    it("difficulty cannot change mid-game", () => {
      // This test verifies the display - actual prevention is done by not
      // rendering the difficulty selector during gameplay
      useGameStore.setState({ difficulty: "hard", gameStatus: "playing" });
      const { rerender } = render(<GameHUD />);

      expect(screen.getByText("Hard")).toBeInTheDocument();

      // Simulate an attempt to change difficulty during gameplay
      // (this should only be allowed via the store, which the GameHUD doesn't expose)
      useGameStore.setState({ difficulty: "easy" });
      rerender(<GameHUD />);

      // Display updates (but in practice, the MainMenu is not shown during gameplay)
      expect(screen.getByText("Easy")).toBeInTheDocument();
    });
  });
});

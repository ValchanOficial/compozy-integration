import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MainMenu } from "./MainMenu";
import { useGameStore } from "@/stores/gameStore";

describe("MainMenu", () => {
  const mockOnStartGame = vi.fn();

  beforeEach(() => {
    // Reset store to initial state before each test
    useGameStore.setState({
      score: 0,
      highScore: 0,
      difficulty: "medium",
      gameStatus: "menu",
    });
    mockOnStartGame.mockClear();
  });

  describe("renders correctly", () => {
    it("renders the main menu container", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(screen.getByTestId("main-menu")).toBeInTheDocument();
    });

    it("renders the title", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(screen.getByText("Select Difficulty")).toBeInTheDocument();
    });

    it("renders three difficulty options", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(screen.getByTestId("difficulty-easy")).toBeInTheDocument();
      expect(screen.getByTestId("difficulty-medium")).toBeInTheDocument();
      expect(screen.getByTestId("difficulty-hard")).toBeInTheDocument();
    });

    it("renders difficulty selector container", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(screen.getByTestId("difficulty-selector")).toBeInTheDocument();
    });

    it("renders start game button", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
      expect(screen.getByText("Start Game")).toBeInTheDocument();
    });

    it("renders controls information", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(
        screen.getByText(/Arrow keys or WASD to move/)
      ).toBeInTheDocument();
      expect(screen.getByText(/ESC or P/)).toBeInTheDocument();
    });
  });

  describe("difficulty labels and descriptions", () => {
    it("displays Easy option with correct description", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(screen.getByText("Easy")).toBeInTheDocument();
      expect(screen.getByText("150ms - Relaxed pace")).toBeInTheDocument();
    });

    it("displays Normal option with correct description", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(screen.getByText("Normal")).toBeInTheDocument();
      expect(screen.getByText("100ms - Balanced")).toBeInTheDocument();
    });

    it("displays Hard option with correct description", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(screen.getByText("Hard")).toBeInTheDocument();
      expect(screen.getByText("60ms - Fast & challenging")).toBeInTheDocument();
    });
  });

  describe("difficulty selection", () => {
    it("medium difficulty is selected by default", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      const mediumButton = screen.getByTestId("difficulty-medium");
      expect(mediumButton).toHaveAttribute("aria-pressed", "true");
      expect(mediumButton).toHaveClass("selected");
    });

    it("updates store when selecting easy difficulty", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      const easyButton = screen.getByTestId("difficulty-easy");

      fireEvent.click(easyButton);

      expect(useGameStore.getState().difficulty).toBe("easy");
      expect(easyButton).toHaveAttribute("aria-pressed", "true");
    });

    it("updates store when selecting hard difficulty", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      const hardButton = screen.getByTestId("difficulty-hard");

      fireEvent.click(hardButton);

      expect(useGameStore.getState().difficulty).toBe("hard");
      expect(hardButton).toHaveAttribute("aria-pressed", "true");
    });

    it("removes selected class from previous selection", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);

      const easyButton = screen.getByTestId("difficulty-easy");
      const mediumButton = screen.getByTestId("difficulty-medium");

      // Medium is selected by default
      expect(mediumButton).toHaveClass("selected");
      expect(easyButton).not.toHaveClass("selected");

      // Select easy
      fireEvent.click(easyButton);

      expect(easyButton).toHaveClass("selected");
      expect(mediumButton).not.toHaveClass("selected");
    });

    it("calls setDifficulty when user selects an option", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);

      fireEvent.click(screen.getByTestId("difficulty-easy"));
      expect(useGameStore.getState().difficulty).toBe("easy");

      fireEvent.click(screen.getByTestId("difficulty-medium"));
      expect(useGameStore.getState().difficulty).toBe("medium");

      fireEvent.click(screen.getByTestId("difficulty-hard"));
      expect(useGameStore.getState().difficulty).toBe("hard");
    });
  });

  describe("start game functionality", () => {
    it("calls onStartGame when start button is clicked", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      const startButton = screen.getByTestId("start-game-button");

      fireEvent.click(startButton);

      expect(mockOnStartGame).toHaveBeenCalledTimes(1);
    });

    it("preserves selected difficulty when starting game", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);

      // Select hard difficulty
      fireEvent.click(screen.getByTestId("difficulty-hard"));
      expect(useGameStore.getState().difficulty).toBe("hard");

      // Start game
      fireEvent.click(screen.getByTestId("start-game-button"));

      // Difficulty should still be hard
      expect(useGameStore.getState().difficulty).toBe("hard");
    });
  });

  describe("accessibility", () => {
    it("buttons have aria-pressed attribute", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);
      const buttons = [
        screen.getByTestId("difficulty-easy"),
        screen.getByTestId("difficulty-medium"),
        screen.getByTestId("difficulty-hard"),
      ];

      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-pressed");
      });
    });

    it("only selected button has aria-pressed=true", () => {
      render(<MainMenu onStartGame={mockOnStartGame} />);

      // Default is medium
      expect(screen.getByTestId("difficulty-easy")).toHaveAttribute(
        "aria-pressed",
        "false"
      );
      expect(screen.getByTestId("difficulty-medium")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByTestId("difficulty-hard")).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });
  });

  describe("edge cases", () => {
    it("handles default difficulty when none selected", () => {
      // Default should be medium
      render(<MainMenu onStartGame={mockOnStartGame} />);
      expect(useGameStore.getState().difficulty).toBe("medium");
    });

    it("difficulty state persists across component re-renders", () => {
      const { rerender } = render(<MainMenu onStartGame={mockOnStartGame} />);

      // Select hard
      fireEvent.click(screen.getByTestId("difficulty-hard"));
      expect(useGameStore.getState().difficulty).toBe("hard");

      // Re-render
      rerender(<MainMenu onStartGame={mockOnStartGame} />);

      // Should still be hard
      expect(useGameStore.getState().difficulty).toBe("hard");
      expect(screen.getByTestId("difficulty-hard")).toHaveClass("selected");
    });
  });
});

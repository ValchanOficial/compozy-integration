import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Leaderboard } from "./Leaderboard";
import * as useLeaderboardModule from "@/hooks/useLeaderboard";
import * as gameStoreModule from "@/stores/gameStore";
import * as supabaseModule from "@/services/supabase";
import type { LeaderboardEntry, Difficulty } from "@/types";
import type {
  LeaderboardState,
  LeaderboardActions,
} from "@/hooks/useLeaderboard";

// Mock the hooks and services
vi.mock("@/hooks/useLeaderboard");
vi.mock("@/stores/gameStore");
vi.mock("@/services/supabase");

describe("Leaderboard", () => {
  const mockEntries: LeaderboardEntry[] = [
    {
      id: "entry-1",
      user_id: "user-1",
      username: "TopPlayer",
      score: 1000,
      difficulty: "hard",
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "entry-2",
      user_id: "user-2",
      username: "SecondPlace",
      score: 800,
      difficulty: "medium",
      created_at: "2024-01-15T09:00:00Z",
    },
    {
      id: "entry-3",
      user_id: "user-3",
      username: "ThirdPlace",
      score: 600,
      difficulty: "easy",
      created_at: "2024-01-15T08:00:00Z",
    },
  ];

  const mockSetDifficulty = vi.fn();
  const mockRefresh = vi.fn();
  const mockSubmitNewScore = vi.fn();

  const defaultState: LeaderboardState = {
    entries: mockEntries,
    isLoading: false,
    error: null,
    selectedDifficulty: null,
  };

  const defaultActions: LeaderboardActions = {
    setDifficulty: mockSetDifficulty,
    refresh: mockRefresh,
    submitNewScore: mockSubmitNewScore,
  };

  const setupMocks = (
    state: Partial<LeaderboardState> = {},
    gameState: { score: number; difficulty: Difficulty; gameStatus: string } = {
      score: 100,
      difficulty: "medium",
      gameStatus: "menu",
    }
  ): void => {
    vi.mocked(useLeaderboardModule.useLeaderboard).mockReturnValue([
      { ...defaultState, ...state },
      defaultActions,
    ]);

    vi.mocked(gameStoreModule.useGameStore).mockImplementation((selector) => {
      const state = {
        score: gameState.score,
        difficulty: gameState.difficulty,
        gameStatus: gameState.gameStatus,
      };
      return selector(
        state as ReturnType<typeof gameStoreModule.useGameStore.getState>
      );
    });

    vi.mocked(supabaseModule.getUser).mockResolvedValue({
      user: {
        id: "user-123",
        email: "test@example.com",
      } as unknown as import("@supabase/supabase-js").User,
      error: null,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  describe("rendering", () => {
    it("renders the leaderboard component", () => {
      render(<Leaderboard />);

      expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
      expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    });

    it("renders difficulty filter tabs", () => {
      render(<Leaderboard />);

      expect(screen.getByTestId("leaderboard-filters")).toBeInTheDocument();
      expect(screen.getByTestId("filter-all")).toBeInTheDocument();
      expect(screen.getByTestId("filter-easy")).toBeInTheDocument();
      expect(screen.getByTestId("filter-medium")).toBeInTheDocument();
      expect(screen.getByTestId("filter-hard")).toBeInTheDocument();
    });

    it("renders leaderboard table with entries", () => {
      render(<Leaderboard />);

      expect(screen.getByTestId("leaderboard-table")).toBeInTheDocument();
      expect(screen.getByText("TopPlayer")).toBeInTheDocument();
      expect(screen.getByText("SecondPlace")).toBeInTheDocument();
      expect(screen.getByText("ThirdPlace")).toBeInTheDocument();
    });

    it("renders scores formatted with locale string", () => {
      render(<Leaderboard />);

      expect(screen.getByText("1,000")).toBeInTheDocument();
      expect(screen.getByText("800")).toBeInTheDocument();
      expect(screen.getByText("600")).toBeInTheDocument();
    });

    it("renders difficulty badges for each entry", () => {
      render(<Leaderboard />);

      // Use getAllByText since filter buttons also have the same text
      expect(screen.getAllByText("Hard").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Normal").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Easy").length).toBeGreaterThan(0);

      // Verify difficulty badges exist in the table
      const table = screen.getByTestId("leaderboard-table");
      expect(
        table.querySelector(".difficulty-badge.difficulty-hard")
      ).toBeInTheDocument();
      expect(
        table.querySelector(".difficulty-badge.difficulty-medium")
      ).toBeInTheDocument();
      expect(
        table.querySelector(".difficulty-badge.difficulty-easy")
      ).toBeInTheDocument();
    });

    it("renders return button when onReturnToMenu provided", () => {
      const onReturnToMenu = vi.fn();
      render(<Leaderboard onReturnToMenu={onReturnToMenu} />);

      expect(screen.getByTestId("return-to-menu-button")).toBeInTheDocument();
      expect(screen.getByText("Return to Menu")).toBeInTheDocument();
    });

    it("does not render return button when onReturnToMenu not provided", () => {
      render(<Leaderboard />);

      expect(
        screen.queryByTestId("return-to-menu-button")
      ).not.toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loading spinner when loading and no entries", () => {
      setupMocks({ isLoading: true, entries: [] });
      render(<Leaderboard />);

      expect(screen.getByTestId("leaderboard-loading")).toBeInTheDocument();
      expect(screen.getByText("Loading scores...")).toBeInTheDocument();
    });

    it("does not show loading spinner when loading but has entries", () => {
      setupMocks({ isLoading: true, entries: mockEntries });
      render(<Leaderboard />);

      expect(
        screen.queryByTestId("leaderboard-loading")
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("leaderboard-table")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when error occurs", () => {
      setupMocks({ error: "Failed to fetch leaderboard", entries: [] });
      render(<Leaderboard />);

      expect(screen.getByTestId("leaderboard-error")).toBeInTheDocument();
      expect(
        screen.getByText("Failed to fetch leaderboard")
      ).toBeInTheDocument();
    });

    it("does not show error when loading", () => {
      setupMocks({ error: "Error", isLoading: true, entries: [] });
      render(<Leaderboard />);

      expect(screen.queryByTestId("leaderboard-error")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no entries", () => {
      setupMocks({ entries: [] });
      render(<Leaderboard />);

      expect(screen.getByTestId("leaderboard-empty")).toBeInTheDocument();
      expect(
        screen.getByText("No scores yet. Be the first to play!")
      ).toBeInTheDocument();
    });

    it("does not show empty state when loading", () => {
      setupMocks({ entries: [], isLoading: true });
      render(<Leaderboard />);

      expect(screen.queryByTestId("leaderboard-empty")).not.toBeInTheDocument();
    });

    it("does not show empty state when error", () => {
      setupMocks({ entries: [], error: "Error" });
      render(<Leaderboard />);

      expect(screen.queryByTestId("leaderboard-empty")).not.toBeInTheDocument();
    });
  });

  describe("difficulty filter", () => {
    it("calls setDifficulty when filter button is clicked", () => {
      render(<Leaderboard />);

      fireEvent.click(screen.getByTestId("filter-easy"));

      expect(mockSetDifficulty).toHaveBeenCalledWith("easy");
    });

    it("calls setDifficulty with null for all filter", () => {
      setupMocks({ selectedDifficulty: "easy" });
      render(<Leaderboard />);

      fireEvent.click(screen.getByTestId("filter-all"));

      expect(mockSetDifficulty).toHaveBeenCalledWith(null);
    });

    it("highlights selected difficulty filter", () => {
      setupMocks({ selectedDifficulty: "hard" });
      render(<Leaderboard />);

      const hardButton = screen.getByTestId("filter-hard");
      expect(hardButton).toHaveClass("selected");
      expect(hardButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("player rank highlighting", () => {
    it("highlights current player row when currentUserId matches", () => {
      render(<Leaderboard currentUserId="user-2" />);

      const playerRow = screen.getByTestId("leaderboard-row-1");
      expect(playerRow).toHaveClass("current-player");
    });

    it("shows 'You' badge for current player", () => {
      render(<Leaderboard currentUserId="user-2" />);

      expect(screen.getByTestId("you-badge")).toBeInTheDocument();
      expect(screen.getByText("You")).toBeInTheDocument();
    });

    it("shows player rank when currentUserId is in leaderboard", () => {
      render(<Leaderboard currentUserId="user-2" />);

      expect(screen.getByTestId("player-rank")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
    });

    it("does not show player rank when currentUserId is not in leaderboard", () => {
      render(<Leaderboard currentUserId="user-not-in-list" />);

      expect(screen.queryByTestId("player-rank")).not.toBeInTheDocument();
    });

    it("does not show player rank when no currentUserId provided", () => {
      render(<Leaderboard />);

      expect(screen.queryByTestId("player-rank")).not.toBeInTheDocument();
    });
  });

  describe("score submission", () => {
    it("shows submission form on game over with score > 0", () => {
      setupMocks(
        {},
        { score: 150, difficulty: "medium", gameStatus: "gameover" }
      );
      render(<Leaderboard />);

      expect(screen.getByTestId("score-submission")).toBeInTheDocument();
      expect(screen.getByTestId("nickname-input")).toBeInTheDocument();
      expect(screen.getByTestId("submit-score-button")).toBeInTheDocument();
    });

    it("does not show submission form when not game over", () => {
      setupMocks(
        {},
        { score: 150, difficulty: "medium", gameStatus: "playing" }
      );
      render(<Leaderboard />);

      expect(screen.queryByTestId("score-submission")).not.toBeInTheDocument();
    });

    it("does not show submission form when score is 0", () => {
      setupMocks(
        {},
        { score: 0, difficulty: "medium", gameStatus: "gameover" }
      );
      render(<Leaderboard />);

      expect(screen.queryByTestId("score-submission")).not.toBeInTheDocument();
    });

    it("displays current score and difficulty in submission form", () => {
      setupMocks(
        {},
        { score: 250, difficulty: "hard", gameStatus: "gameover" }
      );
      render(<Leaderboard />);

      expect(screen.getByText("Score: 250")).toBeInTheDocument();
      expect(screen.getByText("Difficulty: Hard")).toBeInTheDocument();
    });

    it("disables submit button when nickname is empty", () => {
      setupMocks(
        {},
        { score: 100, difficulty: "easy", gameStatus: "gameover" }
      );
      render(<Leaderboard />);

      const submitButton = screen.getByTestId("submit-score-button");
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when nickname is entered", () => {
      setupMocks(
        {},
        { score: 100, difficulty: "easy", gameStatus: "gameover" }
      );
      render(<Leaderboard />);

      const nicknameInput = screen.getByTestId("nickname-input");
      fireEvent.change(nicknameInput, { target: { value: "TestPlayer" } });

      const submitButton = screen.getByTestId("submit-score-button");
      expect(submitButton).not.toBeDisabled();
    });

    it("submits score when form is submitted", async () => {
      setupMocks(
        {},
        { score: 100, difficulty: "easy", gameStatus: "gameover" }
      );
      mockSubmitNewScore.mockResolvedValue({
        data: mockEntries[0],
        error: null,
      });

      render(<Leaderboard />);

      const nicknameInput = screen.getByTestId("nickname-input");
      fireEvent.change(nicknameInput, { target: { value: "TestPlayer" } });

      const submitButton = screen.getByTestId("submit-score-button");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSubmitNewScore).toHaveBeenCalledWith({
          username: "TestPlayer",
          score: 100,
          difficulty: "easy",
        });
      });
    });

    it("shows success message after successful submission", async () => {
      setupMocks(
        {},
        { score: 100, difficulty: "easy", gameStatus: "gameover" }
      );
      mockSubmitNewScore.mockResolvedValue({
        data: mockEntries[0],
        error: null,
      });

      render(<Leaderboard />);

      const nicknameInput = screen.getByTestId("nickname-input");
      fireEvent.change(nicknameInput, { target: { value: "TestPlayer" } });

      const submitButton = screen.getByTestId("submit-score-button");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("submission-success")).toBeInTheDocument();
        expect(
          screen.getByText("Score submitted successfully!")
        ).toBeInTheDocument();
      });
    });

    it("shows error message when submission fails", async () => {
      setupMocks(
        {},
        { score: 100, difficulty: "easy", gameStatus: "gameover" }
      );
      mockSubmitNewScore.mockResolvedValue({
        data: null,
        error: "Submission failed",
      });

      render(<Leaderboard />);

      const nicknameInput = screen.getByTestId("nickname-input");
      fireEvent.change(nicknameInput, { target: { value: "TestPlayer" } });

      const submitButton = screen.getByTestId("submit-score-button");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("submission-error")).toBeInTheDocument();
        expect(screen.getByText("Submission failed")).toBeInTheDocument();
      });
    });

    it("disables submit button when nickname is whitespace only", async () => {
      setupMocks(
        {},
        { score: 100, difficulty: "easy", gameStatus: "gameover" }
      );

      render(<Leaderboard />);

      // Type and then change to whitespace
      const nicknameInput = screen.getByTestId("nickname-input");
      fireEvent.change(nicknameInput, { target: { value: "Test" } });
      fireEvent.change(nicknameInput, { target: { value: "   " } });

      const submitButton = screen.getByTestId("submit-score-button");
      expect(submitButton).toBeDisabled();
    });

    it("shows error when user is not authenticated", async () => {
      setupMocks(
        {},
        { score: 100, difficulty: "easy", gameStatus: "gameover" }
      );
      vi.mocked(supabaseModule.getUser).mockResolvedValue({
        user: null,
        error: null,
      });

      render(<Leaderboard />);

      const nicknameInput = screen.getByTestId("nickname-input");
      fireEvent.change(nicknameInput, { target: { value: "TestPlayer" } });

      const submitButton = screen.getByTestId("submit-score-button");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("submission-error")).toBeInTheDocument();
        expect(
          screen.getByText("Please log in to submit scores to the leaderboard")
        ).toBeInTheDocument();
      });
    });

    it("hides submission form after successful submission", async () => {
      setupMocks(
        {},
        { score: 100, difficulty: "easy", gameStatus: "gameover" }
      );
      mockSubmitNewScore.mockResolvedValue({
        data: mockEntries[0],
        error: null,
      });

      render(<Leaderboard />);

      const nicknameInput = screen.getByTestId("nickname-input");
      fireEvent.change(nicknameInput, { target: { value: "TestPlayer" } });

      const submitButton = screen.getByTestId("submit-score-button");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByTestId("score-submission")
        ).not.toBeInTheDocument();
      });
    });

    it("clears error when nickname changes", async () => {
      setupMocks(
        {},
        { score: 100, difficulty: "easy", gameStatus: "gameover" }
      );
      // Mock submission failure to get an error
      mockSubmitNewScore.mockResolvedValue({
        data: null,
        error: "Submission failed",
      });

      render(<Leaderboard />);

      const nicknameInput = screen.getByTestId("nickname-input");
      // Type valid input and submit to get error from service
      fireEvent.change(nicknameInput, { target: { value: "TestPlayer" } });
      fireEvent.click(screen.getByTestId("submit-score-button"));

      await waitFor(() => {
        expect(screen.getByTestId("submission-error")).toBeInTheDocument();
      });

      // Now type new input - error should be cleared
      fireEvent.change(nicknameInput, { target: { value: "NewPlayer" } });

      await waitFor(() => {
        expect(
          screen.queryByTestId("submission-error")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("return to menu", () => {
    it("calls onReturnToMenu when return button is clicked", () => {
      const onReturnToMenu = vi.fn();
      render(<Leaderboard onReturnToMenu={onReturnToMenu} />);

      fireEvent.click(screen.getByTestId("return-to-menu-button"));

      expect(onReturnToMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe("rank badges", () => {
    it("shows gold badge for rank 1", () => {
      render(<Leaderboard />);

      const firstRow = screen.getByTestId("leaderboard-row-0");
      const rankBadge = firstRow.querySelector(".rank-1");
      expect(rankBadge).toBeInTheDocument();
    });

    it("shows silver badge for rank 2", () => {
      render(<Leaderboard />);

      const secondRow = screen.getByTestId("leaderboard-row-1");
      const rankBadge = secondRow.querySelector(".rank-2");
      expect(rankBadge).toBeInTheDocument();
    });

    it("shows bronze badge for rank 3", () => {
      render(<Leaderboard />);

      const thirdRow = screen.getByTestId("leaderboard-row-2");
      const rankBadge = thirdRow.querySelector(".rank-3");
      expect(rankBadge).toBeInTheDocument();
    });
  });

  describe("date formatting", () => {
    it("formats dates correctly", () => {
      render(<Leaderboard />);

      // The formatDate function should format dates like "Jan 15, 2024"
      // The exact format depends on locale, so we check for parts
      expect(screen.getAllByText(/Jan/i).length).toBeGreaterThan(0);
    });
  });

  describe("accessibility", () => {
    it("has proper aria-pressed on filter buttons", () => {
      setupMocks({ selectedDifficulty: "medium" });
      render(<Leaderboard />);

      expect(screen.getByTestId("filter-medium")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      expect(screen.getByTestId("filter-all")).toHaveAttribute(
        "aria-pressed",
        "false"
      );
    });

    it("has proper table structure", () => {
      render(<Leaderboard />);

      const table = screen.getByTestId("leaderboard-table");
      expect(table.tagName).toBe("TABLE");
      expect(table.querySelector("thead")).toBeInTheDocument();
      expect(table.querySelector("tbody")).toBeInTheDocument();
    });
  });
});

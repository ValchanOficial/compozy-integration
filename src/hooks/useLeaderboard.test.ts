import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLeaderboard } from "./useLeaderboard";
import * as leaderboardService from "@/services/leaderboard";
import type { LeaderboardEntry } from "@/types";

// Mock the leaderboard service
vi.mock("@/services/leaderboard", () => ({
  getTopScores: vi.fn(),
  getScoresByDifficulty: vi.fn(),
  submitScore: vi.fn(),
}));

describe("useLeaderboard", () => {
  const mockEntries: LeaderboardEntry[] = [
    {
      id: "entry-1",
      user_id: "user-1",
      username: "player1",
      score: 500,
      difficulty: "hard",
      created_at: "2024-01-15T10:00:00Z",
    },
    {
      id: "entry-2",
      user_id: "user-2",
      username: "player2",
      score: 400,
      difficulty: "medium",
      created_at: "2024-01-15T09:00:00Z",
    },
    {
      id: "entry-3",
      user_id: "user-3",
      username: "player3",
      score: 300,
      difficulty: "easy",
      created_at: "2024-01-15T08:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial state", () => {
    it("returns loading state initially", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      const { result } = renderHook(() => useLeaderboard());

      expect(result.current[0].isLoading).toBe(true);
      expect(result.current[0].entries).toEqual([]);
      expect(result.current[0].error).toBeNull();
      expect(result.current[0].selectedDifficulty).toBeNull();

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });
    });

    it("uses initialDifficulty option when provided", async () => {
      vi.mocked(leaderboardService.getScoresByDifficulty).mockResolvedValue({
        data: mockEntries.filter((e) => e.difficulty === "hard"),
        error: null,
      });

      const { result } = renderHook(() =>
        useLeaderboard({ initialDifficulty: "hard" })
      );

      expect(result.current[0].selectedDifficulty).toBe("hard");

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });
    });
  });

  describe("data fetching", () => {
    it("fetches all scores when no difficulty filter is set", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(1);
      expect(result.current[0].entries).toEqual(mockEntries);
      expect(result.current[0].error).toBeNull();
    });

    it("fetches filtered scores when difficulty is selected", async () => {
      const hardScores = mockEntries.filter((e) => e.difficulty === "hard");
      vi.mocked(leaderboardService.getScoresByDifficulty).mockResolvedValue({
        data: hardScores,
        error: null,
      });

      const { result } = renderHook(() =>
        useLeaderboard({ initialDifficulty: "hard" })
      );

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      expect(leaderboardService.getScoresByDifficulty).toHaveBeenCalledWith(
        "hard"
      );
      expect(result.current[0].entries).toEqual(hardScores);
    });

    it("handles fetch errors gracefully", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: null,
        error: "Network error",
      });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      expect(result.current[0].error).toBe("Network error");
      expect(result.current[0].entries).toEqual([]);
    });

    it("handles exceptions during fetch", async () => {
      vi.mocked(leaderboardService.getTopScores).mockRejectedValue(
        new Error("Connection failed")
      );

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      expect(result.current[0].error).toBe("Connection failed");
      expect(result.current[0].entries).toEqual([]);
    });

    it("handles non-Error exceptions", async () => {
      vi.mocked(leaderboardService.getTopScores).mockRejectedValue(
        "Unknown error"
      );

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      expect(result.current[0].error).toBe("Failed to fetch leaderboard");
    });
  });

  describe("setDifficulty action", () => {
    it("updates selectedDifficulty when called", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });
      vi.mocked(leaderboardService.getScoresByDifficulty).mockResolvedValue({
        data: mockEntries.filter((e) => e.difficulty === "easy"),
        error: null,
      });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      act(() => {
        result.current[1].setDifficulty("easy");
      });

      expect(result.current[0].selectedDifficulty).toBe("easy");
    });

    it("refetches data when difficulty changes", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });
      const mediumScores = mockEntries.filter((e) => e.difficulty === "medium");
      vi.mocked(leaderboardService.getScoresByDifficulty).mockResolvedValue({
        data: mediumScores,
        error: null,
      });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      act(() => {
        result.current[1].setDifficulty("medium");
      });

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      expect(leaderboardService.getScoresByDifficulty).toHaveBeenCalledWith(
        "medium"
      );
      expect(result.current[0].entries).toEqual(mediumScores);
    });

    it("clears difficulty filter when set to null", async () => {
      vi.mocked(leaderboardService.getScoresByDifficulty).mockResolvedValue({
        data: mockEntries.filter((e) => e.difficulty === "hard"),
        error: null,
      });
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      const { result } = renderHook(() =>
        useLeaderboard({ initialDifficulty: "hard" })
      );

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      act(() => {
        result.current[1].setDifficulty(null);
      });

      await waitFor(() => {
        expect(leaderboardService.getTopScores).toHaveBeenCalled();
      });
    });
  });

  describe("refresh action", () => {
    it("refetches data when called", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current[1].refresh();
      });

      expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(2);
    });
  });

  describe("submitNewScore action", () => {
    it("submits score and refreshes data on success", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      const newEntry: LeaderboardEntry = {
        id: "new-entry",
        user_id: "user-4",
        username: "newplayer",
        score: 600,
        difficulty: "hard",
        created_at: "2024-01-15T11:00:00Z",
      };

      vi.mocked(leaderboardService.submitScore).mockResolvedValue({
        data: newEntry,
        error: null,
      });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      const submitResult = await act(async () => {
        return result.current[1].submitNewScore({
          username: "newplayer",
          score: 600,
          difficulty: "hard",
        });
      });

      expect(submitResult.data).toEqual(newEntry);
      expect(submitResult.error).toBeNull();
      expect(leaderboardService.submitScore).toHaveBeenCalledWith({
        username: "newplayer",
        score: 600,
        difficulty: "hard",
      });
    });

    it("returns error on submission failure", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });
      vi.mocked(leaderboardService.submitScore).mockResolvedValue({
        data: null,
        error: "Submission failed",
      });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      const submitResult = await act(async () => {
        return result.current[1].submitNewScore({
          username: "player",
          score: 100,
          difficulty: "easy",
        });
      });

      expect(submitResult.error).toBe("Submission failed");
      expect(submitResult.data).toBeNull();
    });

    it("does not refresh on submission error", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });
      vi.mocked(leaderboardService.submitScore).mockResolvedValue({
        data: null,
        error: "Failed",
      });

      const { result } = renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(result.current[0].isLoading).toBe(false);
      });

      const initialCallCount = vi.mocked(leaderboardService.getTopScores).mock
        .calls.length;

      await act(async () => {
        await result.current[1].submitNewScore({
          username: "player",
          score: 100,
          difficulty: "easy",
        });
      });

      // Should not have called getTopScores again after failed submission
      expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(
        initialCallCount
      );
    });
  });

  describe("polling", () => {
    it("polls for new data at specified interval", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      renderHook(() =>
        useLeaderboard({ pollingInterval: 5000, enablePolling: true })
      );

      await waitFor(() => {
        expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(1);
      });

      // Advance timer by polling interval
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(2);
      });

      // Advance again
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(3);
      });
    });

    it("does not poll when enablePolling is false", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      renderHook(() => useLeaderboard({ enablePolling: false }));

      await waitFor(() => {
        expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(1);
      });

      await act(async () => {
        vi.advanceTimersByTime(15000);
      });

      // Should still be 1 call (initial fetch only)
      expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(1);
    });

    it("uses default polling interval of 12 seconds", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      renderHook(() => useLeaderboard());

      await waitFor(() => {
        expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(1);
      });

      // Advance by 11 seconds - should not poll yet
      await act(async () => {
        vi.advanceTimersByTime(11000);
      });

      expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(1);

      // Advance by 1 more second (total 12s) - should poll now
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(2);
      });
    });

    it("cleans up polling interval on unmount", async () => {
      vi.mocked(leaderboardService.getTopScores).mockResolvedValue({
        data: mockEntries,
        error: null,
      });

      const { unmount } = renderHook(() =>
        useLeaderboard({ pollingInterval: 5000 })
      );

      await waitFor(() => {
        expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(1);
      });

      unmount();

      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      // Should still be 1 call since polling was stopped on unmount
      expect(leaderboardService.getTopScores).toHaveBeenCalledTimes(1);
    });
  });

  describe("unmount behavior", () => {
    it("does not update state after unmount", async () => {
      let resolvePromise: (value: {
        data: LeaderboardEntry[];
        error: null;
      }) => void;
      const delayedPromise = new Promise<{
        data: LeaderboardEntry[];
        error: null;
      }>((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(leaderboardService.getTopScores).mockReturnValue(
        delayedPromise
      );

      const { unmount } = renderHook(() =>
        useLeaderboard({ enablePolling: false })
      );

      // Unmount before promise resolves
      unmount();

      // Resolve the promise after unmount
      await act(async () => {
        resolvePromise!({ data: mockEntries, error: null });
      });

      // No error should be thrown - state update should be prevented
    });
  });
});

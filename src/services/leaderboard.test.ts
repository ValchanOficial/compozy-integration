import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  getTopScores,
  getScoresByDifficulty,
  getUserScores,
  submitScore,
} from "./leaderboard";
import type { LeaderboardEntry } from "@/types";

// Get the mocked createClient
const mockCreateClient = createClient as Mock;

describe("leaderboard service", () => {
  let mockFrom: Mock;
  let mockSelect: Mock;
  let mockInsert: Mock;
  let mockEq: Mock;
  let mockOrder: Mock;
  let mockLimit: Mock;
  let mockSingle: Mock;
  let mockAuth: {
    getUser: Mock;
  };

  const sampleEntries: LeaderboardEntry[] = [
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
      user_id: "user-1",
      username: "player1",
      score: 300,
      difficulty: "easy",
      created_at: "2024-01-15T08:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Get references to mocks from the mocked client
    const mockClient = mockCreateClient();
    mockAuth = mockClient.auth;

    // Create chainable mocks
    mockLimit = vi.fn();
    mockOrder = vi.fn(() => ({ limit: mockLimit }));
    mockEq = vi.fn(() => ({ order: mockOrder, limit: mockLimit }));
    mockSingle = vi.fn();
    mockSelect = vi.fn(() => ({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    }));
    mockInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: mockSingle,
      })),
    }));
    mockFrom = vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
    }));

    // Override the from method on the client
    mockClient.from = mockFrom;
  });

  describe("getTopScores", () => {
    it("fetches top 100 scores ordered by score descending", async () => {
      mockLimit.mockResolvedValue({
        data: sampleEntries,
        error: null,
      });

      const result = await getTopScores();

      expect(result.data).toEqual(sampleEntries);
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith("leaderboard");
      expect(mockSelect).toHaveBeenCalledWith(
        "id, user_id, username, score, difficulty, created_at"
      );
      expect(mockOrder).toHaveBeenCalledWith("score", { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(100);
    });

    it("respects custom limit parameter", async () => {
      mockLimit.mockResolvedValue({
        data: sampleEntries.slice(0, 2),
        error: null,
      });

      const result = await getTopScores(10);

      expect(result.data).toHaveLength(2);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it("returns empty array when no scores exist", async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getTopScores();

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("returns error on database failure", async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      const result = await getTopScores();

      expect(result.data).toBeNull();
      expect(result.error).toBe("Database connection failed");
    });

    it("handles network errors gracefully", async () => {
      mockLimit.mockRejectedValue(new Error("Network error"));

      const result = await getTopScores();

      expect(result.data).toBeNull();
      expect(result.error).toBe("Network error");
    });

    it("handles non-Error exceptions", async () => {
      mockLimit.mockRejectedValue("Unknown error");

      const result = await getTopScores();

      expect(result.error).toBe("Failed to fetch top scores");
    });
  });

  describe("getScoresByDifficulty", () => {
    it("filters scores by difficulty parameter", async () => {
      const hardScores = sampleEntries.filter((e) => e.difficulty === "hard");
      mockLimit.mockResolvedValue({
        data: hardScores,
        error: null,
      });

      const result = await getScoresByDifficulty("hard");

      expect(result.data).toEqual(hardScores);
      expect(result.error).toBeNull();
      expect(mockEq).toHaveBeenCalledWith("difficulty", "hard");
    });

    it("returns error for invalid difficulty value", async () => {
      // @ts-expect-error Testing invalid input
      const result = await getScoresByDifficulty("invalid");

      expect(result.data).toBeNull();
      expect(result.error).toContain("Invalid difficulty");
    });

    it("applies limit to filtered results", async () => {
      mockLimit.mockResolvedValue({
        data: sampleEntries,
        error: null,
      });

      await getScoresByDifficulty("easy", 50);

      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it("returns empty array when no scores for difficulty", async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getScoresByDifficulty("easy");

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("handles database errors", async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await getScoresByDifficulty("medium");

      expect(result.error).toBe("Query failed");
    });

    it("handles network errors gracefully", async () => {
      mockLimit.mockRejectedValue(new Error("Network error"));

      const result = await getScoresByDifficulty("hard");

      expect(result.error).toBe("Network error");
    });

    it("handles non-Error exceptions", async () => {
      mockLimit.mockRejectedValue("Unknown error");

      const result = await getScoresByDifficulty("easy");

      expect(result.error).toBe("Failed to fetch scores by difficulty");
    });
  });

  describe("getUserScores", () => {
    it("fetches all scores for specific user_id", async () => {
      const userScores = sampleEntries.filter((e) => e.user_id === "user-1");
      mockLimit.mockResolvedValue({
        data: userScores,
        error: null,
      });

      const result = await getUserScores("user-1");

      expect(result.data).toEqual(userScores);
      expect(result.error).toBeNull();
      expect(mockEq).toHaveBeenCalledWith("user_id", "user-1");
    });

    it("returns error for invalid user_id", async () => {
      const result = await getUserScores("");

      expect(result.data).toBeNull();
      expect(result.error).toBe("Invalid user ID");
    });

    it("returns empty array when user has no scores", async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getUserScores("user-with-no-scores");

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("applies limit to user scores", async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      await getUserScores("user-1", 25);

      expect(mockLimit).toHaveBeenCalledWith(25);
    });

    it("handles database errors", async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await getUserScores("user-1");

      expect(result.error).toBe("Query failed");
    });

    it("handles network errors gracefully", async () => {
      mockLimit.mockRejectedValue(new Error("Network error"));

      const result = await getUserScores("user-1");

      expect(result.error).toBe("Network error");
    });

    it("handles non-Error exceptions", async () => {
      mockLimit.mockRejectedValue("Unknown error");

      const result = await getUserScores("user-1");

      expect(result.error).toBe("Failed to fetch user scores");
    });
  });

  describe("submitScore", () => {
    beforeEach(() => {
      // Setup default authenticated user
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });
    });

    it("inserts new score with user_id, username, score, difficulty", async () => {
      const newEntry: LeaderboardEntry = {
        id: "new-entry",
        user_id: "user-123",
        username: "testplayer",
        score: 250,
        difficulty: "medium",
        created_at: "2024-01-15T10:00:00Z",
      };

      mockSingle.mockResolvedValue({
        data: newEntry,
        error: null,
      });

      const result = await submitScore({
        username: "testplayer",
        score: 250,
        difficulty: "medium",
      });

      expect(result.data).toEqual(newEntry);
      expect(result.error).toBeNull();
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        username: "testplayer",
        score: 250,
        difficulty: "medium",
      });
    });

    it("trims whitespace from username", async () => {
      mockSingle.mockResolvedValue({
        data: { ...sampleEntries[0], username: "trimmed" },
        error: null,
      });

      await submitScore({
        username: "  trimmed  ",
        score: 100,
        difficulty: "easy",
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ username: "trimmed" })
      );
    });

    it("returns error for unauthorized score submission (guest users)", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await submitScore({
        username: "guest",
        score: 100,
        difficulty: "easy",
      });

      expect(result.data).toBeNull();
      expect(result.error).toBe("Authentication required to submit scores");
    });

    it("returns error when user is null", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await submitScore({
        username: "player",
        score: 100,
        difficulty: "easy",
      });

      expect(result.error).toBe("Authentication required to submit scores");
    });

    it("returns error for invalid difficulty values", async () => {
      const result = await submitScore({
        username: "player",
        score: 100,
        // @ts-expect-error Testing invalid input
        difficulty: "extreme",
      });

      expect(result.data).toBeNull();
      expect(result.error).toContain("Invalid difficulty");
    });

    it("returns error for empty username", async () => {
      const result = await submitScore({
        username: "",
        score: 100,
        difficulty: "easy",
      });

      expect(result.error).toBe("Username is required");
    });

    it("returns error for invalid score values", async () => {
      const invalidScores = [-1, NaN, Infinity, -Infinity];

      for (const score of invalidScores) {
        const result = await submitScore({
          username: "player",
          score,
          difficulty: "easy",
        });

        expect(result.error).toBe("Invalid score value");
      }
    });

    it("handles database errors during insert", async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Insert failed: RLS policy violation" },
      });

      const result = await submitScore({
        username: "player",
        score: 100,
        difficulty: "easy",
      });

      expect(result.error).toBe("Insert failed: RLS policy violation");
    });

    it("handles network errors gracefully", async () => {
      mockSingle.mockRejectedValue(new Error("Network error"));

      const result = await submitScore({
        username: "player",
        score: 100,
        difficulty: "easy",
      });

      expect(result.error).toBe("Network error");
    });

    it("handles non-Error exceptions", async () => {
      mockSingle.mockRejectedValue("Unknown error");

      const result = await submitScore({
        username: "player",
        score: 100,
        difficulty: "easy",
      });

      expect(result.error).toBe("Failed to submit score");
    });

    it("validates all difficulty levels", async () => {
      const difficulties = ["easy", "medium", "hard"] as const;

      for (const difficulty of difficulties) {
        mockSingle.mockResolvedValue({
          data: { ...sampleEntries[0], difficulty },
          error: null,
        });

        const result = await submitScore({
          username: "player",
          score: 100,
          difficulty,
        });

        expect(result.error).toBeNull();
      }
    });
  });

  describe("integration tests", () => {
    it("submit score and verify in user scores", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: { id: "user-123", email: "test@example.com" } },
        error: null,
      });

      const newEntry: LeaderboardEntry = {
        id: "new-entry",
        user_id: "user-123",
        username: "testplayer",
        score: 350,
        difficulty: "hard",
        created_at: "2024-01-15T10:00:00Z",
      };

      mockSingle.mockResolvedValue({
        data: newEntry,
        error: null,
      });

      // Submit score
      const submitResult = await submitScore({
        username: "testplayer",
        score: 350,
        difficulty: "hard",
      });

      expect(submitResult.data).toEqual(newEntry);

      // Verify it would appear in user scores
      mockLimit.mockResolvedValue({
        data: [newEntry],
        error: null,
      });

      const userScoresResult = await getUserScores("user-123");

      expect(userScoresResult.data).toContainEqual(newEntry);
    });

    it("filter leaderboard by different difficulties", async () => {
      const easyScores = sampleEntries.filter((e) => e.difficulty === "easy");
      const mediumScores = sampleEntries.filter(
        (e) => e.difficulty === "medium"
      );
      const hardScores = sampleEntries.filter((e) => e.difficulty === "hard");

      // Test easy
      mockLimit.mockResolvedValue({ data: easyScores, error: null });
      const easyResult = await getScoresByDifficulty("easy");
      expect(easyResult.data).toEqual(easyScores);

      // Test medium
      mockLimit.mockResolvedValue({ data: mediumScores, error: null });
      const mediumResult = await getScoresByDifficulty("medium");
      expect(mediumResult.data).toEqual(mediumScores);

      // Test hard
      mockLimit.mockResolvedValue({ data: hardScores, error: null });
      const hardResult = await getScoresByDifficulty("hard");
      expect(hardResult.data).toEqual(hardScores);
    });
  });
});

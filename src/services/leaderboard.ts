import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import type { LeaderboardEntry, Difficulty } from "@/types";

/**
 * Default limit for fetching top scores.
 */
const DEFAULT_TOP_SCORES_LIMIT = 100;

/**
 * Table name for leaderboard in Supabase.
 */
const LEADERBOARD_TABLE = "leaderboard";

/**
 * Valid difficulty values for database validation.
 */
const VALID_DIFFICULTIES: readonly Difficulty[] = [
  "easy",
  "medium",
  "hard",
] as const;

/**
 * Result of leaderboard operations.
 */
export interface LeaderboardResult<T> {
  /** Data returned from the operation */
  data: T | null;
  /** Error message if operation failed */
  error: string | null;
}

/**
 * Score submission data.
 */
export interface ScoreSubmission {
  /** User display name */
  username: string;
  /** Score value */
  score: number;
  /** Difficulty level */
  difficulty: Difficulty;
}

/**
 * Validates that a difficulty value is valid.
 * @param difficulty - The difficulty to validate
 * @returns true if valid difficulty
 */
function isValidDifficulty(difficulty: string): difficulty is Difficulty {
  return VALID_DIFFICULTIES.includes(difficulty as Difficulty);
}

/**
 * Validates a score value.
 * @param score - The score to validate
 * @returns true if score is a valid non-negative finite number
 */
function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0;
}

/**
 * Fetches the top scores from the leaderboard.
 * @param limit - Maximum number of scores to return (default: 100)
 * @returns LeaderboardResult with array of entries or error
 */
export async function getTopScores(
  limit: number = DEFAULT_TOP_SCORES_LIMIT
): Promise<LeaderboardResult<LeaderboardEntry[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: "Supabase is not configured",
    };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(LEADERBOARD_TABLE)
      .select("id, user_id, username, score, difficulty, created_at")
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as LeaderboardEntry[],
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch top scores";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Fetches scores filtered by difficulty level.
 * @param difficulty - The difficulty level to filter by
 * @param limit - Maximum number of scores to return (default: 100)
 * @returns LeaderboardResult with array of entries or error
 */
export async function getScoresByDifficulty(
  difficulty: Difficulty,
  limit: number = DEFAULT_TOP_SCORES_LIMIT
): Promise<LeaderboardResult<LeaderboardEntry[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: "Supabase is not configured",
    };
  }

  if (!isValidDifficulty(difficulty)) {
    return {
      data: null,
      error: `Invalid difficulty: ${difficulty}. Must be one of: easy, medium, hard`,
    };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(LEADERBOARD_TABLE)
      .select("id, user_id, username, score, difficulty, created_at")
      .eq("difficulty", difficulty)
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as LeaderboardEntry[],
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to fetch scores by difficulty";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Fetches all scores for a specific user.
 * @param userId - The user ID to filter by
 * @param limit - Maximum number of scores to return (default: 100)
 * @returns LeaderboardResult with array of entries or error
 */
export async function getUserScores(
  userId: string,
  limit: number = DEFAULT_TOP_SCORES_LIMIT
): Promise<LeaderboardResult<LeaderboardEntry[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: "Supabase is not configured",
    };
  }

  if (!userId || typeof userId !== "string") {
    return {
      data: null,
      error: "Invalid user ID",
    };
  }

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(LEADERBOARD_TABLE)
      .select("id, user_id, username, score, difficulty, created_at")
      .eq("user_id", userId)
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as LeaderboardEntry[],
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch user scores";
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Submits a new score to the leaderboard.
 * Requires an authenticated user session.
 * @param submission - Score data to submit
 * @returns LeaderboardResult with the created entry or error
 */
export async function submitScore(
  submission: ScoreSubmission
): Promise<LeaderboardResult<LeaderboardEntry>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: "Supabase is not configured",
    };
  }

  // Validate input
  if (!submission.username || typeof submission.username !== "string") {
    return {
      data: null,
      error: "Username is required",
    };
  }

  if (!isValidScore(submission.score)) {
    return {
      data: null,
      error: "Invalid score value",
    };
  }

  if (!isValidDifficulty(submission.difficulty)) {
    return {
      data: null,
      error: `Invalid difficulty: ${submission.difficulty}. Must be one of: easy, medium, hard`,
    };
  }

  try {
    const client = getSupabaseClient();

    // Get current user for user_id
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: "Authentication required to submit scores",
      };
    }

    // Insert the score
    const { data, error } = await client
      .from(LEADERBOARD_TABLE)
      .insert({
        user_id: user.id,
        username: submission.username.trim(),
        score: submission.score,
        difficulty: submission.difficulty,
      })
      .select("id, user_id, username, score, difficulty, created_at")
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as LeaderboardEntry,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to submit score";
    return {
      data: null,
      error: message,
    };
  }
}

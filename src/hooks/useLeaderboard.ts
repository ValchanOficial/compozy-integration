import { useState, useEffect, useCallback, useRef } from "react";
import type { LeaderboardEntry, Difficulty } from "@/types";
import {
  getTopScores,
  getScoresByDifficulty,
  submitScore,
  type ScoreSubmission,
  type LeaderboardResult,
} from "@/services/leaderboard";

/**
 * Default polling interval in milliseconds (12 seconds).
 */
const DEFAULT_POLLING_INTERVAL = 12000;

/**
 * State returned by the useLeaderboard hook.
 */
export interface LeaderboardState {
  /** Array of leaderboard entries */
  entries: LeaderboardEntry[];
  /** Whether data is currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Currently selected difficulty filter, null for all */
  selectedDifficulty: Difficulty | null;
}

/**
 * Actions returned by the useLeaderboard hook.
 */
export interface LeaderboardActions {
  /** Set difficulty filter (null for all) */
  setDifficulty: (difficulty: Difficulty | null) => void;
  /** Manually refresh the leaderboard data */
  refresh: () => Promise<void>;
  /** Submit a new score to the leaderboard */
  submitNewScore: (
    submission: ScoreSubmission
  ) => Promise<LeaderboardResult<LeaderboardEntry>>;
}

/**
 * Options for configuring the useLeaderboard hook.
 */
export interface UseLeaderboardOptions {
  /** Initial difficulty filter, null for all (default: null) */
  initialDifficulty?: Difficulty | null;
  /** Polling interval in milliseconds (default: 12000) */
  pollingInterval?: number;
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean;
}

/**
 * Custom hook for managing leaderboard data with polling support.
 * Fetches leaderboard entries from Supabase, supports filtering by difficulty,
 * and automatically refreshes data at specified intervals.
 *
 * @param options - Configuration options for the hook
 * @returns Tuple of [state, actions] for leaderboard management
 */
export function useLeaderboard(
  options: UseLeaderboardOptions = {}
): [LeaderboardState, LeaderboardActions] {
  const {
    initialDifficulty = null,
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    enablePolling = true,
  } = options;

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(initialDifficulty);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);

  /**
   * Fetches leaderboard data based on current difficulty filter.
   */
  const fetchLeaderboard = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      let result: LeaderboardResult<LeaderboardEntry[]>;

      if (selectedDifficulty) {
        result = await getScoresByDifficulty(selectedDifficulty);
      } else {
        result = await getTopScores();
      }

      if (!isMountedRef.current) return;

      if (result.error) {
        setError(result.error);
        setEntries([]);
      } else {
        setEntries(result.data ?? []);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const message =
        err instanceof Error ? err.message : "Failed to fetch leaderboard";
      setError(message);
      setEntries([]);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedDifficulty]);

  /**
   * Manually refresh leaderboard data.
   */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchLeaderboard();
  }, [fetchLeaderboard]);

  /**
   * Set the difficulty filter.
   */
  const setDifficulty = useCallback((difficulty: Difficulty | null): void => {
    setSelectedDifficulty(difficulty);
  }, []);

  /**
   * Submit a new score to the leaderboard.
   */
  const submitNewScore = useCallback(
    async (
      submission: ScoreSubmission
    ): Promise<LeaderboardResult<LeaderboardEntry>> => {
      const result = await submitScore(submission);

      // Refresh leaderboard after successful submission
      if (!result.error && isMountedRef.current) {
        await fetchLeaderboard();
      }

      return result;
    },
    [fetchLeaderboard]
  );

  // Initial fetch on mount and when difficulty changes
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Set up polling interval
  useEffect(() => {
    if (!enablePolling) return;

    const intervalId = setInterval(() => {
      fetchLeaderboard();
    }, pollingInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchLeaderboard, pollingInterval, enablePolling]);

  // Track mount status for cleanup
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const state: LeaderboardState = {
    entries,
    isLoading,
    error,
    selectedDifficulty,
  };

  const actions: LeaderboardActions = {
    setDifficulty,
    refresh,
    submitNewScore,
  };

  return [state, actions];
}

export default useLeaderboard;

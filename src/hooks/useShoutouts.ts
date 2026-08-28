// Owns the lifecycle of the shoutouts list: fetches on mount, tracks
// loading/error state, and exposes `addShoutout` so a freshly created row
// can be prepended locally without a full refetch, plus `refetch` for a
// manual "try again" affordance after a failed load.

import { useCallback, useEffect, useState } from "react";
import { ApiError, getShoutouts } from "@/lib/api";
import type { Shoutout } from "@/types/shoutout";

export interface UseShoutoutsResult {
  shoutouts: Shoutout[];
  isLoading: boolean;
  error: string | null;
  addShoutout: (shoutout: Shoutout) => void;
  refetch: () => void;
}

function toErrorMessage(caught: unknown): string {
  if (caught instanceof ApiError) {
    return caught.message;
  }
  return "Something went wrong";
}

export function useShoutouts(): UseShoutoutsResult {
  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getShoutouts();
        if (!cancelled) {
          setShoutouts(data);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(toErrorMessage(caught));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  const addShoutout = useCallback((shoutout: Shoutout): void => {
    setShoutouts((prev) => [shoutout, ...prev]);
  }, []);

  const refetch = useCallback((): void => {
    setRefetchToken((token) => token + 1);
  }, []);

  return { shoutouts, isLoading, error, addShoutout, refetch };
}

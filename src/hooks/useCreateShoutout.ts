// Wraps the create-shoutout mutation: tracks in-flight/error state and
// never throws out of `submit`, callers get back either the created
// Shoutout or null, with the human-readable failure reason left in `error`.

import { useCallback, useState } from "react";
import { ApiError, createShoutout } from "@/lib/api";
import type { Shoutout, ShoutoutInput } from "@/types/shoutout";

export interface UseCreateShoutoutResult {
  submit: (input: ShoutoutInput) => Promise<Shoutout | null>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
}

function toErrorMessage(caught: unknown): string {
  if (caught instanceof ApiError) {
    return caught.message;
  }
  return "Something went wrong";
}

export function useCreateShoutout(): UseCreateShoutoutResult {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: ShoutoutInput): Promise<Shoutout | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createShoutout(input);
      return created;
    } catch (caught) {
      setError(toErrorMessage(caught));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return { submit, isSubmitting, error, clearError };
}

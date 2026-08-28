// Exercises useCreateShoutout against a mocked "@/lib/api" module (per
// docs/TESTING_GUIDELINES.md §3): the isSubmitting flag over the lifetime of
// a submit() call, the success/ApiError-failure return branches, and
// clearError. ApiError itself is the real class, only createShoutout is
// mocked.

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, createShoutout } from "@/lib/api";
import type { Shoutout, ShoutoutInput } from "@/types/shoutout";
import { useCreateShoutout } from "@/hooks/useCreateShoutout";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getShoutouts: vi.fn(),
    createShoutout: vi.fn(),
  };
});

const SAMPLE_INPUT: ShoutoutInput = {
  from_name: "Ada",
  to_name: "Grace",
  message: "Great work on the release!",
  emoji: "🔥",
};

const SAMPLE_SHOUTOUT: Shoutout = {
  ...SAMPLE_INPUT,
  id: "11111111-1111-1111-1111-111111111111",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("useCreateShoutout", () => {
  beforeEach(() => {
    vi.mocked(createShoutout).mockReset();
  });

  it("sets isSubmitting true then false around a submit() call", async () => {
    let resolveCreate: (value: Shoutout) => void = () => {};
    const pending = new Promise<Shoutout>((resolve) => {
      resolveCreate = resolve;
    });
    vi.mocked(createShoutout).mockReturnValue(pending);

    const { result } = renderHook(() => useCreateShoutout());

    let submitPromise: Promise<Shoutout | null> = Promise.resolve(null);
    act(() => {
      submitPromise = result.current.submit(SAMPLE_INPUT);
    });

    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveCreate(SAMPLE_SHOUTOUT);
      await submitPromise;
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it("returns the created shoutout on success and leaves error null", async () => {
    vi.mocked(createShoutout).mockResolvedValue(SAMPLE_SHOUTOUT);

    const { result } = renderHook(() => useCreateShoutout());

    let created: Shoutout | null = null;
    await act(async () => {
      created = await result.current.submit(SAMPLE_INPUT);
    });

    expect(created).toEqual(SAMPLE_SHOUTOUT);
    expect(result.current.error).toBeNull();
  });

  it("resolves to null and sets error on a rejected ApiError", async () => {
    vi.mocked(createShoutout).mockRejectedValue(
      new ApiError("Invalid shoutout payload", 400, { message: ["Message is required"] }),
    );

    const { result } = renderHook(() => useCreateShoutout());

    let outcome: Shoutout | null = SAMPLE_SHOUTOUT;
    await act(async () => {
      outcome = await result.current.submit(SAMPLE_INPUT);
    });

    expect(outcome).toBeNull();
    expect(result.current.error).toBe("Invalid shoutout payload");
  });

  it("falls back to a generic message for a non-ApiError rejection", async () => {
    vi.mocked(createShoutout).mockRejectedValue(new TypeError("unexpected"));

    const { result } = renderHook(() => useCreateShoutout());

    let outcome: Shoutout | null = SAMPLE_SHOUTOUT;
    await act(async () => {
      outcome = await result.current.submit(SAMPLE_INPUT);
    });

    expect(outcome).toBeNull();
    expect(result.current.error).toBe("Something went wrong");
  });

  it("resets error to null via clearError", async () => {
    vi.mocked(createShoutout).mockRejectedValue(
      new ApiError("Server error, please try again", 500),
    );

    const { result } = renderHook(() => useCreateShoutout());
    await act(async () => {
      await result.current.submit(SAMPLE_INPUT);
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });
});

// Exercises useShoutouts against a mocked "@/lib/api" module (per
// docs/TESTING_GUIDELINES.md §3): the fetch-on-mount lifecycle, success and
// ApiError failure branches, the local `addShoutout` prepend, and `refetch`
// triggering a second network call. ApiError itself is the real class,
// only getShoutouts/createShoutout are mocked.

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getShoutouts } from "@/lib/api";
import type { Shoutout } from "@/types/shoutout";
import { useShoutouts } from "@/hooks/useShoutouts";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    getShoutouts: vi.fn(),
    createShoutout: vi.fn(),
  };
});

const SAMPLE_SHOUTOUT: Shoutout = {
  id: "11111111-1111-1111-1111-111111111111",
  from_name: "Ada",
  to_name: "Grace",
  message: "Great work on the release!",
  emoji: "🔥",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("useShoutouts", () => {
  beforeEach(() => {
    vi.mocked(getShoutouts).mockReset();
  });

  it("starts loading and calls getShoutouts on mount", () => {
    vi.mocked(getShoutouts).mockReturnValue(new Promise<Shoutout[]>(() => {}));

    const { result } = renderHook(() => useShoutouts());

    expect(result.current.isLoading).toBe(true);
    expect(getShoutouts).toHaveBeenCalledTimes(1);
  });

  it("populates shoutouts and clears isLoading on success", async () => {
    vi.mocked(getShoutouts).mockResolvedValue([SAMPLE_SHOUTOUT]);

    const { result } = renderHook(() => useShoutouts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.shoutouts).toEqual([SAMPLE_SHOUTOUT]);
    expect(result.current.error).toBeNull();
  });

  it("sets a human error string on a rejected ApiError", async () => {
    vi.mocked(getShoutouts).mockRejectedValue(
      new ApiError("Network error: could not reach the server", 0),
    );

    const { result } = renderHook(() => useShoutouts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Network error: could not reach the server");
    expect(result.current.shoutouts).toEqual([]);
  });

  it("falls back to a generic message for a non-ApiError rejection", async () => {
    vi.mocked(getShoutouts).mockRejectedValue(new TypeError("unexpected"));

    const { result } = renderHook(() => useShoutouts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Something went wrong");
  });

  it("prepends via addShoutout without calling the API again", async () => {
    vi.mocked(getShoutouts).mockResolvedValue([]);

    const { result } = renderHook(() => useShoutouts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getShoutouts).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.addShoutout(SAMPLE_SHOUTOUT);
    });

    expect(result.current.shoutouts).toEqual([SAMPLE_SHOUTOUT]);
    expect(getShoutouts).toHaveBeenCalledTimes(1);
  });

  it("calls getShoutouts again on refetch", async () => {
    vi.mocked(getShoutouts).mockResolvedValue([]);

    const { result } = renderHook(() => useShoutouts());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getShoutouts).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(getShoutouts).toHaveBeenCalledTimes(2));
  });
});

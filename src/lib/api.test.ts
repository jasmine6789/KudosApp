// Unit tests for the typed fetch wrapper around the shoutouts Edge
// Function. This is the one module allowed to mock global fetch directly
// (per docs/TESTING_GUIDELINES.md §3) since it IS the network boundary —
// every other module mocks this one instead of touching fetch itself.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, createShoutout, getShoutouts } from "@/lib/api";
import type { Shoutout } from "@/types/shoutout";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SAMPLE_SHOUTOUT: Shoutout = {
  id: "11111111-1111-1111-1111-111111111111",
  from_name: "Ada",
  to_name: "Grace",
  message: "Nice work",
  emoji: "🔥",
  created_at: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getShoutouts", () => {
  it("issues a GET request to the shoutouts endpoint and returns the data array", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, data: [SAMPLE_SHOUTOUT] }, 200),
    );

    const result = await getShoutouts();

    expect(result).toEqual([SAMPLE_SHOUTOUT]);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/shoutouts");
    expect(init?.method).toBe("GET");
  });

  it("throws an ApiError carrying the server's message and status on a 500", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: false, error: "Failed to fetch shoutouts" }, 500),
    );

    await getShoutouts().then(
      () => expect.unreachable("getShoutouts should have thrown"),
      (err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(500);
        expect((err as ApiError).message).toBe("Failed to fetch shoutouts");
      },
    );
  });

  it("throws a network ApiError with status 0 when fetch itself rejects", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await getShoutouts().then(
      () => expect.unreachable("getShoutouts should have thrown"),
      (err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(0);
      },
    );
  });

  it("throws an ApiError when the response body isn't the expected ApiResponse shape", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("not json", { status: 200 }));

    await expect(getShoutouts()).rejects.toBeInstanceOf(ApiError);
  });

  it("surfaces a status code that is neither 400 nor >= 500 as-is", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: false, error: "Too many requests" }, 429),
    );

    await getShoutouts().then(
      () => expect.unreachable("getShoutouts should have thrown"),
      (err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(429);
        expect((err as ApiError).message).toBe("Too many requests");
      },
    );
  });

  it("falls back to a generic message when the server omits one", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ success: false }, 500));

    await getShoutouts().then(
      () => expect.unreachable("getShoutouts should have thrown"),
      (err: unknown) => {
        expect((err as ApiError).message).toBe("Server error — please try again");
      },
    );
  });
});

describe("createShoutout", () => {
  it("POSTs the input as JSON and returns the created shoutout", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ success: true, data: SAMPLE_SHOUTOUT }, 201),
    );

    const result = await createShoutout({
      from_name: "Ada",
      to_name: "Grace",
      message: "Nice work",
      emoji: "🔥",
    });

    expect(result).toEqual(SAMPLE_SHOUTOUT);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toMatchObject({ from_name: "Ada" });
  });

  it("throws an ApiError with field-level details on a 400 validation failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(
        { success: false, error: "Invalid shoutout payload", details: { message: ["Too long"] } },
        400,
      ),
    );

    await createShoutout({
      from_name: "Ada",
      to_name: "Grace",
      message: "x".repeat(281),
      emoji: "🔥",
    }).then(
      () => expect.unreachable("createShoutout should have thrown"),
      (err: unknown) => {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(400);
        expect((err as ApiError).details).toEqual({ message: ["Too long"] });
      },
    );
  });
});

// Unit coverage for the confetti trigger's own logic: the reduced-motion
// short-circuit, and that it degrades gracefully if canvas-confetti itself
// throws. canvas-confetti is mocked globally in src/test/setup.ts (jsdom
// has no working canvas renderer), so this exercises the real logic in
// this module against that mock, not a second local mock of its own.

import { afterEach, describe, expect, it, vi } from "vitest";
import confetti from "canvas-confetti";
import { celebrateNewShoutout } from "@/lib/confetti";

afterEach(() => {
  vi.mocked(confetti).mockClear();
});

describe("celebrateNewShoutout", () => {
  it("does not fire confetti when reduced motion is preferred", () => {
    celebrateNewShoutout(true);

    expect(confetti).not.toHaveBeenCalled();
  });

  it("fires a layered confetti burst (a center pop plus two corner cannons) when reduced motion is not preferred", () => {
    celebrateNewShoutout(false);

    // Five calls for the center "realistic look" burst, two for the
    // bottom-corner cannons. See src/lib/confetti.ts for why these are
    // separate synchronous calls rather than one big particleCount.
    expect(confetti).toHaveBeenCalledTimes(7);
  });

  it("fires the two corner cannons from opposite bottom corners", () => {
    celebrateNewShoutout(false);

    const calls = vi.mocked(confetti).mock.calls.map(([options]) => options);
    const leftCannon = calls.find(
      (options) => options?.origin?.x === 0 && options?.origin?.y === 1,
    );
    const rightCannon = calls.find(
      (options) => options?.origin?.x === 1 && options?.origin?.y === 1,
    );

    expect(leftCannon).toBeDefined();
    expect(rightCannon).toBeDefined();
    expect(leftCannon?.angle).toBe(60);
    expect(rightCannon?.angle).toBe(120);
  });

  it("never throws even if the underlying confetti call fails", () => {
    vi.mocked(confetti).mockImplementationOnce(() => {
      throw new Error("no canvas context");
    });

    expect(() => celebrateNewShoutout(false)).not.toThrow();
  });
});

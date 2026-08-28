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

  it("fires a confetti burst when reduced motion is not preferred", () => {
    celebrateNewShoutout(false);

    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it("never throws even if the underlying confetti call fails", () => {
    vi.mocked(confetti).mockImplementationOnce(() => {
      throw new Error("no canvas context");
    });

    expect(() => celebrateNewShoutout(false)).not.toThrow();
  });
});

// Unit tests for the emoji -> visual theme mapping. These guard the
// invariant the module already asserts at import time (every allowlisted
// emoji has a theme entry) and lock down the shape/values getEmojiTheme
// hands back, so a future edit to EMOJI_THEME can't silently drop a key
// or change the EmojiTheme contract without a failing test.

import { describe, expect, it } from "vitest";
import { EMOJI_THEME, getEmojiTheme, type EmojiTheme } from "@/lib/emojiTheme";
import { EMOJI_ALLOWLIST } from "@/types/shoutout";

describe("EMOJI_THEME", () => {
  it("has a theme entry for every emoji in EMOJI_ALLOWLIST", () => {
    for (const emoji of EMOJI_ALLOWLIST) {
      expect(EMOJI_THEME[emoji]).toBeDefined();
    }
  });

  it("has no extra entries beyond the allowlist", () => {
    expect(Object.keys(EMOJI_THEME).sort()).toEqual([...EMOJI_ALLOWLIST].sort());
  });
});

describe("getEmojiTheme", () => {
  it("returns the fire theme's border and well for 🔥", () => {
    const theme = getEmojiTheme("🔥");

    expect(theme.border).toBe("border-l-orange-500");
    expect(theme.well).toBe("bg-orange-50 dark:bg-orange-500/10");
  });

  it("returns the appreciation theme's border and well for ❤️", () => {
    const theme = getEmojiTheme("❤️");

    expect(theme.border).toBe("border-l-rose-500");
    expect(theme.well).toBe("bg-rose-50 dark:bg-rose-500/10");
  });

  it("returns the team-win theme's border and well for 🙌", () => {
    const theme = getEmojiTheme("🙌");

    expect(theme.border).toBe("border-l-teal-500");
    expect(theme.well).toBe("bg-teal-50 dark:bg-teal-500/10");
  });

  it("returns an object matching the EmojiTheme shape for every allowlisted emoji", () => {
    for (const emoji of EMOJI_ALLOWLIST) {
      const theme: EmojiTheme = getEmojiTheme(emoji);

      expect(typeof theme.label).toBe("string");
      expect(typeof theme.border).toBe("string");
      expect(typeof theme.well).toBe("string");
      expect(Object.keys(theme).sort()).toEqual(["border", "label", "well"]);
    }
  });
});

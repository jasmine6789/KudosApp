// Per-emoji visual accents for shoutout cards (left border + icon well),
// keyed off the same EMOJI_ALLOWLIST used for validation so the two can
// never drift apart — see docs/DESIGN_SYSTEM.md §2 for the source table.

import { EMOJI_ALLOWLIST, type Emoji } from "@/types/shoutout";

export interface EmojiTheme {
  label: string;
  border: string;
  well: string;
}

export const EMOJI_THEME: Record<Emoji, EmojiTheme> = {
  "🔥": {
    label: "On fire / crushing it",
    border: "border-l-orange-500",
    well: "bg-orange-50 dark:bg-orange-500/10",
  },
  "👏": {
    label: "Nice work",
    border: "border-l-amber-500",
    well: "bg-amber-50 dark:bg-amber-500/10",
  },
  "❤️": {
    label: "Appreciation",
    border: "border-l-rose-500",
    well: "bg-rose-50 dark:bg-rose-500/10",
  },
  "🚀": {
    label: "Shipped something big",
    border: "border-l-indigo-500",
    well: "bg-indigo-50 dark:bg-indigo-500/10",
  },
  "🎉": {
    label: "Celebration",
    border: "border-l-fuchsia-500",
    well: "bg-fuchsia-50 dark:bg-fuchsia-500/10",
  },
  "🌟": {
    label: "Standout moment",
    border: "border-l-yellow-500",
    well: "bg-yellow-50 dark:bg-yellow-500/10",
  },
  "💡": {
    label: "Good idea",
    border: "border-l-sky-500",
    well: "bg-sky-50 dark:bg-sky-500/10",
  },
  "🙌": {
    label: "Team win",
    border: "border-l-teal-500",
    well: "bg-teal-50 dark:bg-teal-500/10",
  },
};

const themeKeys = new Set<string>(Object.keys(EMOJI_THEME));
if (EMOJI_ALLOWLIST.some((emoji) => !themeKeys.has(emoji))) {
  throw new Error("EMOJI_THEME is missing an entry for an allowlisted emoji");
}

export function getEmojiTheme(emoji: Emoji): EmojiTheme {
  return EMOJI_THEME[emoji];
}

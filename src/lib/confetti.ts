// Fires a short confetti burst to celebrate a successfully posted shoutout.
// Purely decorative, so it is wrapped in a try/catch: an environment without
// a working 2D canvas context (a test runner, an old browser, a locked-down
// embedded webview) must never break the actual submit flow over a visual
// flourish. Skipped entirely for prefers-reduced-motion, same rule as every
// other animation in this app.

import confetti from "canvas-confetti";

const BRAND_COLORS = ["#15803D", "#22C55E", "#86EFAC", "#000000", "#FFFFFF"];

export function celebrateNewShoutout(prefersReducedMotion: boolean): void {
  if (prefersReducedMotion) {
    return;
  }

  try {
    confetti({
      particleCount: 90,
      spread: 75,
      startVelocity: 38,
      gravity: 0.9,
      ticks: 200,
      origin: { x: 0.5, y: 0.7 },
      colors: BRAND_COLORS,
    });
  } catch {
    // Decorative only, see the file banner above for why this is intentional.
  }
}

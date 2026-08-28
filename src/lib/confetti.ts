// Fires a short confetti burst to celebrate a successfully posted shoutout.
// Purely decorative, so it is wrapped in a try/catch: an environment without
// a working 2D canvas context (a test runner, an old browser, a locked-down
// embedded webview) must never break the actual submit flow over a visual
// flourish. Skipped entirely for prefers-reduced-motion, same rule as every
// other animation in this app.
//
// Two layered effects, both adapted from canvas-confetti's own documented
// recipes (kirilv.com/canvas-confetti): a center "realistic look" pop (five
// calls at varying spread/velocity/decay, which is what gives it a natural,
// non-uniform burst instead of one flat circle of particles), plus a
// "school pride"-style pair of cannons firing from the two bottom corners.
// Every call here is synchronous and fires in the same tick on purpose:
// canvas-confetti runs each burst's own animation over the following couple
// of seconds internally, so staggering the *calls* themselves with rAF/
// setTimeout loops isn't needed for a layered look, and skipping that keeps
// this function trivial to unit test.

import confetti from "canvas-confetti";
import type { Options as ConfettiOptions } from "canvas-confetti";

const BRAND_COLORS = ["#15803D", "#22C55E", "#86EFAC", "#000000", "#FFFFFF"];
const CONFETTI_Z_INDEX = 9999;

function fireRealisticBurst(): void {
  const particleCount = 220;
  const defaults: ConfettiOptions = {
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
    zIndex: CONFETTI_Z_INDEX,
  };

  function fire(ratio: number, options: ConfettiOptions): void {
    confetti({ ...defaults, ...options, particleCount: Math.floor(particleCount * ratio) });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

function fireCornerCannons(): void {
  const shared: ConfettiOptions = {
    colors: BRAND_COLORS,
    zIndex: CONFETTI_Z_INDEX,
    particleCount: 110,
    startVelocity: 62,
    spread: 58,
    ticks: 300,
    scalar: 1.1,
    shapes: ["square", "circle", "star"],
  };

  confetti({ ...shared, angle: 60, origin: { x: 0, y: 1 } });
  confetti({ ...shared, angle: 120, origin: { x: 1, y: 1 } });
}

export function celebrateNewShoutout(prefersReducedMotion: boolean): void {
  if (prefersReducedMotion) {
    return;
  }

  try {
    fireRealisticBurst();
    fireCornerCannons();
  } catch {
    // Decorative only, see the file banner above for why this is intentional.
  }
}

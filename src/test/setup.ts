// Global Vitest setup, loaded once via vite.config.ts's `test.setupFiles`.
// Registers jest-dom's DOM matchers (toBeInTheDocument, etc.) on Vitest's
// `expect`, and unmounts each test's rendered tree afterwards so component
// state and DOM nodes never leak from one test into the next.

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// canvas-confetti runs its own requestAnimationFrame loop for the lifetime
// of a burst, calling into a real 2D canvas context on every frame. jsdom
// has no working canvas renderer (getContext("2d") returns null), so that
// loop throws a few frames in, well outside any try/catch in the code that
// triggered it. Mocked globally here rather than skipped per-test, since
// the underlying capability gap is about the test environment, not any one
// component's behavior.
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

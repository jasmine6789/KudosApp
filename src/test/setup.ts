// Global Vitest setup, loaded once via vite.config.ts's `test.setupFiles`.
// Registers jest-dom's DOM matchers (toBeInTheDocument, etc.) on Vitest's
// `expect`, and unmounts each test's rendered tree afterwards so component
// state and DOM nodes never leak from one test into the next.

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

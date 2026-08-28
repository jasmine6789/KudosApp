// Vite build/dev config for the frontend, extended with Vitest's `test`
// field. We import `defineConfig` from "vitest/config" (a superset of
// Vite's own) rather than "vite" so the `test` block type-checks against
// Vitest's config shape instead of being silently ignored/untyped.

import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**", "src/hooks/**", "src/types/**", "src/components/**"],
    },
  },
});

// Flat ESLint config (ESLint 9) for the Vite/React/TypeScript frontend
// only. The Supabase Edge Function under supabase/functions/ is a separate
// Deno project, linted with `deno lint` per its own conventions instead.
// TypeScript itself (`tsc --noEmit`) already catches undefined identifiers,
// so we turn `no-undef` off for ts/tsx rather than pulling in the "globals"
// package just to describe the DOM.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: ["dist/**", "coverage/**", "supabase/functions/**", "node_modules/**"],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-undef": "off",
      "no-console": "warn",
    },
  },
]);

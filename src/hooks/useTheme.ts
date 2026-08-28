// Dark-mode toggle backed by localStorage ("shoutout-board-theme"), falling
// back to the OS color-scheme preference on first visit. Keeps the "dark"
// class on <html> in sync so Tailwind's dark: variant applies. All browser
// API access is guarded so this hook is safe under SSR/test environments.

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export interface UseThemeResult {
  theme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = "shoutout-board-theme";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (privacy mode, disabled storage); fall
    // through to the media-query preference below.
  }

  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function applyThemeClass(theme: Theme): void {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = useCallback((): void => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Persisting the preference is best-effort; the toggle still
          // works for the current session even if storage write fails.
        }
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}

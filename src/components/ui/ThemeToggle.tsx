// Round icon button that flips the app between light and dark mode. Reads
// current theme and the toggle action from the shared useTheme hook rather
// than owning any state itself — this component is purely presentational
// glue around that hook's contract.

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700",
        "dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
        "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
      )}
    >
      {isDark ? (
        <Moon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}

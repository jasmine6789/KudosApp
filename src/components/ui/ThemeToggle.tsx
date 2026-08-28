// Round icon button that flips the app between light and dark mode. Reads
// current theme and the toggle action from the shared useTheme hook rather
// than owning any state itself. This component is purely presentational
// glue around that hook's contract. Styled for a fixed dark context (it
// always sits on App's black header band, regardless of the light/dark
// toggle it controls), so it has no light/dark-conditional classes itself.

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
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white",
        "hover:bg-white/20 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
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

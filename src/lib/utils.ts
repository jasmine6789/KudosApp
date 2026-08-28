import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combines conditional classnames (clsx) with Tailwind-aware conflict
// resolution (tailwind-merge), so e.g. cn("px-2", isWide && "px-4") collapses
// to "px-4" instead of emitting both classes.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

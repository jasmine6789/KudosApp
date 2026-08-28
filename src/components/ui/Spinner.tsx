// Generic loading indicator: a spinning Lucide icon reused anywhere the UI
// needs an inline "working on it" affordance (buttons, async panels, etc.).
// Purely decorative — callers are responsible for conveying loading state
// to assistive tech via aria-busy/aria-live on the surrounding element.

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps): JSX.Element {
  return <Loader2 aria-hidden="true" className={cn("h-5 w-5 animate-spin", className)} />;
}

// Generic button primitive shared across the app (submit actions, ghost
// actions, etc.). Wraps framer-motion's motion.button for hover/tap
// micro-interactions — skipped entirely under prefers-reduced-motion — and
// swaps its children for a Spinner while forcing a disabled, muted look
// during `isLoading`. Feature components own copy/handlers; this component
// only owns look-and-feel.

import type { ButtonHTMLAttributes } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  isLoading?: boolean;
}

type ButtonVariant = NonNullable<ButtonProps["variant"]>;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "border border-transparent bg-indigo-600 text-white hover:bg-indigo-700",
  ghost:
    "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
};

// motion.button's own props type already strips native handlers that
// collide with framer-motion's (onDrag, onAnimationStart, ...) and replaces
// them with its own signatures. Spreading a `ButtonHTMLAttributes` rest
// object still carries the native versions of those keys, which the
// compiler sees as incompatible with motion's — so the passthrough is typed
// through this narrowed, equally-real subset rather than reaching for `any`.
type MotionSafeRest = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

export function Button(props: ButtonProps): JSX.Element {
  const {
    variant = "primary",
    isLoading = false,
    disabled = false,
    className,
    children,
    ...rest
  } = props;
  const prefersReducedMotion = useReducedMotion();
  const isDisabled = disabled || isLoading;
  const motionSafeRest = rest as MotionSafeRest;

  return (
    <motion.button
      type="button"
      {...motionSafeRest}
      whileHover={!prefersReducedMotion && !isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!prefersReducedMotion && !isDisabled ? { scale: 0.98 } : undefined}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-70",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {isLoading ? <Spinner className="h-4 w-4" /> : children}
    </motion.button>
  );
}

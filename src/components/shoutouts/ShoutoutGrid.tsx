// Presentational switchboard for the shoutouts feed: given the loading/error/
// data state owned by useShoutouts, it renders exactly one of four mutually
// exclusive views — skeleton placeholders, a retryable error message, a calm
// empty state, or the populated card grid. It fetches nothing itself; all
// data and callbacks arrive as props.

import { AnimatePresence } from "framer-motion";
import type { Shoutout } from "@/types/shoutout";
import { ShoutoutCard } from "@/components/shoutouts/ShoutoutCard";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ShoutoutGridProps {
  shoutouts: Shoutout[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const SKELETON_COUNT = 6;

const GRID_CLASS = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

const SHIMMER_CLASS =
  "bg-[length:200%_100%] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 " +
  "animate-shimmer motion-reduce:animate-none " +
  "dark:from-slate-800 dark:via-slate-700 dark:to-slate-800";

function SkeletonCard(): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900",
        "border-l-4 border-l-slate-200 dark:border-l-slate-700 sm:p-5",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("h-10 w-10 shrink-0 rounded-full", SHIMMER_CLASS)} />
        <div className="min-w-0 flex-1 space-y-2 py-1">
          <div className={cn("h-4 w-2/3 rounded", SHIMMER_CLASS)} />
          <div className={cn("h-3 w-full rounded", SHIMMER_CLASS)} />
          <div className={cn("h-3 w-4/5 rounded", SHIMMER_CLASS)} />
          <div className={cn("mt-2 h-3 w-16 rounded", SHIMMER_CLASS)} />
        </div>
      </div>
    </div>
  );
}

function LoadingGrid(): JSX.Element {
  return (
    <div role="status" aria-live="polite" className={GRID_CLASS}>
      <span className="sr-only">Loading shoutouts…</span>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState(props: ErrorStateProps): JSX.Element {
  const { error, onRetry } = props;
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p role="alert" className="text-sm text-rose-600">
        {error}
      </p>
      <Button variant="ghost" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No shoutouts yet — be the first to send one!
      </p>
    </div>
  );
}

export function ShoutoutGrid(props: ShoutoutGridProps): JSX.Element {
  const { shoutouts, isLoading, error, onRetry } = props;

  if (isLoading && shoutouts.length === 0) {
    return <LoadingGrid />;
  }

  if (error && shoutouts.length === 0) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (shoutouts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={GRID_CLASS}>
      <AnimatePresence>
        {shoutouts.map((shoutout) => (
          <ShoutoutCard key={shoutout.id} shoutout={shoutout} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Single shoutout card: a compact, calmly animated presentation of one
// Shoutout row. The left accent border and emoji "well" are derived from
// getEmojiTheme so the color mapping lives in exactly one place. The
// relative-timestamp formatter below is only used here, so it stays local
// rather than moving into lib/.

import { motion, useReducedMotion } from "framer-motion";
import type { Shoutout } from "@/types/shoutout";
import { getEmojiTheme } from "@/lib/emojiTheme";
import { cn } from "@/lib/utils";

export interface ShoutoutCardProps {
  shoutout: Shoutout;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RECENT_THRESHOLD_MS = 7 * DAY_MS;

function formatRelativeTime(createdAt: string): string {
  const created = new Date(createdAt);
  const elapsedMs = Date.now() - created.getTime();

  if (elapsedMs < MINUTE_MS) {
    return "just now";
  }
  if (elapsedMs < HOUR_MS) {
    return `${Math.floor(elapsedMs / MINUTE_MS)}m ago`;
  }
  if (elapsedMs < DAY_MS) {
    return `${Math.floor(elapsedMs / HOUR_MS)}h ago`;
  }
  if (elapsedMs < RECENT_THRESHOLD_MS) {
    return `${Math.floor(elapsedMs / DAY_MS)}d ago`;
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(created);
}

export function ShoutoutCard(props: ShoutoutCardProps): JSX.Element {
  const { shoutout } = props;
  const theme = getEmojiTheme(shoutout.emoji);
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
      className={cn(
        "rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900",
        "border-l-4 sm:p-5",
        theme.border,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl leading-none",
            theme.well,
          )}
        >
          <span role="img" aria-label={theme.label}>
            {shoutout.emoji}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="break-words font-medium text-slate-900 dark:text-slate-100">
            {shoutout.from_name} <span aria-hidden="true">→</span> {shoutout.to_name}
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">
            {shoutout.message}
          </p>
          <time
            dateTime={shoutout.created_at}
            className="mt-3 block text-xs text-slate-500 dark:text-slate-400"
          >
            {formatRelativeTime(shoutout.created_at)}
          </time>
        </div>
      </div>
    </motion.div>
  );
}

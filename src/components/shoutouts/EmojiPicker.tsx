// Accessible emoji chooser for the shoutout form's "emoji" field. Renders
// EMOJI_ALLOWLIST as a WAI-ARIA radiogroup with roving tabindex: Tab enters
// and exits the group exactly once, arrow keys move the checked selection
// between emoji (wrapping at either end), and Space/Enter activate the
// focused button via native <button> semantics. See
// docs/DESIGN_SYSTEM.md §3 (emoji picker) and §4 (accessibility).

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { EMOJI_ALLOWLIST } from "@/types/shoutout";
import type { Emoji } from "@/types/shoutout";
import { cn } from "@/lib/utils";

export interface EmojiPickerProps {
  value: Emoji | null;
  onChange: (emoji: Emoji) => void;
  error?: string;
  id: string;
}

function arrowKeyDelta(key: string): -1 | 1 | null {
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return 1;
    case "ArrowLeft":
    case "ArrowUp":
      return -1;
    default:
      return null;
  }
}

export function EmojiPicker(props: EmojiPickerProps): JSX.Element {
  const { value, onChange, error, id } = props;
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const errorId = `${id}-error`;
  const checkedIndex = value ? EMOJI_ALLOWLIST.indexOf(value) : -1;

  function focusIndex(index: number): void {
    buttonRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const delta = arrowKeyDelta(event.key);
    if (delta === null) {
      return;
    }
    event.preventDefault();

    if (checkedIndex === -1) {
      // Nothing checked yet: the first arrow press just checks the button
      // that already holds focus, matching the native <input type="radio">
      // group convention instead of skipping past it.
      onChange(EMOJI_ALLOWLIST[index]);
      return;
    }

    const length = EMOJI_ALLOWLIST.length;
    const nextIndex = (checkedIndex + delta + length) % length;
    onChange(EMOJI_ALLOWLIST[nextIndex]);
    focusIndex(nextIndex);
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Pick an emoji"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className="flex flex-wrap gap-2"
      >
        {EMOJI_ALLOWLIST.map((emoji, index) => {
          const isChecked = value === emoji;
          const isTabbable = checkedIndex === -1 ? index === 0 : isChecked;

          return (
            <button
              key={emoji}
              type="button"
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              role="radio"
              aria-checked={isChecked}
              tabIndex={isTabbable ? 0 : -1}
              onClick={() => onChange(emoji)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl text-2xl opacity-70 transition",
                "hover:opacity-100 focus-visible:opacity-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2",
                isChecked && "scale-110 opacity-100 ring-2 ring-green-700",
              )}
            >
              {emoji}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

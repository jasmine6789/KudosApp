// Generic labeled multi-line input primitive, same label/error/aria
// contract as Input.tsx, for a <textarea>. Deliberately does not render a
// character counter: the owning form holds the live value and the
// remaining-count logic, this primitive only knows about its own field.

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  id: string;
}

export function Textarea({ label, error, id, className, ...rest }: TextareaProps): JSX.Element {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <textarea
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-24 resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900",
          "placeholder:text-slate-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-slate-100 dark:placeholder:text-slate-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-70",
          error && "border-rose-500 dark:border-rose-500",
          className,
        )}
      />
      {error ? (
        <p id={errorId} className="text-sm text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// Generic labeled single-line input primitive. Pairs a real <label>, the
// <input>, and an optional inline error message, wiring aria-invalid and
// aria-describedby together automatically. Feature components own
// validation logic (Zod parse results, touched state) and just hand back
// the resulting error string; this component only renders the contract.

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  id: string;
}

export function Input({ label, error, id, className, ...rest }: InputProps): JSX.Element {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900",
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

// The board's only write path: a controlled form for from_name/to_name/
// message/emoji. Field errors are derived by re-running the shared Zod
// schema (shoutoutInputSchema) against the live values on every render and
// gating each field's message behind that field's own "touched" flag (or a
// submit attempt), so inline feedback tracks blur *and* keystrokes without a
// second parsing path. Submission delegates to useCreateShoutout, which owns
// in-flight/error state; this component only owns the form's own fields and
// the success/failure banners layered around it. A successful submit also
// fires a short confetti burst (src/lib/confetti.ts), skipped under
// prefers-reduced-motion.

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmojiPicker } from "@/components/shoutouts/EmojiPicker";
import { useCreateShoutout } from "@/hooks/useCreateShoutout";
import { shoutoutInputSchema } from "@/types/shoutout";
import type { Emoji, Shoutout } from "@/types/shoutout";
import { cn } from "@/lib/utils";
import { celebrateNewShoutout } from "@/lib/confetti";

export interface ShoutoutFormProps {
  onCreated: (shoutout: Shoutout) => void;
}

interface FormValues {
  from_name: string;
  to_name: string;
  message: string;
  emoji: Emoji | null;
}

type FormField = keyof FormValues;
type TouchedState = Record<FormField, boolean>;
type FieldErrors = Partial<Record<FormField, string>>;

const EMPTY_VALUES: FormValues = { from_name: "", to_name: "", message: "", emoji: null };
const EMPTY_TOUCHED: TouchedState = {
  from_name: false,
  to_name: false,
  message: false,
  emoji: false,
};

const MESSAGE_MAX_LENGTH = 280;
const MESSAGE_WARNING_AT = MESSAGE_MAX_LENGTH - 20;
const SUCCESS_BANNER_MS = 3000;

function getFieldErrors(values: FormValues): FieldErrors {
  const result = shoutoutInputSchema.safeParse(values);
  if (result.success) {
    return {};
  }
  const flattened = result.error.flatten().fieldErrors;
  return {
    from_name: flattened.from_name?.[0],
    to_name: flattened.to_name?.[0],
    message: flattened.message?.[0],
    emoji: flattened.emoji?.[0],
  };
}

export function ShoutoutForm(props: ShoutoutFormProps): JSX.Element {
  const { onCreated } = props;
  const { submit, isSubmitting, error } = useCreateShoutout();
  const prefersReducedMotion = useReducedMotion();

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [touched, setTouched] = useState<TouchedState>(EMPTY_TOUCHED);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const fieldErrors = useMemo(() => getFieldErrors(values), [values]);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }
    const timeoutId = setTimeout(() => setShowSuccess(false), SUCCESS_BANNER_MS);
    return () => clearTimeout(timeoutId);
  }, [showSuccess]);

  function visibleError(field: FormField): string | undefined {
    return touched[field] || hasSubmitted ? fieldErrors[field] : undefined;
  }

  function updateField<K extends FormField>(field: K, value: FormValues[K]): void {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field: FormField): void {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setShowSuccess(false);
    setHasSubmitted(true);
    setTouched({ from_name: true, to_name: true, message: true, emoji: true });

    const parsed = shoutoutInputSchema.safeParse(values);
    if (!parsed.success) {
      return;
    }

    const created = await submit(parsed.data);
    if (created) {
      onCreated(created);
      setValues(EMPTY_VALUES);
      setTouched(EMPTY_TOUCHED);
      setHasSubmitted(false);
      setShowSuccess(true);
      celebrateNewShoutout(prefersReducedMotion ?? false);
    }
  }

  const messageLength = values.message.length;
  const isMessageNearLimit = messageLength >= MESSAGE_WARNING_AT;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="flex flex-col gap-4 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900 sm:p-5"
    >
      {showSuccess ? (
        <motion.p
          aria-live="polite"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
          className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
        >
          Shoutout posted! 🎉
        </motion.p>
      ) : null}

      {error ? (
        <p aria-live="polite" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <fieldset disabled={isSubmitting} className="contents">
        <Input
          id="shoutout-from-name"
          label="From"
          value={values.from_name}
          onChange={(event) => updateField("from_name", event.target.value)}
          onBlur={() => markTouched("from_name")}
          error={visibleError("from_name")}
          autoComplete="off"
        />

        <Input
          id="shoutout-to-name"
          label="To"
          value={values.to_name}
          onChange={(event) => updateField("to_name", event.target.value)}
          onBlur={() => markTouched("to_name")}
          error={visibleError("to_name")}
          autoComplete="off"
        />

        <div className="flex flex-col gap-1.5">
          <Textarea
            id="shoutout-message"
            label="Message"
            value={values.message}
            onChange={(event) => updateField("message", event.target.value)}
            onBlur={() => markTouched("message")}
            error={visibleError("message")}
            maxLength={MESSAGE_MAX_LENGTH}
          />
          <p
            className={cn(
              "text-right text-xs text-slate-400",
              isMessageNearLimit && "font-bold text-rose-600",
            )}
          >
            {messageLength} / {MESSAGE_MAX_LENGTH}
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Emoji
          </span>
          <EmojiPicker
            id="shoutout-emoji"
            value={values.emoji}
            onChange={(emoji) => {
              updateField("emoji", emoji);
              markTouched("emoji");
            }}
            error={visibleError("emoji")}
          />
        </div>

        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Post shoutout
        </Button>
      </fieldset>
    </form>
  );
}

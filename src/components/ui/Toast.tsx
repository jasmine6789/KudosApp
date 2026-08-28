// Generic floating confirmation toast, portaled to document.body so it sits
// fixed to the viewport regardless of where it is mounted in the tree (an
// ancestor with its own framer-motion transform would otherwise trap a
// position:fixed descendant inside its own bounding box). Rendered above the
// confetti canvas (src/lib/confetti.ts also appends to document.body), so
// the confirmation message stays readable through a busy burst instead of
// getting lost under it.

import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface ToastProps {
  message: string;
  visible: boolean;
}

const TOAST_Z_INDEX = 10_000;

export function Toast(props: ToastProps): JSX.Element | null {
  const { message, visible } = props;
  const prefersReducedMotion = useReducedMotion();

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 flex justify-center px-4 sm:top-6"
      style={{ zIndex: TOAST_Z_INDEX }}
    >
      <AnimatePresence>
        {visible ? (
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.9 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 30 }
            }
            className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

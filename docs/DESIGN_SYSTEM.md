# Design System — Team Shoutout Board

Visual, interaction, and accessibility standards for the UI. The goal is a board that feels intentional and calm, not a raw CRUD form — kudos are a small moment of delight, and the UI should reflect that without becoming noisy.

---

## 1. Color Tokens & Theme

Base palette built on Tailwind's default scale — no custom color config needed beyond what's listed.

| Token          | Tailwind class                                    | Usage                                     |
| -------------- | ------------------------------------------------- | ----------------------------------------- |
| Background     | `bg-slate-50` (light) / `bg-slate-950` (dark)     | App background                            |
| Surface        | `bg-white` / `bg-slate-900`                       | Cards, form panel                         |
| Border         | `border-slate-200` / `border-slate-800`           | Card/input borders                        |
| Primary        | `indigo-600` (`bg-indigo-600`, `text-indigo-600`) | Submit button, active states, focus rings |
| Primary hover  | `indigo-700`                                      | Button hover                              |
| Text — primary | `text-slate-900` / `text-slate-100`               | Headings, message body                    |
| Text — muted   | `text-slate-500` / `text-slate-400`               | Timestamps, helper text, char counter     |
| Success        | `emerald-600`                                     | Submit success toast                      |
| Error          | `rose-600`                                        | Validation errors, failed fetch state     |

### Surface treatment

- Cards use `bg-white dark:bg-slate-900`, `rounded-2xl`, `border border-slate-200 dark:border-slate-800`, `shadow-sm`. Avoid heavy drop shadows — this is a calm board, not a hero landing page.
- The page background may use a very subtle gradient for warmth: `bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900`. Keep it subtle enough that it reads as texture, not decoration.

### Dark Mode

- Implemented via Tailwind's `class` strategy (`darkMode: "class"` in `tailwind.config.ts`), toggled by a `<button>` in the header that flips a `dark` class on `<html>` and persists the choice to `localStorage`.
- Every color token above has a dark-mode pairing — never ship a component with only a light-mode color.

---

## 2. Emoji Card Mapping

Each shoutout card gets a subtle accent derived from its emoji, applied as a left border and a faint icon-well background — not a full-card color wash, which would fight with dark mode and readability.

| Emoji | Meaning               | Accent (`border-l-*` + icon well)                                   |
| ----- | --------------------- | ------------------------------------------------------------------- |
| 🔥    | On fire / crushing it | `border-l-orange-500`, well `bg-orange-50 dark:bg-orange-500/10`    |
| 👏    | Nice work             | `border-l-amber-500`, well `bg-amber-50 dark:bg-amber-500/10`       |
| ❤️    | Appreciation          | `border-l-rose-500`, well `bg-rose-50 dark:bg-rose-500/10`          |
| 🚀    | Shipped something big | `border-l-indigo-500`, well `bg-indigo-50 dark:bg-indigo-500/10`    |
| 🎉    | Celebration           | `border-l-fuchsia-500`, well `bg-fuchsia-50 dark:bg-fuchsia-500/10` |
| 🌟    | Standout moment       | `border-l-yellow-500`, well `bg-yellow-50 dark:bg-yellow-500/10`    |
| 💡    | Good idea             | `border-l-sky-500`, well `bg-sky-50 dark:bg-sky-500/10`             |
| 🙌    | Team win              | `border-l-teal-500`, well `bg-teal-50 dark:bg-teal-500/10`          |

Implement this as a single lookup map (`src/lib/emojiTheme.ts`) keyed by the same `EMOJI_ALLOWLIST` used for validation — the allowlist and the color mapping must never drift out of sync (adding an emoji to one without the other is a bug).

---

## 3. Form State UX

The form (`ShoutoutForm`) is the highest-stakes surface in the app — it's the only write path. Every state below must be visually distinct.

| State                       | Spec                                                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Idle**                    | Inputs at rest, submit button `bg-indigo-600` and enabled once the form is valid.                                                                                                                                               |
| **Invalid field (touched)** | Red border (`border-rose-500`), inline message below the field in `text-rose-600 text-sm`, driven by the Zod schema's error map — no generic "invalid input."                                                                   |
| **Character counter**       | Live `X / 280` counter under the message field, `text-slate-400 text-xs`, flips to `text-rose-600` and bold when within 20 characters of the limit or over.                                                                     |
| **Submitting**              | Submit button shows a spinner (Lucide `Loader2`, `animate-spin`) in place of its label, `disabled`, `opacity-70`, `cursor-not-allowed`. All fields become `disabled` — no editing mid-submit.                                   |
| **Success**                 | Form clears, a brief success toast/inline banner appears (`bg-emerald-50 text-emerald-700`, auto-dismiss ~3s), and the new card animates into the grid (see §4).                                                                |
| **Server error**            | Inline banner above the submit button, `bg-rose-50 text-rose-700`, human-readable copy (never the raw API error string) — e.g. "Couldn't post your shoutout — try again." Form values are preserved so the user doesn't retype. |
| **Emoji picker**            | A row of emoji buttons, not a native `<select>`. Selected emoji gets `ring-2 ring-indigo-500` and a subtle scale (`scale-110`) via Framer Motion; unselected are `opacity-70` until hovered/focused.                            |

---

## 4. Accessibility & Motion

### Accessibility

- Color contrast meets WCAG AA (4.5:1 for body text, 3:1 for large text/icons) in both light and dark themes — verify any new accent color against its background before adding it to §2's table.
- Every form field has a visible, associated `<label>` (not placeholder-as-label).
- Validation errors are linked to their field via `aria-describedby`, and the field itself sets `aria-invalid="true"` when in an error state.
- The emoji picker is a `role="radiogroup"` of `role="radio"` buttons: arrow keys move selection, `Tab` enters/exits the group once, `Space`/`Enter` selects — never a picker that's only usable by mouse.
- Focus states use a visible `ring-2 ring-indigo-500 ring-offset-2` on every interactive element — never `outline-none` without a replacement.
- Toasts/success banners are announced via `aria-live="polite"` so screen reader users don't need to visually scan for confirmation.

### Motion (Framer Motion)

- **Entrance:** new cards animate in with a combined fade + slight rise: `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.25, ease: "easeOut" }}`. Existing cards use `layout` so the grid reflows smoothly rather than jumping.
- **List transitions:** wrap the grid in `AnimatePresence` so cards (in the rare case one is ever removed) animate out rather than disappearing instantly.
- **Micro-interactions:** button hover/press use `whileHover={{ scale: 1.02 }}` / `whileTap={{ scale: 0.98 }}` — small, not bouncy.
- **Respect reduced motion:** wrap animation config behind a `useReducedMotion()` check (Framer Motion's built-in hook) and fall back to an instant appearance for users with `prefers-reduced-motion` set. This is not optional — treat it as a correctness requirement, not a nice-to-have.

### Optimistic UI (if implemented)

- On submit, the new card may be inserted into the local list immediately with a temporary client-generated key, rendered at reduced opacity (`opacity-60`) until the server confirms.
- On server success, swap the temporary card for the server-returned row (with the real `id`/`created_at`) — do not just remove the opacity, since the server is the source of truth for `id` and `created_at`.
- On server failure, remove the optimistic card and restore the form's values plus the error banner from §3 — never leave a "ghost" card that silently fails to reconcile.

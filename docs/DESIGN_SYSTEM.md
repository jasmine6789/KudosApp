# Design System — Team Shoutout Board

Visual, interaction, and accessibility standards for the UI. The goal is a board that feels
intentional and confident, not a raw CRUD form — kudos are a small moment of delight, and the UI
should reflect that without becoming noisy.

## 0. Inspiration & how it was adapted

This design system is adapted from **[secondsight.ai](https://www.secondsight.ai/)** — an
enterprise SaaS marketing site with a distinctive look: the **Outfit** typeface, bold uppercase
headlines, a vivid green primary action color, fully pill-shaped buttons, flat light-gray content
blocks with no border or shadow, and dramatic full-bleed black sections used for emphasis.

The translation to this app kept every one of those signature moves, with one deliberate,
documented deviation:

- **The button green was darkened for accessibility.** SecondSight's actual button color is
  `rgb(57, 202, 86)` (`#39CA56`). White text on that exact color measures roughly **2.15:1**
  contrast — well under the WCAG AA floor this project already holds itself to (4.5:1 for body
  text). Rather than importing an inaccessible color wholesale, buttons use Tailwind's `green-700`
  (`#15803D`, ~**5.0:1** contrast with white) — a deeper shade of the same hue, so it still reads
  unmistakably as "the same green," while actually meeting the bar. The brighter tone is not used
  anywhere text sits on top of it.
- **Everything else was carried over directly**: the pill-shaped buttons, the flat `#F5F5F5`-style
  card surfaces with no border/shadow, the bold uppercase page title inside a full-bleed black
  header band, and the Outfit typeface.

---

## 1. Color Tokens & Theme

Built on Tailwind's default palette — no bespoke hex values maintained outside this table, so
the whole app stays traceable back to a single, standard scale.

| Token           | Tailwind class                                  | Usage                                                                                                                |
| --------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Page background | `bg-white` / `dark:bg-neutral-950`              | App background (true black in dark mode, matching SecondSight's own high-contrast sections, not a navy-tinted dark)  |
| Header band     | `bg-black`                                      | Full-bleed header — always black, regardless of the light/dark toggle, echoing SecondSight's dramatic black sections |
| Surface / card  | `bg-neutral-100` / `dark:bg-neutral-900`        | Cards, the form panel, empty/error/loading states — flat, no border, no shadow                                       |
| Primary         | `green-700` (`bg-green-700`, hover `green-800`) | Submit button, focus rings, emoji-picker selection ring                                                              |
| Text — primary  | `text-slate-900` / `text-slate-100`             | Headings, message body                                                                                               |
| Text — muted    | `text-slate-500` / `text-slate-400`             | Timestamps, helper text, character counter                                                                           |
| Success         | `emerald-600`                                   | Submit success toast                                                                                                 |
| Error           | `rose-600`                                      | Validation errors, failed fetch state                                                                                |

### Surface treatment

- Cards and the form panel use `bg-neutral-100 dark:bg-neutral-900`, `rounded-2xl`, **no border,
  no shadow**. This is the single biggest visual departure from the app's original look (which
  used white cards with a thin border and `shadow-sm`) — SecondSight's own stat blocks are flat
  gray rectangles with zero chrome, and that's the effect being matched here.
- The page background is flat (`bg-white` / `dark:bg-neutral-950`) — no gradient. Visual interest
  comes from the black header band and the flat card surfaces, not background texture.

### Buttons

- **Primary** (`Button` with `variant="primary"`): `rounded-full` (a true pill, not just a rounded
  rectangle), `bg-green-700 hover:bg-green-800`, white text, `font-semibold tracking-wide`.
- **Ghost/secondary**: `rounded-full`, transparent background, a thin `border-slate-300` (light) /
  `border-neutral-700` (dark) — matching SecondSight's white-background secondary button.
- Buttons are the one place pill shape is used everywhere; form inputs stay conventionally
  rectangular (`rounded-xl`) — a pill-shaped text field reads as unusual/broken, not stylish.

### Dark Mode

- Implemented via Tailwind's `class` strategy (`darkMode: "class"` in `tailwind.config.js`),
  toggled by a `<button>` in the header that flips a `dark` class on `<html>` and persists the
  choice to `localStorage`.
- Dark mode uses the **`neutral`** scale, not `slate` — a true, neutral black (`neutral-950`,
  `#0A0A0A`) rather than a blue-tinted dark, matching the pure black SecondSight uses for its own
  high-contrast sections. `slate` is still used for body text colors in both themes (it was already
  close to SecondSight's own measured body-text color, `#3B4351`, so it stayed unchanged).
- Every color token above has a dark-mode pairing — never ship a component with only a
  light-mode color.

---

## 2. Emoji Card Mapping

Each shoutout card gets a subtle accent derived from its emoji, applied as a left border and a
faint icon-well background — not a full-card color wash, which would fight with dark mode and
readability. This mapping is a distinct feature of this app (SecondSight's own site has no
equivalent), so its 8 hues were kept as-is through the redesign; only the card's own surface
(background/border/shadow) changed to match the new flat treatment.

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

Implemented as a single lookup map (`src/lib/emojiTheme.ts`) keyed by the same `EMOJI_ALLOWLIST`
used for validation — the allowlist and the color mapping must never drift out of sync (adding an
emoji to one without the other is a bug; a runtime guard in that file throws if they ever do).

---

## 3. Form State UX

The form (`ShoutoutForm`) is the highest-stakes surface in the app — it's the only write path.
Every state below must be visually distinct.

| State                       | Spec                                                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Idle**                    | Inputs at rest, submit button `bg-green-700`, pill-shaped, enabled once the form is valid.                                                                                                                                      |
| **Invalid field (touched)** | Red border (`border-rose-500`), inline message below the field in `text-rose-600 text-sm`, driven by the Zod schema's error map — no generic "invalid input."                                                                   |
| **Character counter**       | Live `X / 280` counter under the message field, `text-slate-400 text-xs`, flips to `text-rose-600` and bold when within 20 characters of the limit or over.                                                                     |
| **Submitting**              | Submit button shows a spinner (Lucide `Loader2`, `animate-spin`) in place of its label, `disabled`, `opacity-70`, `cursor-not-allowed`. All fields become `disabled` — no editing mid-submit.                                   |
| **Success**                 | Form clears, a brief success toast/inline banner appears (`bg-emerald-50 text-emerald-700`, auto-dismiss ~3s), and the new card animates into the grid (see §4).                                                                |
| **Server error**            | Inline banner above the submit button, `bg-rose-50 text-rose-700`, human-readable copy (never the raw API error string) — e.g. "Couldn't post your shoutout — try again." Form values are preserved so the user doesn't retype. |
| **Emoji picker**            | A row of emoji buttons, not a native `<select>`. Selected emoji gets `ring-2 ring-green-700` and a subtle scale (`scale-110`) via Framer Motion; unselected are `opacity-70` until hovered/focused.                             |

---

## 4. Accessibility & Motion

### Accessibility

- Color contrast meets WCAG AA (4.5:1 for body text, 3:1 for large text/icons) in both light and
  dark themes — verify any new accent color against its background before adding it to §2's table.
  (This is exactly the rule that ruled out SecondSight's literal button green — see §0.)
- Every form field has a visible, associated `<label>` (not placeholder-as-label).
- Validation errors are linked to their field via `aria-describedby`, and the field itself sets
  `aria-invalid="true"` when in an error state.
- The emoji picker is a `role="radiogroup"` of `role="radio"` buttons: arrow keys move selection,
  `Tab` enters/exits the group once, `Space`/`Enter` selects — never a picker that's only usable
  by mouse.
- Focus states use a visible `ring-2 ring-green-700 ring-offset-2` on every interactive element
  (the header's `ThemeToggle`, which always sits on black, uses `ring-green-500
ring-offset-black` instead so the ring stays visible against that fixed dark background) —
  never `outline-none` without a replacement.
- Toasts/success banners are announced via `aria-live="polite"` so screen reader users don't need
  to visually scan for confirmation.

### Motion (Framer Motion)

- **Entrance:** new cards animate in with a combined fade + slight rise: `initial={{ opacity: 0, y: 12 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.25, ease: "easeOut" }}`. Existing cards use `layout` so the grid reflows smoothly rather than jumping.
- **List transitions:** wrap the grid in `AnimatePresence` so cards (in the rare case one is ever removed) animate out rather than disappearing instantly.
- **Micro-interactions:** button hover/press use `whileHover={{ scale: 1.02 }}` / `whileTap={{ scale: 0.98 }}` — small, not bouncy.
- **Respect reduced motion:** wrap animation config behind a `useReducedMotion()` check (Framer Motion's built-in hook) and fall back to an instant appearance for users with `prefers-reduced-motion` set. This is not optional — treat it as a correctness requirement, not a nice-to-have.

### Optimistic UI

- On a successful submit, the server-confirmed shoutout (with its real `id`/`created_at`) is
  prepended straight into the grid — no full refetch, no temporary unconfirmed card to reconcile
  later. See the README's "techniques" section for why this was chosen over full optimistic UI.

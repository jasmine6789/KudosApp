# Team Shoutout Board

A small internal tool for giving teammates quick public kudos. Anyone can open the board, see every
shoutout that's been posted (newest first), and add their own — no sign-up, no login, no accounts.
You type who it's from, who it's for, a short message, and pick an emoji, and it shows up on the
board for everyone.

It's intentionally a small app. The interesting part isn't the feature count — it's a frontend, an
API, and a database all working together cleanly, with the kind of details (validation, error
handling, accessibility, tests) that separate a "looks done" project from one that actually is.

**Live stack:** React + TypeScript on the frontend, a single Supabase Edge Function (Deno) as the
API, Supabase Postgres for storage. No custom backend server to run or host — Supabase provides all
of that as a managed service.

---

## How it's put together

**The database** is one table, `shoutouts`, with the five fields the board actually needs:
`id`, `from_name`, `to_name`, `message`, `emoji`, `created_at`. Row Level Security is turned on, and
only two policies exist: anyone can `SELECT`, anyone can `INSERT`. There's no `UPDATE` or `DELETE`
policy at all — with RLS on and no matching policy, Postgres denies those operations by default, so
"no editing, no deleting" is enforced by the database itself, not just by the app choosing not to
expose those buttons. The migration SQL and a small seed script (five sample shoutouts, so the board
isn't empty on first run) both live in `supabase/`.

**The API** is one Supabase Edge Function — a small Deno script that handles `GET` (list everything,
newest first) and `POST` (validate and insert). There's no framework here, just `Deno.serve` and a
couple of plain functions, which keeps the whole thing readable in one file. Every request gets CORS
headers, `OPTIONS` preflight is handled explicitly, and every response comes back in one of two
shapes: `{ success: true, data }` or `{ success: false, error, details? }`. That consistency means the
frontend never has to guess what a response looks like.

Validation happens twice, and deliberately so. The **Edge Function** validates every `POST` body with
a Zod schema before it goes anywhere near the database — that's the real security boundary, since a
client can send anything regardless of what the UI allows. The **frontend** has its own copy of
essentially the same schema, used only to give people instant feedback while typing (a red border and
a message the moment a field goes invalid, no round trip to the server needed). If the two schemas
ever drift apart, the backend one wins — it's the one actually protecting the database.

**The frontend** is a Vite + React app with a fairly conventional shape: generic, reusable pieces live
in `src/components/ui/` (a `Button`, an `Input`, a `Spinner`, a `Textarea`) and know nothing about
shoutouts specifically; the feature itself lives in `src/components/shoutouts/` (`ShoutoutForm`,
`ShoutoutCard`, `ShoutoutGrid`, `EmojiPicker`). Data fetching and mutation logic don't live inside
components at all — they're pulled out into two hooks, `useShoutouts` (owns the list, loading state,
and error state) and `useCreateShoutout` (owns the submit-in-flight state for the form). Components
just call the hooks and render what comes back; nothing does its own `fetch`.

---

## The techniques, and why they're there

A few choices are worth calling out specifically, because they're the kind of thing that's easy to
skip on a small project and easy to notice when they're missing:

- **Strict TypeScript, no escape hatches.** There isn't a single `any` anywhere in the codebase —
  ESLint and `tsc --noEmit` both fail the build if one shows up. Every exported function has an
  explicit return type rather than relying on inference across a module boundary, which makes it much
  harder for a type to quietly change shape somewhere and only surface as a runtime bug.
- **The Edge Function never leaks internals.** A failed database query gets logged server-side with
  the real Postgres error, but the client only ever sees a short, generic message like "Failed to
  create shoutout." No stack traces, no raw error strings, no table names, ever cross that boundary.
  This is asserted in the test suite, not just assumed.
- **The emoji picker is a real accessible widget, not a styled `<select>` or a row of clickable
  `<div>`s.** It's built as a proper `radiogroup`/`radio` pattern: one tab stop for the whole group,
  arrow keys move the selection (wrapping at either end), and the currently-selected emoji is the only
  one in the tab order — the same behavior a native radio button group gives you for free, reimplemented
  by hand because a styled emoji grid isn't a native form control.
- **Reduced motion is treated as correctness, not polish.** New cards animate in with a small fade and
  rise, but that's fully skipped — not just made shorter — for anyone whose OS says they'd rather not
  see it (`prefers-reduced-motion`, read via Framer Motion's `useReducedMotion` hook).
- **Dark mode isn't a CSS trick bolted on at the end.** Every single color in the design has a
  dark-mode pairing from the start (Tailwind's `dark:` variant), the toggle persists your choice to
  `localStorage`, and it falls back to your OS's preference the first time you visit.
- **The one place that's allowed to call `fetch` is `src/lib/api.ts`.** Everything else — hooks,
  components — goes through it. That's what makes it possible to write hook and component tests that
  never touch the network: they mock that one module, not the global `fetch`.

---

## Testing

Both runtimes are tested, using each ecosystem's own tools rather than forcing one test runner across
a Node/Vite project and a Deno project:

- **Frontend (Vitest + React Testing Library):** 70 tests across the shared validation schema, the
  emoji theme, both data hooks, and every component. Coverage sits at 98%+ overall, with every
  component file at 100%. The handful of lines that aren't covered are genuinely unreachable in a
  browser (an `SSR`-style guard for a project that never runs server-side) or "should never happen"
  invariant checks — they're called out as such rather than padded with tests that don't test
  anything real.
- **Edge Function (Deno's built-in test runner):** 18 tests covering validation edge cases (a message
  one character over the limit, an emoji outside the allowlist, a missing field), the `GET`/`POST`
  success paths, the `OPTIONS`/CORS preflight, and — importantly — that a raw database error never
  makes it into an API response.

Every test was actually run, not just written: `npm run lint`, `npm run typecheck`, the full Vitest
suite, `npm run build`, and the full Deno lint/format/type-check/test chain all pass clean as this
repo stands. The app was also driven in a real headless browser (form validation, character counter,
submit, dark-mode toggle) to confirm it actually works, not just that its unit tests do.

---

## Getting it running

### What you'll need installed

| Tool           | Version | What it's for                                                             |
| -------------- | ------- | ------------------------------------------------------------------------- |
| Node.js        | 20+     | Running the frontend                                                      |
| npm            | 10+     | Installing dependencies                                                   |
| Docker Desktop | latest  | Runs Supabase's local dev stack (Postgres, Studio, the Edge Runtime)      |
| Deno           | 1.44+   | Only needed if you want to run the Edge Function's own tests/lint locally |

The Supabase CLI doesn't need a separate install — every command below runs it through `npx`.

### 1. Install and set up your environment file

```bash
npm install
cp .env.example .env.local
```

`.env.local` is where your real (local) keys go, and it's already excluded from git — nothing in this
project ever hardcodes a key or secret anywhere in the source; everything is read from environment
variables, on both the frontend (`import.meta.env.VITE_*`) and the Edge Function (`Deno.env.get(...)`).

### 2. Start the local database

```bash
npx supabase start     # boots Postgres, Studio, and the Edge Runtime in Docker
npx supabase db reset  # applies the migration and seeds 5 sample shoutouts
```

`supabase start` prints a URL and a couple of keys the first time it runs — copy the `anon` key into
`.env.local` as `VITE_SUPABASE_ANON_KEY`. (You can browse the local database directly at
`http://127.0.0.1:54323` if you want to poke around in Studio.)

One thing worth knowing: when you serve the Edge Function locally (next step), Supabase automatically
injects its _own_ `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` pointing at your local stack, and
ignores whatever you've put in `.env.local` for those two specific names. That's not a bug — Supabase
reserves that prefix — it's just how local development works. You still need real values for those
two when deploying for real, which is why they're documented in `.env.example`.

### 3. Run it (two terminals)

```bash
# Terminal 1 — the API
npx supabase functions serve shoutouts --env-file .env.local --no-verify-jwt

# Terminal 2 — the frontend
npm run dev
```

Open `http://localhost:5173` and you should see the board, seeded with five sample shoutouts, ready
to post a new one.

### 4. Run the checks

```bash
npm run lint
npm run typecheck
npm run test            # 70 tests
npm run test:coverage
npm run build

# Edge Function — needs Deno installed (https://deno.land/#installation)
deno lint supabase/functions/
deno fmt --check supabase/functions/
deno check supabase/functions/shoutouts/index.ts
deno test --allow-env --allow-net supabase/functions/shoutouts/
```

Everything above passes on this repo as delivered.

---

## Deploying

You're deploying the frontend to **Vercel**, which this repo is already set up for — there's a
`vercel.json` pinning the build command and output directory, so connecting the GitHub repo (or
running `vercel --prod`) should just work. The one thing to do by hand is set your environment
variables in the Vercel project's dashboard (never commit these):

| Variable                      | Value                                                 |
| ----------------------------- | ----------------------------------------------------- |
| `VITE_SUPABASE_URL`           | `https://<your-project-ref>.supabase.co`              |
| `VITE_SUPABASE_ANON_KEY`      | your deployed project's public anon key               |
| `VITE_SUPABASE_FUNCTIONS_URL` | `https://<your-project-ref>.supabase.co/functions/v1` |

Before that will actually return data, the Edge Function and the database migration need to be pushed
to a real (hosted) Supabase project once:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
npx supabase db push
npx supabase functions deploy shoutouts
```

**You don't need Render, or any other server host.** There's no custom backend process here to run —
the API _is_ the Supabase Edge Function, and it runs on Supabase's own infrastructure the moment you
`deploy` it. Vercel serves the static frontend; Supabase serves the API and the database. That's the
whole stack.

A `Dockerfile` is also included (multi-stage: builds the frontend, serves it with a small nginx
image) in case you ever want to run this somewhere other than Vercel — see the comments at the top of
the `Dockerfile` for the exact build/run commands. It's not something you need for a Vercel deploy;
it's there as an alternative.

---

## What's beyond the core brief

The floor — a validated `GET`/`POST` API, a form, a grid, real storage — is all there. On top of that:

- **Color-coded cards.** Each of the 8 allowed emoji has its own accent color (a left border + a
  matching icon background), defined in one place (`src/lib/emojiTheme.ts`) and kept from silently
  drifting out of sync with the validation allowlist by a small runtime check.
- **Dark mode**, persisted per-visitor, falling back to your OS setting on first visit.
- **A live character counter** on the message field that turns red once you're within 20 characters
  of the 280-character limit.
- **New cards animate in** (a small fade + rise), fully respecting reduced-motion preferences.
- **Posting feels instant** — the moment the server confirms your shoutout, it's added straight to the
  top of the grid with the real server-generated `id` and timestamp, no full page refetch needed.
- **A genuinely accessible emoji picker** — keyboard-operable, not just clickable.
- Both a Vercel-ready config and a working Docker image, so however you'd like to host it, it's ready.

## What's not perfect (and why that's a deliberate call, not an oversight)

- `npm audit` flags a couple of advisories in Vite's **development server** (not anything that ships
  in the production build). Fixing them cleanly means a major-version bump of Vite that hasn't been
  tested against this setup — for a project this size, that felt like a worse trade than leaving a
  documented, dev-only advisory in place.
- A handful of lines are intentionally left without a test: a couple of guard clauses that only matter
  in an environment this app doesn't run in (server-side rendering), and one "this should never
  happen" internal consistency check. Writing a test that forces those to execute would mean testing
  something that can't actually occur — that's padding a coverage number, not testing behavior, so
  they're called out instead.

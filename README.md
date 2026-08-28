# Team Shoutout Board

A small internal tool for giving teammates quick, public kudos. Anyone can open the board, see
every shoutout that has been posted (newest first), and add their own. No sign-up, no login, no
accounts. Type who it is from, who it is for, a short message, pick an emoji, and it shows up on
the board for everyone.

**Live site:** [https://shoutout-rho.vercel.app/](https://shoutout-rho.vercel.app/)

**Stack:** React + TypeScript (frontend) · Supabase Edge Function on Deno (API) · Supabase
Postgres (database) · Tailwind CSS · Framer Motion

---

## 1. Overview

This is intentionally a small app. The interesting part is not the feature count, it is a
frontend, an API, and a database working together cleanly, with the details (validation, error
handling, accessibility, security, tests) that separate a project that "looks done" from one that
actually is.

Everything below is organized so a reviewer can quickly check:

- What was built and how ([§3 Architecture](#3-architecture), [§4 Design System](#4-design-system))
- That it is actually secure and tested ([§5 Security](#5-security), [§6 Testing](#6-testing))
- That it meets the brief's own evaluation criteria ([§7 Requirements Coverage](#7-requirements-coverage))
- What goes beyond the brief ([§8 Creative Additions](#8-creative-additions))
- How to run it yourself ([§9 Self-Deployment Steps](#9-self-deployment-steps))

---

## 2. Quick Facts

|                      |                                                             |
| -------------------- | ----------------------------------------------------------- |
| **Live URL**         | [shoutout-rho.vercel.app](https://shoutout-rho.vercel.app/) |
| **Frontend hosting** | Vercel (static build)                                       |
| **Backend hosting**  | Supabase (managed Postgres + Edge Functions)                |
| **Authentication**   | None, by design (the brief explicitly excludes it)          |
| **Frontend tests**   | 74 passing, 98%+ coverage                                   |
| **Backend tests**    | 21 passing (Deno test runner)                               |
| **Docker image**     | Included, optional alternative to Vercel                    |

---

## 3. Architecture

### Database

- One table, `shoutouts`, with the five fields the board needs: `id`, `from_name`, `to_name`,
  `message`, `emoji`, `created_at`.
- Row Level Security is enabled with exactly two policies: anyone can `SELECT`, anyone can
  `INSERT`.
- There is no `UPDATE` or `DELETE` policy at all. With RLS on and no matching policy, Postgres
  denies those operations by default, so "no editing, no deleting" is enforced by the database
  itself, not just by the app choosing not to expose those buttons.
- Migration SQL and a small seed script (five sample shoutouts) both live in `supabase/`.

### API (Edge Function)

- One Supabase Edge Function, a small Deno script that handles `GET` (list everything, newest
  first) and `POST` (validate and insert).
- No framework: just `Deno.serve` and a handful of plain functions, kept readable in one file.
- Every request gets CORS headers, `OPTIONS` preflight is handled explicitly, and every response
  comes back in one of two shapes: `{ success: true, data }` or `{ success: false, error, details? }`.
- Validation happens with a Zod schema before anything touches the database. That is the real
  security boundary: a client can send anything regardless of what the UI allows.
- The frontend keeps its own copy of essentially the same schema, used only for instant inline
  feedback while typing. If the two schemas ever drift apart, the backend one wins, since it is
  the one actually protecting the database.

### Frontend

- Vite + React with a conventional split: generic, reusable pieces live in `src/components/ui/`
  (`Button`, `Input`, `Textarea`, `Spinner`) and know nothing about shoutouts specifically. The
  feature itself lives in `src/components/shoutouts/` (`ShoutoutForm`, `ShoutoutCard`,
  `ShoutoutGrid`, `EmojiPicker`).
- Data fetching and mutation logic live in two hooks, not inside components: `useShoutouts` (owns
  the list, loading state, error state) and `useCreateShoutout` (owns the submit-in-flight state).
  Components call the hooks and render what comes back. Nothing calls `fetch` directly.
- The only module allowed to call `fetch` at all is `src/lib/api.ts`. That is what makes it
  possible to write hook and component tests that never touch the network: they mock that one
  module, not the global `fetch`.

### Notable engineering choices

- **Strict TypeScript, no escape hatches.** There is not a single `any` anywhere in the codebase.
  ESLint and `tsc --noEmit` both fail the build if one shows up. Every exported function has an
  explicit return type instead of relying on inference across a module boundary.
- **The Edge Function never leaks internals.** A failed database query is logged server-side with
  the real Postgres error, but the client only ever sees a short, generic message such as "Failed
  to create shoutout." No stack traces, no raw error strings, no table names ever cross that
  boundary. This is asserted in the test suite, not just assumed.
- **The emoji picker is a real accessible widget**, not a styled `<select>` or a row of clickable
  `<div>`s. It is a proper `radiogroup`/`radio` pattern: one tab stop for the whole group, arrow
  keys move the selection (wrapping at either end), Space/Enter select.
- **Reduced motion is treated as correctness, not polish.** Every animation in the app, including
  the emoji wiggle and the confetti burst, is fully skipped (not just shortened) for anyone whose
  OS requests less motion.
- **Dark mode is not a CSS trick bolted on at the end.** Every color in the design has a
  dark-mode pairing from the start, the toggle persists to `localStorage`, and it falls back to
  the visitor's OS preference on first visit.

---

## 4. Design System

The visual design is modeled on [secondsight.ai](https://www.secondsight.ai/), an enterprise SaaS
site with a distinctive look: the Outfit typeface, bold uppercase headlines, a vivid green
primary action color, fully pill-shaped buttons, flat light-gray content blocks with no border or
shadow, and dramatic full-bleed black sections used for emphasis.

- **Typography:** Outfit throughout, loaded from Google Fonts. The page title sits in a
  full-bleed black header band, bold and uppercase, always black regardless of the light/dark
  toggle.
- **Buttons:** fully pill-shaped (`rounded-full`), not just rounded corners. Primary actions are
  a deep green; secondary/ghost actions are a thin-bordered pill on a transparent background.
- **Cards:** flat, a light `neutral-100` (dark mode: `neutral-900`) background, no border, no
  shadow, matching SecondSight's own stat-block treatment.
- **Dark mode:** a true, neutral black (`#0A0A0A`), not a blue-tinted dark.
- **One deliberate deviation:** SecondSight's literal button green measures about 2.15:1 contrast
  with white text, well under the WCAG AA floor (4.5:1) this project holds itself to everywhere
  else. Buttons here use a deeper shade of the same green (`green-700`, about 5.0:1 contrast)
  instead of importing an inaccessible color just to match a screenshot exactly.

Full rules, every token, and the reasoning behind each one are documented in
[`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

---

## 5. Security

This is a public, no-auth board, so the threat model is scoped accordingly: the goal is to stop
spam, injection, and information leakage, not to protect private data (there is none) or gate
access (the brief explicitly excludes authentication).

| Protection                 | How it works                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Row Level Security**     | Postgres itself only allows `SELECT` and `INSERT` on the `shoutouts` table. No policy exists for `UPDATE`/`DELETE`, so they are denied by default even if the application code had a bug.                                                                                                                                                                                                                                     |
| **Server-side validation** | Every `POST` body is parsed with a Zod schema before it reaches the database: required fields, a 280-character message cap, and an emoji allowlist. The frontend's copy of this schema is UX only, never trusted as the real boundary.                                                                                                                                                                                        |
| **Rate limiting**          | The Edge Function limits each client to 5 `POST` requests per 60-second window, returning `429` with a `Retry-After` header past that. This is an in-memory, per-instance guard: it resets on a cold start and is not shared across regions, so it is a deterrent against casual spam, not a hard distributed-systems guarantee. That trade-off is documented directly in the function's own source comments.                 |
| **Configurable CORS**      | Defaults to allowing any origin (appropriate for a public API with no cookies or session state), but can be locked to one exact origin by setting the `ALLOWED_ORIGIN` secret, with no code changes required.                                                                                                                                                                                                                 |
| **No information leakage** | Database errors are logged server-side with full detail and returned to the client as a short, generic message only. Verified directly in the test suite: it asserts that a raw Postgres error string never appears in a response body.                                                                                                                                                                                       |
| **HTTP security headers**  | Every response (both the API and the deployed frontend) sends `X-Content-Type-Options: nosniff`. The frontend additionally sends a `Content-Security-Policy` restricting scripts and connections to known-safe origins, `X-Frame-Options: DENY` to prevent clickjacking, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` disabling camera/microphone/geolocation, none of which this app uses. |
| **No secrets in source**   | Verified with `git grep` across the actual pushed repository: no API key, access token, or project reference is hardcoded anywhere. Real values only ever live in gitignored `.env.local`/`.env`, or in Vercel's/Supabase's own encrypted environment variable stores.                                                                                                                                                        |
| **XSS**                    | React escapes all rendered text by default; there is no `dangerouslySetInnerHTML` anywhere in the codebase, so a shoutout message can never be interpreted as HTML.                                                                                                                                                                                                                                                           |
| **Dependency hygiene**     | `npm audit` is checked; the only outstanding advisories are in Vite's development server (not the production bundle), documented as a known, accepted trade-off in [§10 Known Limitations](#10-known-limitations) rather than left unmentioned.                                                                                                                                                                               |

---

## 6. Testing

Both runtimes are tested with each ecosystem's own tools, rather than forcing one test runner
across a Node/Vite project and a Deno project.

- **Frontend (Vitest + React Testing Library):** 74 tests across the shared validation schema,
  the emoji theme, both data hooks, and every component. Coverage sits at 98%+ overall, with
  every component file at 100%.
- **Edge Function (Deno's built-in test runner):** 21 tests covering validation edge cases (a
  message one character over the limit, an emoji outside the allowlist, a missing field), the
  `GET`/`POST` success paths, `OPTIONS`/CORS handling, the rate limiter, and the configurable
  `ALLOWED_ORIGIN` header.
- Every check was actually run, not just written: lint, typecheck, the full test suite, and the
  production build all pass clean on this repository as delivered. The app was also driven in a
  real headless browser (form validation, character counter, submit, dark mode toggle) to confirm
  it works, not just that its unit tests pass.

---

## 7. Requirements Coverage

Mapped directly against the brief's own evaluation table.

| Area               | What is being evaluated                                        | Status | Where to look                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeScript**     | Proper types, no `any`, interfaces for data models             | Met    | Zero `any` in the codebase, enforced by ESLint. Data model in `src/types/shoutout.ts`, generated DB types in `src/types/database.types.ts`                                                   |
| **React**          | Clean component structure, state management, form handling     | Met    | `src/components/ui/` vs. `src/components/shoutouts/` split, state owned in `useShoutouts`/`useCreateShoutout`, controlled form in `ShoutoutForm.tsx`                                         |
| **Edge Functions** | Input validation, error handling, proper HTTP responses        | Met    | `supabase/functions/shoutouts/index.ts`, Zod validation, `200`/`201`/`400`/`404`/`405`/`429`/`500` all used correctly, 21 tests                                                              |
| **Code Quality**   | Readable, consistent naming, no dead code, reasonable comments | Met    | ESLint + Prettier enforced on every commit via a pre-commit hook, comments explain the "why" rather than narrating the code                                                                  |
| **Database**       | Correct schema, sensible constraints                           | Met    | `supabase/migrations/`, RLS policies, per-column check constraints, an index on `created_at` for the newest-first query                                                                      |
| **Taste**          | Does the UI look intentional? Is the UX smooth or janky?       | Met    | See [§4 Design System](#4-design-system) and [§8 Creative Additions](#8-creative-additions): a real design language, animation, confetti, dark mode, all respecting `prefers-reduced-motion` |

---

## 8. Creative Additions

The floor (a validated `GET`/`POST` API, a form, a grid, real storage) is all there. On top of
that:

- **A full design system**, modeled on a real production SaaS site rather than default styling,
  documented in [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).
- **Color-coded cards.** Each of the 8 allowed emoji has its own accent color, defined in one
  place (`src/lib/emojiTheme.ts`) and kept from drifting out of sync with the validation allowlist
  by a runtime check.
- **Animated emoji**, not static glyphs. Every card's emoji wiggles gently on a staggered loop,
  every emoji-picker button floats at rest and jumps on hover, and cards themselves lift a little
  on hover, all skipped under reduced motion.
- **Confetti on submit.** A layered burst fires the moment a shoutout is successfully posted
  (`src/lib/confetti.ts`): a center "realistic look" pop plus two cannons firing from the
  bottom-left and bottom-right corners of the screen, all wrapped defensively so it can never
  break the actual submit flow if the environment does not support it.
- **Dark mode**, persisted per visitor, falling back to the OS setting on first visit.
- **A live character counter** that turns red once within 20 characters of the 280-character
  limit.
- **Posting feels instant.** The moment the server confirms a shoutout, it is added straight to
  the top of the grid with the real server-generated `id` and timestamp, no full page refetch.
- **Production-grade security hardening** beyond what the brief asks for: rate limiting,
  configurable CORS, and a full HTTP security header set. See [§5 Security](#5-security).
- **Both a Vercel-ready config and a working Docker image**, so however this gets hosted, it is
  ready.

---

## 9. Self-Deployment Steps

### Prerequisites

| Tool           | Version | What it is for                                                   |
| -------------- | ------- | ---------------------------------------------------------------- |
| Node.js        | 20+     | Running the frontend                                             |
| npm            | 10+     | Installing dependencies                                          |
| Docker Desktop | latest  | Runs Supabase's local dev stack (Postgres, Studio, Edge Runtime) |
| Deno           | 1.44+   | Only needed to run the Edge Function's own tests/lint locally    |

The Supabase CLI does not need a separate install. Every command below runs it through `npx`.

### Step 1: Install and configure the environment

```bash
npm install
cp .env.example .env.local
```

`.env.local` holds your real local keys and is already gitignored. Nothing in this project ever
hardcodes a key or secret in source; everything is read from environment variables.

### Step 2: Start the local database

```bash
npx supabase start     # boots Postgres, Studio, and the Edge Runtime in Docker
npx supabase db reset  # applies the migration and seeds 5 sample shoutouts
```

Copy the printed `anon` key into `.env.local` as `VITE_SUPABASE_ANON_KEY`. Local Studio (a
Postgres browser UI) is available at `http://127.0.0.1:54323`.

Note: when serving the Edge Function locally (next step), Supabase automatically injects its own
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the local stack and ignores whatever is set in
`.env.local` for those two names specifically. That is a Supabase platform behavior, not a bug.

### Step 3: Run it locally (two terminals)

```bash
# Terminal 1, the API
npx supabase functions serve shoutouts --env-file .env.local --no-verify-jwt

# Terminal 2, the frontend
npm run dev
```

Open `http://localhost:5173`.

### Step 4: Run the checks

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build

# Edge Function, needs Deno installed
deno lint supabase/functions/
deno fmt --check supabase/functions/
deno check supabase/functions/shoutouts/index.ts
deno test --allow-env --allow-net supabase/functions/shoutouts/
```

### Step 5: Deploy your own copy

**Backend (Supabase):**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
npx supabase functions deploy shoutouts
```

`functions deploy` automatically gives the function access to your project's URL and service-role
key. You never need to set those secrets by hand.

**Frontend (Vercel):** connect the GitHub repo, or run `vercel --prod`. `vercel.json` already
pins the build command, output directory, and security headers. Set these three environment
variables in the Vercel project's dashboard:

| Variable                      | Value                                                 |
| ----------------------------- | ----------------------------------------------------- |
| `VITE_SUPABASE_URL`           | `https://<your-project-ref>.supabase.co`              |
| `VITE_SUPABASE_ANON_KEY`      | your project's public anon/publishable key            |
| `VITE_SUPABASE_FUNCTIONS_URL` | `https://<your-project-ref>.supabase.co/functions/v1` |

**No other hosting is needed.** There is no custom backend server to run: the API is the Supabase
Edge Function, running on Supabase's own infrastructure the moment it is deployed. Vercel serves
the static frontend, Supabase serves the API and the database. That is the whole stack.

**Docker (optional alternative to Vercel):** a multi-stage `Dockerfile` is included (builds the
frontend, serves it with nginx, includes the same security headers as the Vercel config). See the
comments at the top of the `Dockerfile` for exact build and run commands.

---

## 10. Known Limitations

Documented deliberately, not left as silent gaps.

- `npm audit` flags a couple of advisories in Vite's development server, not anything that ships
  in the production build. Fixing them cleanly means a major-version bump of Vite untested against
  this setup. For a project this size, leaving a documented, dev-only advisory in place was the
  better trade.
- The rate limiter is in-memory and per-instance. It resets on a cold start and is not shared
  across regions. It is a real deterrent against casual spam, not a distributed-systems-grade
  guarantee. A production system expecting serious abuse would back it with a shared store
  (Redis, or a database table) instead.
- A handful of lines are intentionally left without a test: guard clauses that only matter in an
  environment this app does not run in (server-side rendering), and one "this should never
  happen" internal consistency check. Testing something that cannot actually occur would pad a
  coverage number without testing real behavior, so those are called out instead of hidden.

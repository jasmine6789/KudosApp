# Engineering Take-Home: Team Shoutout Board

**Time budget:** ~1 hour
**Stack:** React, TypeScript, Supabase Edge Functions (Deno)
**Deliverable:** Git repo + README with setup instructions

---

## The Brief

Build a simple team shoutout board where people can post quick kudos to each other. Anyone can view the board and add a new shoutout. No authentication required.

## What to Build

### 1. Supabase Edge Function (`shoutouts`)

A single edge function with two operations:

- **GET** — returns all shoutouts, newest first
- **POST** — accepts a new shoutout and inserts it

**Shoutout shape:**

```typescript
interface Shoutout {
  id: string; // uuid, generated server-side
  from_name: string; // who's giving the shoutout
  to_name: string; // who's receiving it
  message: string; // the kudos message (max 280 chars)
  emoji: string; // a single emoji picked from a short list
  created_at: string; // ISO timestamp, generated server-side
}
```

**Expectations:**

- Validate input on POST (required fields, message length, emoji allowlist)
- Return proper HTTP status codes (200, 400, 500)
- Return JSON responses with a consistent shape
- Handle errors gracefully — no stack traces leaked to the client

### 2. React Frontend

A single-page app with:

- A form to submit a new shoutout (from name, to name, message, emoji picker)
- A grid/list of shoutout cards displaying all entries
- Newest shoutouts appear first
- Optimistic UI on submit is a bonus, not a requirement

**Expectations:**

- TypeScript interfaces for the shoutout model — no `any` types
- Clean form state management (controlled inputs, validation feedback)
- Fetch from the edge function, handle loading and error states
- Reasonable component structure (not one giant file)

### 3. Data Storage

Use Supabase as the backing store. Create a `shoutouts` table with the fields above. Use the Supabase JS client or direct SQL — your call. Keep the migration SQL in the repo.

## What We're Evaluating

| Area               | What we look for                                                             |
| ------------------ | ---------------------------------------------------------------------------- |
| **TypeScript**     | Proper types, no `any`, interfaces for data models                           |
| **React**          | Clean component structure, state management, form handling                   |
| **Edge Functions** | Input validation, error handling, proper HTTP responses                      |
| **Code Quality**   | Readable, consistent naming, no dead code, reasonable comments               |
| **Database**       | Correct schema, sensible constraints                                         |
| **Taste**          | Does the UI look intentional or slapped together? Is the UX smooth or janky? |

## Creativity Zone

The core requirements above are the floor, not the ceiling. If you have time and want to show off, any of these are fair game:

- Animations on new shoutouts appearing
- Color-coded cards by emoji
- "Shoutout of the day" highlight
- Confetti on submit
- Filter/search by name
- Dark mode toggle
- Character counter on the message field
- A reaction button on each card (🔥, 👏, ❤️)

Don't gold-plate at the expense of the core requirements working. A clean, working app beats a flashy broken one.

## Deliverable

1. A git repo (can be public on your personal GitHub or a zip)
2. A README with:
   - Setup instructions (env vars, database migration steps, how to run)
   - A short note on any creative additions you made
3. Optionally, a live URL if you deploy it

## Constraints

- No authentication required
- No testing required (but if you write tests, we'll notice)
- No CSS framework required (but Tailwind is fine if that's your jam)
- Should run locally with `npm install && npm run dev` or equivalent

## The Point

This is a real (if small) full-stack feature. It touches a frontend, an API layer, and a database. We want to see how you write code when nobody's watching — your defaults, your standards, your taste. An hour is tight; prioritize a working app over a complete one.

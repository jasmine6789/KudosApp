# Testing Guidelines

Testing strategy for the Team Shoutout Board's two runtimes: the Vite/React frontend (Vitest) and the Deno Edge Function (`deno test`).

---

## 1. Testing Strategy

| Layer                    | Tool                           | Scope                                                                                                      | Runs                         |
| ------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Frontend unit**        | Vitest                         | Pure functions (`emojiTheme.ts`, Zod schema behavior), custom hooks in isolation                           | Every commit, pre-commit, CI |
| **Frontend integration** | Vitest + React Testing Library | Components rendered together: form submission flow, grid rendering from fetched data, error/loading states | Pre-push, CI                 |
| **Backend**              | `deno test`                    | The `shoutouts` handler: GET/POST behavior, validation edge cases, CORS/OPTIONS, error mapping             | Every commit, CI             |

### What belongs where

- **Frontend unit:** `shoutoutInputSchema` rejects a message over 280 chars; `emojiTheme` returns the correct accent class for each allowlisted emoji; `useCharacterCount`-style helpers.
- **Frontend integration:** filling out `ShoutoutForm` and submitting shows a loading state, then either clears the form (mocked success) or shows an inline error (mocked failure); `ShoutoutGrid` renders one card per item and orders newest-first.
- **Backend (`deno test`):** `POST` with a missing `to_name` returns 400 with a field-level error; `POST` with an emoji not in the allowlist returns 400; `GET` returns `{ success: true, data: [...] }` shaped correctly; `OPTIONS` returns 204 with CORS headers; an unexpected Supabase error returns 500 without leaking the raw error.

---

## 2. Naming Conventions

- **Frontend unit/integration:** `*.test.ts` / `*.test.tsx`, colocated next to the file under test.
  ```
  src/lib/emojiTheme.ts
  src/lib/emojiTheme.test.ts
  src/components/shoutouts/ShoutoutForm.tsx
  src/components/shoutouts/ShoutoutForm.test.tsx
  ```
- **Backend:** `*_test.ts`, colocated next to the function it tests, per Deno convention.
  ```
  supabase/functions/shoutouts/index.ts
  supabase/functions/shoutouts/index_test.ts
  ```
- Test descriptions are behavior-driven: `describe("ShoutoutForm")` → `it("shows an inline error when message exceeds 280 characters")`, not `it("test validation")`.

---

## 3. Mocking Rules

### Frontend

- Unit tests never hit the network. Mock the API wrapper module (`src/lib/api.ts`) directly (`vi.mock`), not `fetch` at the global level, so tests stay coupled to the actual contract the app depends on.
- Integration tests that exercise `useShoutouts`/`useCreateShoutout` mock the same API wrapper module with realistic success/error response shapes matching `ApiResponse<T>` from `src/types/shoutout.ts`; don't invent response shapes the real API wouldn't send.

### Backend

- **Local dev / CI unit-level:** mock the Supabase client (`createClient`) so `index_test.ts` can test validation and routing logic without a live database, by injecting a fake client whose `.from().select()/.insert()` resolve with canned data or errors.
- **CI integration-level (optional, only if a real Docker Supabase is available in the runner):** run against a real local Supabase instance (`supabase start && supabase db reset`) to additionally verify RLS policies actually behave as configured, since this is the only way to catch a policy typo that a mocked client would hide.
- Never point any automated test at a deployed (staging/production) Supabase project.

---

## 4. Running Tests Locally

```bash
# Frontend
npm run test                 # run once
npm run test:watch           # watch mode
npm run test:coverage        # coverage report (text + HTML)

# Backend (Deno)
deno test --allow-env --allow-net supabase/functions/shoutouts/
deno test --allow-env --allow-net --coverage=coverage/deno supabase/functions/shoutouts/
deno coverage coverage/deno   # print coverage summary
```

---

## 5. Coverage Targets

| Metric                                                           | Target                                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Frontend business logic (`src/lib/`, `src/hooks/`, `src/types/`) | 80%+                                                                     |
| Edge Function (`supabase/functions/shoutouts/`)                  | 80%+, with 100% of validation branches (every Zod failure path) covered  |
| UI components (`src/components/`)                                | Best-effort: prioritize the form and grid over presentational primitives |

Coverage is a floor for the logic that matters (validation, data shaping, error mapping), not a mandate to test trivial JSX. A bug fix should always ship with a regression test that fails without the fix.

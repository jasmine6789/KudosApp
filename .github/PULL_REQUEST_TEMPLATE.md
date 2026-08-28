## Summary

<!-- What does this PR do and why? 2-4 sentences. -->

## Linked Issue

Closes #

## Type of Change

- [ ] `feat` — New feature
- [ ] `fix` — Bug fix
- [ ] `refactor` — Code change that neither fixes a bug nor adds a feature
- [ ] `perf` — Performance improvement
- [ ] `docs` — Documentation only
- [ ] `test` — Adding or correcting tests
- [ ] `build` / `ci` — Build system or CI/CD changes
- [ ] `chore` — Tooling, dependency bumps, misc.
- [ ] **Breaking change** (requires a `BREAKING CHANGE:` footer in the commit)

## Changes Made

<!-- Bullet list of the concrete changes. -->

-
-
-

## Verification / Screenshots

<!-- How did you verify this works? Attach screenshots or a GIF of the before/after UI for any visual or behavioral change. Include terminal output for API/edge-function-only changes. -->

## Checklist

### Code Quality

- [ ] I have performed a self-review of my own code
- [ ] Code follows the project's standards (zero `any`, explicit return types on public functions, no direct Supabase calls from `src/components/ui`)
- [ ] No `any` types, disabled lint rules, or suppressed type errors introduced
- [ ] No console errors/warnings introduced

### Testing

- [ ] Added/updated unit tests for new logic
- [ ] Added/updated integration tests where applicable
- [ ] All tests pass locally (`npm run test`)
- [ ] Edge Function tests pass locally (`deno test --allow-env --allow-net supabase/functions/shoutouts/`), if `supabase/functions/` changed
- [ ] Verified manually in a running environment (`npm run dev` + `supabase functions serve shoutouts`)

### Data / Security

- [ ] Database migrations include RLS policies (if new tables/columns touch user data)
- [ ] No secrets, keys, or credentials committed
- [ ] Supabase service-role client is not exposed to client-side code
- [ ] Zod schema changes are mirrored in both `src/types/shoutout.ts` and `supabase/functions/shoutouts/index.ts`

### UX Self-Review

- [ ] Loading, empty, error, and success states were all checked, not just the happy path
- [ ] Change matches [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) (color tokens, motion, accessibility rules)
- [ ] Keyboard navigation and focus states verified for any new interactive element
- [ ] Checked in both light and dark mode, if the change touches styling

### Documentation & Config

- [ ] Documentation updated (README, `docs/`, inline comments where non-obvious)
- [ ] New/changed environment variables documented in `.env.example`
- [ ] `database.types.ts` regenerated if schema changed (`supabase gen types typescript --local > src/types/database.types.ts`)

### CI

- [ ] Lint passes (`npm run lint`, and `deno lint supabase/functions/` if touched)
- [ ] Type-check passes (`npm run typecheck`, and `deno check supabase/functions/shoutouts/index.ts` if touched)
- [ ] Build succeeds (`npm run build`)

## Additional Notes

<!-- Deployment considerations, follow-up work, known limitations. -->

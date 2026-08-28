#!/usr/bin/env bash
# Local setup: boot Supabase, apply schema + seed, generate types, serve the
# shoutouts function. Run from the repo root.
set -euo pipefail

echo "==> 1. Starting local Supabase (Postgres, Studio, Edge Runtime)..."
npx supabase start

echo "==> 2. Applying migrations + seed data..."
npx supabase db reset

echo "==> 3. Generating TypeScript types from the local schema..."
npx supabase gen types typescript --local > src/types/database.types.ts

echo "==> 4. Serving the shoutouts Edge Function locally (no JWT verification)..."
npx supabase functions serve shoutouts --no-verify-jwt --env-file .env.local

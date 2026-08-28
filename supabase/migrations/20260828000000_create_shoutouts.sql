-- Migration: create_shoutouts
-- Creates the `shoutouts` table backing the Team Shoutout Board.
-- No authentication is required for this project: reads and inserts are
-- public by design; updates and deletes are denied entirely at the RLS layer.

create extension if not exists "pgcrypto";

create table if not exists public.shoutouts (
  id          uuid primary key default gen_random_uuid(),
  from_name   text not null,
  to_name     text not null,
  message     varchar(280) not null,
  emoji       varchar(10) not null,
  created_at  timestamptz not null default now(),

  constraint from_name_not_empty check (
    char_length(trim(from_name)) > 0 and char_length(from_name) <= 100
  ),
  constraint to_name_not_empty check (
    char_length(trim(to_name)) > 0 and char_length(to_name) <= 100
  ),
  constraint message_not_empty check (
    char_length(trim(message)) > 0 and char_length(message) <= 280
  ),
  constraint emoji_allowlist check (
    emoji in ('🔥', '👏', '❤️', '🚀', '🎉', '🌟', '💡', '🙌')
  )
);

comment on table public.shoutouts is 'Team kudos posts. Public read/insert, no update/delete, no auth required.';
comment on column public.shoutouts.from_name is 'Display name of the person giving the shoutout.';
comment on column public.shoutouts.to_name is 'Display name of the person receiving the shoutout.';
comment on column public.shoutouts.message is 'Kudos message, max 280 characters.';
comment on column public.shoutouts.emoji is 'Single emoji selected from the app-level allowlist.';

-- Newest-first is the primary access pattern (GET /shoutouts), so index the
-- sort column directly to keep pagination/listing fast as the table grows.
create index if not exists idx_shoutouts_created_at_desc
  on public.shoutouts (created_at desc);

-- Row Level Security
alter table public.shoutouts enable row level security;

-- Public read: anyone can list shoutouts, no auth required.
create policy "Allow public read access"
  on public.shoutouts
  for select
  to anon, authenticated
  using (true);

-- Public insert: anyone can post a shoutout, no auth required.
-- Column-level constraints above (length, allowlist, non-blank) do the
-- actual input enforcement; this policy only governs who may attempt an insert.
create policy "Allow public insert access"
  on public.shoutouts
  for insert
  to anon, authenticated
  with check (true);

-- Explicitly restrict UPDATE and DELETE. With RLS enabled and no matching
-- policy, Postgres denies the operation by default. These are written out
-- anyway so the "no edits, no deletes" rule is a documented, deliberate
-- decision rather than an accident of omission.
create policy "Restrict update access"
  on public.shoutouts
  for update
  to anon, authenticated
  using (false);

create policy "Restrict delete access"
  on public.shoutouts
  for delete
  to anon, authenticated
  using (false);

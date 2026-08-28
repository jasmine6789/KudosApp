-- Seed data for local development.
-- Run automatically by `supabase db reset`. Safe to run repeatedly — clears
-- and reloads the table rather than accumulating duplicates on every reset.
-- Synthetic fixtures only; never real user data.

truncate table public.shoutouts;

insert into public.shoutouts (from_name, to_name, message, emoji, created_at)
values
  (
    'Ada Lovelace',
    'Grace Hopper',
    'Thank you for the thorough code review on the migration PR — caught an edge case I completely missed.',
    '🔥',
    now() - interval '2 hours'
  ),
  (
    'Alan Turing',
    'Margaret Hamilton',
    'Your incident write-up this week was so clear it should be required reading for onboarding.',
    '👏',
    now() - interval '5 hours'
  ),
  (
    'Katherine Johnson',
    'Radia Perlman',
    'Really appreciated you pairing with me on the networking bug for two hours straight. Learned a ton.',
    '❤️',
    now() - interval '1 day'
  ),
  (
    'Tim Berners-Lee',
    'Hedy Lamarr',
    'Shipped the new onboarding flow ahead of schedule and it already looks great in staging. 🚀',
    '🚀',
    now() - interval '2 days'
  ),
  (
    'Barbara Liskov',
    'Dennis Ritchie',
    'Huge congrats on hitting five years on the team today — the platform would not be what it is without you!',
    '🎉',
    now() - interval '3 days'
  );

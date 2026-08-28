-- Seed data for local development.
-- Run automatically by `supabase db reset`. Safe to run repeatedly, it clears
-- and reloads the table rather than accumulating duplicates on every reset.
-- Synthetic fixtures only, never real user data.

truncate table public.shoutouts;

insert into public.shoutouts (from_name, to_name, message, emoji, created_at)
values
  (
    'Jasmine',
    'Severa',
    'Thanks for catching that bug in the checkout flow before it hit prod. You saved us a rough night.',
    '🔥',
    now() - interval '2 hours'
  ),
  (
    'Derek',
    'Jasmine',
    'Your walkthrough of the new API made onboarding so much easier this week. Really appreciate the patience.',
    '👏',
    now() - interval '5 hours'
  ),
  (
    'Severa',
    'Derek',
    'Thank you for staying late to help me debug that deploy issue. I owe you one.',
    '❤️',
    now() - interval '1 day'
  ),
  (
    'Jasmine',
    'Derek',
    'Huge shoutout for shipping the redesign ahead of schedule, it already looks amazing in staging.',
    '🚀',
    now() - interval '2 days'
  ),
  (
    'Severa',
    'Jasmine',
    'Congrats on one year on the team today! The whole project runs smoother because of you.',
    '🎉',
    now() - interval '3 days'
  );

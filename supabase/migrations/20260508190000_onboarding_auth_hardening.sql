-- NovaPilot AI: Onboarding/Auth lifecycle hardening

-- Expand onboarding_progress to match application contract.
alter table if exists public.onboarding_progress
  add column if not exists role_template text default 'founder',
  add column if not exists connected_source boolean default false,
  add column if not exists first_query_completed boolean default false,
  add column if not exists weekly_digest_enabled boolean default false,
  add column if not exists teammate_invited boolean default false;

-- Backfill compatibility columns from existing step fields.
update public.onboarding_progress
set
  connected_source = coalesce(connected_source, step_1_connected, false),
  first_query_completed = coalesce(first_query_completed, step_2_queries, false),
  teammate_invited = coalesce(teammate_invited, step_3_team, false),
  weekly_digest_enabled = coalesce(weekly_digest_enabled, false);

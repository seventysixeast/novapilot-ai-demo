-- Fix missing RLS policies for organizations and memberships
-- This allows authenticated users to create their own workspaces

-- 1. Organizations
create policy "org_insert_authenticated" on public.organizations
for insert to authenticated
with check (true);

create policy "org_update_admin" on public.organizations
for update to authenticated
using (public.is_org_admin(id));

-- 2. Organization Members
create policy "org_members_insert_authenticated" on public.organization_members
for insert to authenticated
with check (true);

create policy "org_members_update_admin" on public.organization_members
for update to authenticated
using (public.is_org_admin(organization_id));

-- 3. Profiles (is_internal_tester column fix)
-- Ensure the column exists if it was missed
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='is_internal_tester') then
    alter table public.profiles add column is_internal_tester boolean default false;
  end if;
end $$;

-- 4. AI Usage Logs
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  provider text not null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.ai_usage_logs enable row level security;

create policy "ai_usage_logs_member_access" on public.ai_usage_logs
for select to authenticated
using (public.is_org_member(organization_id));

create policy "ai_usage_logs_insert_authenticated" on public.ai_usage_logs
for insert to authenticated
with check (public.is_org_member(organization_id));

-- 5. AI Query Citations
create table if not exists public.ai_query_citations (
  id uuid primary key default gen_random_uuid(),
  ai_query_id uuid not null references public.ai_queries (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null,
  source_ref text not null,
  freshness_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ai_query_citations enable row level security;

create policy "ai_query_citations_member_access" on public.ai_query_citations
for select to authenticated
using (public.is_org_member(organization_id));

create policy "ai_query_citations_insert_authenticated" on public.ai_query_citations
for insert to authenticated
with check (public.is_org_member(organization_id));

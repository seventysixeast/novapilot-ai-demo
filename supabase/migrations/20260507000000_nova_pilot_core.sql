-- NovaPilot AI: Core Unified Schema
-- Version: 1.0.0
-- Created: 2026-05-07

-- ── EXTENSIONS ──
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ── ENUMS ──
create type public.app_role as enum ('owner', 'super_admin', 'admin', 'manager', 'team_member', 'customer', 'member');
create type public.document_kind as enum ('pdf', 'image', 'text');
create type public.document_status as enum ('uploaded', 'processing', 'ready', 'failed');
create type public.message_role as enum ('system', 'user', 'assistant');
create type public.connection_status as enum ('connected', 'syncing', 'error', 'disconnected');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'unpaid');

-- ── TABLES ──

-- 1. Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  job_title text,
  bio text,
  updated_at timestamptz default now()
);

-- 2. Organizations (Multi-tenant boundary)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 3. Organization Members (RBAC)
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- 4. Pricing Plans
create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_code text not null unique,
  description text,
  price_monthly numeric not null,
  price_annual numeric not null,
  features jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade unique,
  plan_code text not null references public.pricing_plans (plan_code),
  status public.subscription_status not null default 'trialing',
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz not null default now()
);

-- 6. Data Pipelines (Connectors)
create table public.data_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null, -- 'stripe', 'hubspot', 'ga4'
  status public.connection_status not null default 'disconnected',
  last_synced_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  unique (organization_id, provider)
);

-- 7. Intelligence Threads (Chat)
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_by uuid not null references auth.users (id),
  title text not null,
  created_at timestamptz not null default now()
);

-- 8. Intelligence Messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role public.message_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 9. AI Queries & Insights (Vectorized)
create table public.ai_queries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  thread_id uuid references public.chat_threads (id) on delete set null,
  query_text text not null,
  answer_text text,
  embedding vector(1536),
  confidence_score integer check (confidence_score >= 0 and confidence_score <= 100),
  freshness_status text default 'fresh',
  created_at timestamptz not null default now()
);

-- 10. Precision Analytics Metrics
create table public.analytics_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  metric_date date not null,
  mrr numeric not null default 0,
  active_users integer not null default 0,
  cac numeric not null default 0,
  ltv numeric not null default 0,
  anomaly_score numeric,
  anomaly_description text,
  created_at timestamptz not null default now(),
  unique (organization_id, metric_date)
);

-- 11. Performance Reviews
create table public.weekly_growth_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  generated_for_week date not null,
  summary text not null,
  top_risk text,
  top_win text,
  recommended_action text,
  created_at timestamptz not null default now(),
  unique (organization_id, generated_for_week)
);

-- 12. Strategic Alerts & Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 13. Onboarding Framework
create table public.onboarding_progress (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  step_1_connected boolean default false, -- Data sources
  step_2_queries boolean default false,   -- First AI query
  step_3_team boolean default false,      -- Team invited
  completed boolean default false,
  updated_at timestamptz default now()
);

-- ── SECURITY (RLS) ──

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.pricing_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.data_connections enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ai_queries enable row level security;
alter table public.analytics_metrics enable row level security;
alter table public.weekly_growth_reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.onboarding_progress enable row level security;

-- Helper Functions (Security Definer to bypass RLS in policies)
create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'super_admin', 'admin')
  );
$$;

-- ── POLICIES ──

-- Profiles: Users can view their own profile. Others in same org can view too.
create policy "profiles_self_and_colleagues" on public.profiles
for select to authenticated
using (
  id = auth.uid() or
  exists (
    select 1 from public.organization_members om1
    where om1.user_id = auth.uid()
    and om1.organization_id in (
      select om2.organization_id from public.organization_members om2 where om2.user_id = public.profiles.id
    )
  )
);

create policy "profiles_update_self" on public.profiles
for update to authenticated
using (id = auth.uid());

-- Organizations: Members can see their org.
create policy "org_select_member" on public.organizations
for select to authenticated
using (public.is_org_member(id));

-- Organization Members: Members can see each other.
create policy "org_members_select_member" on public.organization_members
for select to authenticated
using (public.is_org_member(organization_id));

-- Generic policy for all tenant-owned tables
do $$
declare
  t text;
  tables_to_protect text[] := array[
    'subscriptions', 'data_connections', 'chat_threads', 'chat_messages',
    'ai_queries', 'analytics_metrics', 'weekly_growth_reviews',
    'notifications', 'onboarding_progress'
  ];
begin
  foreach t in array tables_to_protect
  loop
    execute format('create policy "%I_member_access" on public.%I for all to authenticated using (public.is_org_member(organization_id))', t, t);
  end loop;
end $$;

-- Pricing Plans: Publicly readable.
create policy "pricing_plans_read" on public.pricing_plans
for select using (is_active = true);

-- ── TRIGGERS & FUNCTIONS ──

-- Handle New User Registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  full_name_val text;
begin
  full_name_val := new.raw_user_meta_data ->> 'full_name';
  
  -- 1. Create Profile
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, full_name_val, new.raw_user_meta_data ->> 'avatar_url');

  -- 2. Create Default Organization for user
  insert into public.organizations (name, slug)
  values (
    coalesce(full_name_val, 'My Workspace'),
    lower(regexp_replace(coalesce(full_name_val, 'workspace-' || substr(new.id::text, 1, 8)), '[^a-zA-Z0-9]+', '-', 'g'))
  )
  returning id into new_org_id;

  -- 3. Assign as Owner
  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  -- 4. Initialize Onboarding
  insert into public.onboarding_progress (organization_id)
  values (new_org_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── SEARCH FUNCTIONS ──
create or replace function public.match_ai_queries(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  target_org_id uuid
)
returns table (
  id uuid,
  query_text text,
  answer_text text,
  confidence_score integer,
  similarity float
)
language sql
stable
as $$
  select
    id,
    query_text,
    answer_text,
    confidence_score,
    1 - (ai_queries.embedding <=> query_embedding) as similarity
  from ai_queries
  where 1 - (ai_queries.embedding <=> query_embedding) > match_threshold
    and organization_id = target_org_id
  order by ai_queries.embedding <=> query_embedding
  limit match_count;
$$;

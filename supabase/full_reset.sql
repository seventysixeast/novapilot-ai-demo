
-- ==========================================
-- DANGER: FULL DATABASE RESET SCRIPT
-- ==========================================
-- This script drops all tables and types in the public schema and recreates them.

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Clean up auth.users for demo users so the trigger fires cleanly on insert
DELETE FROM auth.users WHERE email LIKE '%@novapilot.ai';


-- MIGRATION: 20260507000000_nova_pilot_core.sql
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

-- MIGRATION: 20260507000100_billing_system_foundation.sql
-- NovaPilot AI: Billing & Usage Foundation
-- Version: 1.0.0
-- Created: 2026-05-07

-- ── TABLES ──

-- 1. Billing Profiles (Customer Mappings)
create table if not exists public.billing_profiles (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  stripe_customer_id text unique,
  paypal_payer_id text unique,
  billing_email text,
  updated_at timestamptz default now()
);

-- 2. Usage Quotas (Real-time tracking)
create table if not exists public.usage_quotas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  quota_name text not null, -- 'ai_queries', 'workspaces', 'connectors'
  used integer not null default 0,
  allowed integer not null,
  period_starts_at timestamptz not null default now(),
  period_ends_at timestamptz not null,
  updated_at timestamptz default now(),
  unique (organization_id, quota_name)
);

-- 3. Usage Events (Audit log for metering)
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id),
  event_type text not null,
  amount integer not null default 1,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- 4. Trial State Management
create table if not exists public.trial_states (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  status public.subscription_status not null default 'trialing',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_grace_period boolean default false,
  updated_at timestamptz default now()
);

-- 5. Invoices (Payment History)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invoice_number text not null unique,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null, -- 'paid', 'open', 'void', 'uncollectible'
  hosted_invoice_url text,
  invoice_pdf text,
  issued_at timestamptz not null default now(),
  paid_at timestamptz
);

-- 6. Webhook Events (Idempotency)
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null, -- 'stripe', 'paypal'
  external_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed boolean default false,
  created_at timestamptz not null default now()
);

-- ── SECURITY (RLS) ──

alter table public.billing_profiles enable row level security;
alter table public.usage_quotas enable row level security;
alter table public.usage_events enable row level security;
alter table public.trial_states enable row level security;
alter table public.invoices enable row level security;
alter table public.webhook_events enable row level security;

-- Admin access helper
create policy "admin_billing_access" on public.billing_profiles for all to authenticated using (public.is_org_admin(organization_id));
create policy "member_usage_view" on public.usage_quotas for select to authenticated using (public.is_org_member(organization_id));
create policy "admin_usage_manage" on public.usage_quotas for all to authenticated using (public.is_org_admin(organization_id));
create policy "member_usage_events_view" on public.usage_events for select to authenticated using (public.is_org_member(organization_id));
create policy "member_trial_view" on public.trial_states for select to authenticated using (public.is_org_member(organization_id));
create policy "member_invoice_view" on public.invoices for select to authenticated using (public.is_org_member(organization_id));

-- ── FUNCTIONS & TRIGGERS ──

-- Function to check and increment quota
create or replace function public.check_and_record_usage(
  target_org_id uuid,
  target_quota_name text,
  increment_amount int default 1
)
returns boolean
language plpgsql
security definer
as $$
declare
  current_used int;
  current_allowed int;
begin
  -- Get current quota
  select used, allowed into current_used, current_allowed
  from public.usage_quotas
  where organization_id = target_org_id and quota_name = target_quota_name;

  if not found then
    return false; -- No quota defined
  end if;

  if current_used + increment_amount > current_allowed then
    return false; -- Quota exceeded
  end if;

  -- Update usage
  update public.usage_quotas
  set used = used + increment_amount, updated_at = now()
  where organization_id = target_org_id and quota_name = target_quota_name;

  -- Record event
  insert into public.usage_events (organization_id, event_type, amount)
  values (target_org_id, target_quota_name, increment_amount);

  return true;
end;
$$;

-- Trigger to initialize quotas when a subscription is created/updated
create or replace function public.sync_quotas_from_plan()
returns trigger
language plpgsql
security definer
as $$
declare
  plan_features jsonb;
  ai_limit int := 15; -- Default for basic
begin
  select features into plan_features from public.pricing_plans where plan_code = new.plan_code;
  
  if new.plan_code = 'pro' then ai_limit := 50; end if;
  if new.plan_code = 'enterprise' then ai_limit := 999999; end if;

  -- Upsert AI Query quota
  insert into public.usage_quotas (organization_id, quota_name, used, allowed, period_ends_at)
  values (new.organization_id, 'ai_queries', 0, ai_limit, coalesce(new.current_period_end, now() + interval '30 days'))
  on conflict (organization_id, quota_name) do update set
    allowed = ai_limit,
    period_ends_at = coalesce(new.current_period_end, now() + interval '30 days'),
    updated_at = now();

  return new;
end;
$$;

create trigger on_subscription_change
  after insert or update on public.subscriptions
  for each row execute function public.sync_quotas_from_plan();

-- MIGRATION: 20260508000000_ai_router_and_admin_controls.sql
-- NovaPilot AI: Multi-Model AI Routing & Admin Controls
-- Version: 1.0.0
-- Created: 2026-05-08

-- 1. AI Settings (Global Config)
create table if not exists public.ai_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  description text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users (id)
);

-- Default Settings
insert into public.ai_settings (key, value, description)
values (
  'router_config',
  '{
    "defaultLightweightProvider": "openrouter",
    "defaultPremiumProvider": "openrouter",
    "fallbackEnabled": true,
    "preferredModels": {
      "openrouter": "google/gemini-2.0-flash-lite-preview-02-05:free",
      "groq": "llama-3.3-70b-versatile",
      "ollama": "llama3",
      "openai": "gpt-4.1-mini"
    }
  }'::jsonb,
  'Configuration for the AI multi-model routing system.'
) on conflict (key) do nothing;

-- 2. AI Usage Logs (Detailed monitoring)
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references auth.users (id),
  provider text not null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer generated always as (prompt_tokens + completion_tokens) stored,
  cost_estimate numeric(10, 6) default 0,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- ── SECURITY (RLS) ──

alter table public.ai_settings enable row level security;
alter table public.ai_usage_logs enable row level security;

-- Admin only access for AI Settings
create policy "super_admin_all_ai_settings" on public.ai_settings
for all to authenticated
using (
  exists (
    select 1 from public.organization_members om
    where om.user_id = auth.uid()
    and om.role = 'super_admin'
  )
);

-- Member access for usage logs (viewing their own org's usage)
create policy "member_view_org_ai_usage" on public.ai_usage_logs
for select to authenticated
using (public.is_org_member(organization_id));

-- Index for performance
create index idx_ai_usage_org_id on public.ai_usage_logs(organization_id);
create index idx_ai_usage_created_at on public.ai_usage_logs(created_at);

-- MIGRATION: 20260508000000_rls_fixes.sql
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

-- MIGRATION: 20260508000100_internal_tester_support.sql
-- NovaPilot AI: Internal Tester Support
-- Version: 1.0.0
-- Created: 2026-05-08

-- 1. Add internal tester flag to profiles
alter table public.profiles add column if not exists is_internal_tester boolean default false;

-- 2. Update RLS for profiles (ensure admins can see/update this flag)
create policy "super_admin_manage_tester_flag" on public.profiles
for update to authenticated
using (
  exists (
    select 1 from public.organization_members om
    where om.user_id = auth.uid()
    and om.role = 'super_admin'
  )
)
with check (
  exists (
    select 1 from public.organization_members om
    where om.user_id = auth.uid()
    and om.role = 'super_admin'
  )
);

-- 3. Function to toggle tester status
create or replace function public.toggle_internal_tester(target_user_id uuid, status boolean)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if caller is super_admin
  if not exists (
    select 1 from public.organization_members
    where user_id = auth.uid() and role = 'super_admin'
  ) then
    raise exception 'Unauthorized';
  end if;

  update public.profiles
  set is_internal_tester = status
  where id = target_user_id;
end;
$$;

-- MIGRATION: 20260508010000_rag_system.sql
-- NovaPilot AI: RAG & Knowledge Base Infrastructure

-- 1. Knowledge Chunks Table
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_type text not null, -- 'document', 'connection', 'manual'
  source_id text, -- ID in source system
  content text not null,
  metadata jsonb default '{}',
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table public.knowledge_chunks enable row level security;

create policy "knowledge_chunks_member_access" on public.knowledge_chunks
for select to authenticated
using (public.is_org_member(organization_id));

-- 2. Search Function for Knowledge
create or replace function public.match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  target_org_id uuid
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    id,
    content,
    metadata,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
    and organization_id = target_org_id
  order by knowledge_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- MIGRATION: 20260508020000_seed_core_org.sql
-- Create a system-level default organization for fallbacks
-- This ensures that Foreign Key constraints never block AI features for whitelisted users

INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000000', 'NovaPilot Global System', 'system-workspace')
ON CONFLICT (id) DO NOTHING;

-- Ensure all admin/testers are members of the system workspace
-- We'll do this dynamically in tenant.ts, but we can seed it for the primary dev email if we knew the ID.
-- Since we don't, we just ensure the Org exists.

-- MIGRATION: 20260508030000_document_knowledge_workspace.sql
-- Documents / Knowledge Base workspace
-- Adds first-class document registry and collection support on top of the RAG layer.

create table if not exists public.knowledge_collections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  color text not null default 'slate',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  collection_id uuid references public.knowledge_collections (id) on delete set null,
  title text not null,
  source_type text not null default 'upload',
  source_label text not null default 'Upload',
  kind public.document_kind not null default 'text',
  file_name text,
  file_extension text,
  mime_type text,
  file_size_bytes bigint,
  source_uri text,
  status public.document_status not null default 'uploaded',
  ingestion_stage text not null default 'queued',
  embedding_status text not null default 'pending',
  index_status text not null default 'pending',
  progress integer not null default 0,
  chunk_count integer not null default 0,
  summary text,
  key_insights jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  confidence_score integer not null default 0,
  tags text[] not null default '{}',
  content_excerpt text,
  last_error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_collections_org_created_idx
  on public.knowledge_collections (organization_id, created_at desc);

create index if not exists knowledge_documents_org_created_idx
  on public.knowledge_documents (organization_id, created_at desc);

create index if not exists knowledge_documents_org_status_idx
  on public.knowledge_documents (organization_id, status, ingestion_stage);

create index if not exists knowledge_documents_org_collection_idx
  on public.knowledge_documents (organization_id, collection_id);

alter table public.knowledge_collections enable row level security;
alter table public.knowledge_documents enable row level security;

create policy "knowledge_collections_member_access" on public.knowledge_collections
for select to authenticated
using (public.is_org_member(organization_id));

create policy "knowledge_documents_member_access" on public.knowledge_documents
for select to authenticated
using (public.is_org_member(organization_id));


-- MIGRATION: 20260508040000_billing_provider_assets_and_events.sql
-- NovaPilot AI: Billing Provider Assets + Billing Events
-- Version: 1.0.0
-- Created: 2026-05-08

-- Provider asset registry used to bootstrap Stripe/PayPal from environment keys only.
create table if not exists public.billing_provider_assets (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  plan_code text not null references public.pricing_plans (plan_code) on delete cascade,
  provider_product_id text,
  provider_price_id text,
  provider_plan_id text,
  amount_cents integer not null,
  currency text not null default 'usd',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, plan_code)
);

-- Billing events log used by server actions and manual billing utilities.
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.billing_provider_assets enable row level security;
alter table public.billing_events enable row level security;

create policy "member_billing_events_view" on public.billing_events
for select to authenticated
using (public.is_org_member(organization_id));

create policy "admin_billing_events_manage" on public.billing_events
for all to authenticated
using (public.is_org_admin(organization_id))
with check (public.is_org_admin(organization_id));

create index if not exists billing_provider_assets_provider_plan_idx
  on public.billing_provider_assets (provider, plan_code);

create index if not exists billing_events_org_created_idx
  on public.billing_events (organization_id, created_at desc);

-- MIGRATION: 20260508190000_onboarding_auth_hardening.sql
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

-- MIGRATION: 20260508191000_billing_lifecycle_hardening.sql
-- NovaPilot AI: Billing lifecycle hardening

-- Missing billing lifecycle tables referenced in runtime actions.
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  active boolean not null default true,
  max_redemptions integer,
  redeemed_count integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  redeemed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, coupon_id)
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  referred_email text not null,
  referral_code text not null unique,
  status text not null default 'pending',
  reward_credits integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid references public.data_connections(id) on delete set null,
  provider text not null,
  idempotency_key text not null unique,
  status text not null default 'running',
  attempts integer not null default 1,
  started_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.referrals enable row level security;
alter table public.sync_jobs enable row level security;

create policy "admin_coupon_redemptions_manage" on public.coupon_redemptions
  for all to authenticated using (public.is_org_admin(organization_id));
create policy "admin_referrals_manage" on public.referrals
  for all to authenticated using (public.is_org_admin(organization_id));
create policy "member_sync_jobs_view" on public.sync_jobs
  for select to authenticated using (public.is_org_member(organization_id));
create policy "admin_sync_jobs_manage" on public.sync_jobs
  for all to authenticated using (public.is_org_admin(organization_id));

-- Add webhook processing audit fields.
alter table if exists public.webhook_events
  add column if not exists processed_at timestamptz,
  add column if not exists error_message text;

alter table if exists public.subscriptions
  add column if not exists billing_provider text,
  add column if not exists provider_subscription_id text;

-- Align quota limits with plan definitions in app.
create or replace function public.sync_quotas_from_plan()
returns trigger
language plpgsql
security definer
as $$
declare
  ai_limit int := 150;
begin
  if new.plan_code = 'pro' then ai_limit := 1000; end if;
  if new.plan_code = 'enterprise' then ai_limit := 999999; end if;

  insert into public.usage_quotas (organization_id, quota_name, used, allowed, period_ends_at)
  values (new.organization_id, 'ai_queries', 0, ai_limit, coalesce(new.current_period_end, now() + interval '30 days'))
  on conflict (organization_id, quota_name) do update set
    allowed = ai_limit,
    period_ends_at = coalesce(new.current_period_end, now() + interval '30 days'),
    updated_at = now();

  return new;
end;
$$;

-- SEED DATA
-- NovaPilot AI: Strategic Demo Seed (Safe Mode)
-- Version: 1.0.1
-- Created: 2026-05-07

DO $$
declare
  demo_org_id uuid := '00000000-0000-0000-0000-000000000000';
  -- Define demo user IDs (matching those used in seed_users.js)
  sa1_id uuid := '11111111-1111-1111-1111-111111111111'; -- superadmin@novapilot.ai
  ad1_id uuid := '22222222-2222-2222-2222-222222222222'; -- admin@novapilot.ai
  mg1_id uuid := '33333333-3333-3333-3333-333333333333'; -- manager@novapilot.ai
  tm1_id uuid := '44444444-4444-4444-4444-444444444444'; -- team@novapilot.ai
  cu1_id uuid := '55555555-5555-5555-5555-555555555555'; -- customer@novapilot.ai
begin

  -- 1. Strategic Pricing Plans
  INSERT INTO public.pricing_plans (name, plan_code, description, price_monthly, price_annual, features, is_active)
  VALUES 
    ('Starter Plan', 'basic', 'Essential intelligence for early-stage teams optimizing velocity.', 3.00, 30.00, '["15 Intelligence Queries / mo", "Basic Analytics Deck", "1 Unified Workspace", "Standard Charts", "Weekly Performance Summaries", "Guided Onboarding"]'::jsonb, true),
    ('Growth Plan', 'pro', 'Advanced intelligence for high-growth teams scaling operations.', 6.00, 60.00, '["50 Intelligence Queries / mo", "Anomaly Detection Suite", "Team Collaboration", "Strategic Alert Center", "Advanced Precision Analytics", "Multiple Data Connectors", "Extended Insight History", "Priority Signal Processing"]'::jsonb, true),
    ('Pro Plan', 'enterprise', 'Complete premium workspace for organizations demanding total oversight.', 9.00, 90.00, '["Unlimited Intelligence Queries", "Advanced Precision Analytics", "Premium AI Workflows", "Custom Strategic Exports", "Governance & Audit Tools", "Unlimited Saved Insights", "White-Glove Implementation", "All Ecosystem Connectors", "24/7 Priority Support"]'::jsonb, true)
  ON CONFLICT (plan_code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_annual = EXCLUDED.price_annual,
    features = EXCLUDED.features;

  -- 2. Demo Organization (Global, No dependencies)
  INSERT INTO public.organizations (id, name, slug)
  VALUES (demo_org_id, 'Nova Intelligence Group', 'nova-intel-group')
  ON CONFLICT (id) DO NOTHING;

  -- 3. Subscriptions (Depends on Org and Plan)
  INSERT INTO public.subscriptions (organization_id, plan_code, status, current_period_end)
  VALUES (demo_org_id, 'pro', 'active', now() + interval '30 days')
  ON CONFLICT (organization_id) DO NOTHING;

  -- 4. Data Pipelines (Depends on Org)
  INSERT INTO public.data_connections (organization_id, provider, status, last_synced_at, metadata)
  VALUES
    (demo_org_id, 'stripe', 'connected', now() - interval '10 minutes', '{"environment":"production_main"}'::jsonb),
    (demo_org_id, 'hubspot', 'connected', now() - interval '45 minutes', '{"segment":"enterprise_sales"}'::jsonb),
    (demo_org_id, 'ga4', 'connected', now() - interval '1 hour', '{"property":"global_workspace"}'::jsonb)
  ON CONFLICT (organization_id, provider) DO UPDATE SET status = EXCLUDED.status, last_synced_at = EXCLUDED.last_synced_at;

  -- 5. Weekly Performance Reviews (Depends on Org)
  INSERT INTO public.weekly_growth_reviews (organization_id, generated_for_week, summary, top_risk, top_win, recommended_action)
  VALUES
    (demo_org_id, current_date, 'Strong MRR acceleration (8.4%) sustained by high-value enterprise transitions.', 'Mobile channel engagement showing early-stage plateau.', 'Secured 3 high-impact strategic partnerships.', 'Initiate mobile-first UX optimization cycle.')
  ON CONFLICT (organization_id, generated_for_week) DO NOTHING;

  -- 6. Precision Analytics Metrics (Depends on Org)
  INSERT INTO public.analytics_metrics (organization_id, metric_date, mrr, active_users, cac, ltv, anomaly_score, anomaly_description)
  VALUES 
    (demo_org_id, current_date - interval '6 days', 14200, 1150, 45, 1200, null, null),
    (demo_org_id, current_date - interval '5 days', 14350, 1180, 44, 1210, null, null),
    (demo_org_id, current_date - interval '4 days', 14500, 1205, 46, 1215, null, null),
    (demo_org_id, current_date - interval '3 days', 14900, 1250, 48, 1220, 89, 'High-velocity MRR spike observed from enterprise account conversions.'),
    (demo_org_id, current_date - interval '2 days', 15100, 1290, 42, 1250, null, null),
    (demo_org_id, current_date - interval '1 days', 15300, 1310, 40, 1260, null, null),
    (demo_org_id, current_date, 15420, 1335, 38, 1280, null, null)
  ON CONFLICT (organization_id, metric_date) DO UPDATE SET
    mrr = EXCLUDED.mrr,
    active_users = EXCLUDED.active_users,
    cac = EXCLUDED.cac,
    ltv = EXCLUDED.ltv,
    anomaly_score = EXCLUDED.anomaly_score,
    anomaly_description = EXCLUDED.anomaly_description;

  -- 7. Onboarding State (Depends on Org)
  INSERT INTO public.onboarding_progress (organization_id, step_1_connected, step_2_queries, step_3_team, completed)
  VALUES (demo_org_id, true, true, false, false)
  ON CONFLICT (organization_id) DO UPDATE SET 
    step_1_connected = EXCLUDED.step_1_connected,
    step_2_queries = EXCLUDED.step_2_queries;

  -- 8. USER-DEPENDENT DATA (Only inserted if auth.users exists)
  -- This section prevents the script from failing during a full reset before seed_users.js is run.
  
  -- Profiles
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = sa1_id) THEN
    INSERT INTO public.profiles (id, full_name, job_title, bio)
    VALUES 
      (sa1_id, 'Alex Vance', 'Chief Data Officer', 'Driving enterprise-wide intelligence strategies.'),
      (ad1_id, 'Jordan Smith', 'Operations Director', 'Optimizing scaling infrastructure.'),
      (mg1_id, 'Sarah Chen', 'Growth Lead', 'Focused on high-velocity expansion.'),
      (tm1_id, 'Mike Ross', 'Senior Analyst', 'Synthesizing complex data ecosystems.'),
      (cu1_id, 'Elite Partner', 'Strategic Client', 'Enterprise-grade growth partner.')
    ON CONFLICT (id) DO UPDATE SET 
      full_name = EXCLUDED.full_name,
      job_title = EXCLUDED.job_title;

    -- Membership
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES 
      (demo_org_id, sa1_id, 'super_admin'),
      (demo_org_id, ad1_id, 'admin'),
      (demo_org_id, mg1_id, 'manager'),
      (demo_org_id, tm1_id, 'team_member'),
      (demo_org_id, cu1_id, 'customer')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;

    -- Notifications
    INSERT INTO public.notifications (organization_id, user_id, title, body, is_read)
    VALUES
      (demo_org_id, sa1_id, 'Intelligence Cycle Finalized', 'The Q3 revenue velocity analysis is now available for review in your dashboard.', false),
      (demo_org_id, ad1_id, 'Security Protocol Verified', 'Quarterly data integrity audit completed with zero non-compliance issues.', true),
      (demo_org_id, mg1_id, 'Operational Anomaly Detected', 'Inbound lead response latency has exceeded established thresholds by 12%.', false)
    ON CONFLICT DO NOTHING;

    -- Chat Threads
    INSERT INTO public.chat_threads (id, organization_id, created_by, title)
    VALUES 
      ('10000000-0000-0000-0000-000000000001', demo_org_id, sa1_id, 'Revenue Velocity Analysis'),
      ('10000000-0000-0000-0000-000000000002', demo_org_id, ad1_id, 'Unit Economics Q2 Assessment')
    ON CONFLICT (id) DO NOTHING;

    -- AI Queries
    INSERT INTO public.ai_queries (organization_id, user_id, thread_id, query_text, answer_text, confidence_score, freshness_status)
    VALUES
      (demo_org_id, sa1_id, '10000000-0000-0000-0000-000000000001', 'Analyze the MRR acceleration observed 72 hours ago.', 'The observed 400 MRR spike is directly attributed to three enterprise-tier conversions originating from the HubSpot "Scale Strategic" campaign. Confidence: 94%.', 94, 'fresh'),
      (demo_org_id, ad1_id, '10000000-0000-0000-0000-000000000002', 'Provide the current aggregate CAC.', 'The weighted average Customer Acquisition Cost (CAC) across all verified channels is currently $38. Source: Marketing Spend API + Sales Attribution Hub.', 88, 'stale')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ── PERMISSIONS ──
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

  NOTIFY pgrst, 'reload';

END $$;

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

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

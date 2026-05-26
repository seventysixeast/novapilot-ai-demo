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

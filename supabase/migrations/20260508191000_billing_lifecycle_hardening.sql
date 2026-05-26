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

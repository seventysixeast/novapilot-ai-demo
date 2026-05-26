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

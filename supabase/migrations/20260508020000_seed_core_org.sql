-- Create a system-level default organization for fallbacks
-- This ensures that Foreign Key constraints never block AI features for whitelisted users

INSERT INTO public.organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000000', 'NovaPilot Global System', 'system-workspace')
ON CONFLICT (id) DO NOTHING;

-- Ensure all admin/testers are members of the system workspace
-- We'll do this dynamically in tenant.ts, but we can seed it for the primary dev email if we knew the ID.
-- Since we don't, we just ensure the Org exists.

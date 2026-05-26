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

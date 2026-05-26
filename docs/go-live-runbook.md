# One-Page Go-Live Runbook

## T-24h (Readiness Freeze)
- Confirm production env vars in Vercel, Supabase, OpenAI.
- Validate OAuth redirect URLs and custom domain.
- Run full CI pipeline (`lint`, `typecheck`, `unit`, `e2e`, `build`).
- Verify migrations and seed strategy for production-safe data.

## T-1h (Launch Verification)
- Smoke test signup/login/logout on production URL.
- Verify AI chat, upload, search, billing, settings paths.
- Confirm OG/Twitter previews, sitemap, robots, canonical tags.
- Validate status/security/privacy/terms/docs pages.

## T+1h (Stabilization Window)
- Watch error rates, p95 latency, auth failures, AI cost spikes.
- Track onboarding conversion and first-success events.
- Monitor billing events and webhook health.

## Rollback Plan
1. Revert app to previous stable Vercel deployment.
2. Disable risky feature flags.
3. Pause expensive AI routes if cost anomaly is detected.
4. Publish incident note on status page.

## Hotfix Strategy
- Create `hotfix/*` branch from latest stable tag.
- Ship targeted patch with minimal blast radius.
- Run focused QA + production smoke tests before release.

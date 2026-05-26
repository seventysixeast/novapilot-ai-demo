# Monitoring & Observability Playbook

## Recommended Stack
- Error tracking: Sentry
- Product analytics: PostHog
- Edge/network analytics: Vercel Analytics
- Traces/metrics: OpenTelemetry-compatible backend
- Uptime checks: Pingdom/UptimeRobot

## Key Dashboards
- API latency (p50, p95, p99)
- Auth success/failure rates
- AI requests, token usage, cost per workspace
- Upload/search reliability
- Billing event success rates
- Onboarding conversion funnel

## Alerting Thresholds
- Error rate > 2% for 5m
- Chat/API p95 > 2.5s for 10m
- OAuth/login failure spike > 3x baseline
- AI daily token usage > 85% quota

## Incident Workflow
1. Triage severity and impact scope.
2. Post initial status update.
3. Mitigate (feature flag, rollback, traffic shaping).
4. Validate fix and restore service.
5. Publish post-incident summary.

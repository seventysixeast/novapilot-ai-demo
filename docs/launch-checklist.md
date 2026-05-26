# Launch Checklist

## Environment Verification
- Validate all required env vars in `.env.local`, Vercel, and Supabase secrets.
- Confirm `OPENAI_API_KEY`, Supabase keys, app URL, and auth redirect URLs.

## Core Product Tests
- Signup/login/magic link/OAuth flows.
- Dashboard route protection and tenant isolation.
- AI chat send/retry/error flow.
- Document upload and search flow.

## Billing + Commercial
- Subscription plan rendering and upgrade modal interactions.
- Invoice history rendering and CSV/PDF actions.
- Token usage counters and progress visuals.

## SEO + Marketing
- Metadata, OG, Twitter cards, sitemap, robots validation.
- Structured data validation in rich result testing tools.
- Canonical URL correctness.

## Quality Gates
- Lighthouse run for performance, accessibility, SEO, best practices.
- Cross-device responsive checks (mobile/tablet/desktop).
- Keyboard navigation and focus state verification.

## Ops + Reliability
- Error tracking (Sentry or similar) configured.
- Analytics events configured (PostHog/GA/etc).
- Backup and restore process documented.
- Security incident contact and runbook available.

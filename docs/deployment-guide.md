# Deployment Guide

## Platforms
- Frontend: Vercel
- Database/Auth/Storage: Supabase

## Steps
1. Create production Supabase project.
2. Apply migrations in order from `supabase/migrations`.
3. Create required storage buckets and auth providers.
4. Add environment variables in Vercel.
5. Connect repository and deploy main branch.

## Post-Deploy Validation
- Open landing, login, dashboard, chat, billing pages.
- Verify OG image generation endpoint.
- Validate sitemap and robots endpoints.
- Confirm API calls and server actions run in production.

## Rollback
- Use previous Vercel deployment.
- Reapply stable migration snapshot if needed.
- Disable risky feature flags before rollback completion.

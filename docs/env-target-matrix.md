# Environment Variable Target Matrix

| Variable | Local `.env.local` | Vercel (Production) | Supabase Secrets | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Yes | No | Public base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | No | Public Supabase endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | No | Public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Yes (server only) | Optional | Never expose client-side |
| `OPENAI_API_KEY` | Yes | Yes (server only) | Optional | Rotated and monitored |
| `AI_DAILY_TOKEN_LIMIT` | Optional | Yes | No | Cost guardrail threshold |

## OAuth Redirect Targets
- `http://localhost:3000/auth/callback` (local)
- `https://<your-domain>/auth/callback` (production)

## Deployment Targets
- Frontend: Vercel project env vars
- Data/Auth/Storage: Supabase production project
- AI: OpenAI production key with usage alerts

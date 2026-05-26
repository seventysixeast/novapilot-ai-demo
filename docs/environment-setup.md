# Environment Setup

## Required Variables
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## Local
1. Copy `.env.example` to `.env.local`.
2. Fill values from Supabase/OpenAI dashboard.
3. Run `npm run dev`.

## Production
- Add all variables in deployment provider.
- Keep service role key and OpenAI key server-only.
- Rotate keys regularly.

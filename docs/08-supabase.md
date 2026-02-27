# Supabase Activation (Managed Instance)

Use this checklist when switching the app to a new managed Supabase project.

## 1. Update Environment Variables

Edit `.env` in the repo root:

```env
VITE_SUPABASE_URL=https://<new-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<new-publishable-key>
```

Notes:
- Use a public key (`sb_publishable_...` preferred, `anon` also supported), never `service_role`.
- Frontend reads these in `src/lib/supabase.ts`.

## 2. Enable Auth Providers

In Supabase Dashboard:

1. Open `Authentication -> Providers -> Web3 Wallet`.
2. Enable Ethereum.
3. Add your site URL under `Authentication -> URL Configuration` (include your exact sign-in path or `https://your-domain/**`).
4. Set Web3 rate limits and CAPTCHA under `Authentication -> Rate Limits` / `Authentication -> Bot Detection`.

## 3. Apply Database Schema + RLS Policy

Run the SQL in:

- `supabase/migrations/20260225001016_create_leaderboard_table.sql`
- `supabase/migrations/20260226224637_create_wallet_ledger.sql`
- `supabase/migrations/20260226225530_add_app_logs_and_wallet_disconnect.sql`
- `supabase/migrations/20260226232534_secure_wallet_auth_and_logs.sql`
- `supabase/migrations/20260227000000_consolidate_drop_browser_tables.sql`

This creates:
- `leaderboard` table
- `wallet_registry` table
- `app_logs` table (`event_name`, `payload`, timestamps, wallet_address linkage, `auth_user_id`)
- RLS enabled on all tables
- Public `SELECT` policy for `anon` and `authenticated` on `leaderboard`
- RPC write entrypoints:
  - `record_wallet_connect(p_wallet_address, p_client_timestamp, p_user_agent)`
  - `record_wallet_disconnect(p_wallet_address, p_client_timestamp, p_user_agent)`
  - `record_app_log(p_event_name, p_payload, p_wallet_address, p_client_timestamp, p_user_agent)`
  - RPCs require authenticated users, verify wallet ownership against `auth.identities`, and apply per-user rate limits
  - Direct table writes remain blocked by RLS

## 4. Match Frontend Query Expectations

Leaderboard page currently queries:

- table: `leaderboard`
- filter: `season = 1`
- order: `rank ASC`
- limit: `20`

Used fields:
- `id`
- `wallet_address`
- `rockets_launched`
- `et_burned`
- `eth_earned`
- `rank`
- `prev_rank`
- `season`
- `updated_at`

## 5. Rebuild / Redeploy

For Docker deploys, env vars are baked at build time, so rebuild is required:

```bash
make redeploy
```

Or pull latest + redeploy:

```bash
make refresh
```

For local dev (`npm run dev`), restart the dev server after changing `.env`.

## 6. Quick Verification

1. Open Leaderboard page.
2. Confirm rows load (not empty due to auth/RLS error).
3. Confirm sorting by rank and season-1 data.
4. Check browser console for Supabase auth/query errors.
5. Connect wallet and verify `wallet_login` + `wallet_logout` rows appear in `app_logs`.

## Common Pitfalls

- Wrong project URL or key pair.
- Using `service_role` in frontend.
- Missing `leaderboard` table or missing RLS `SELECT` policy.
- Changed schema names without updating frontend types/query.

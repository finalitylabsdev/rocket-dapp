# Supabase Activation (Managed Instance)

Use this checklist when switching the app to a new managed Supabase project.

## 1. Update Environment Variables

Edit `.env` in the repo root:

```env
VITE_SUPABASE_URL=https://<new-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<new-anon-public-key>
```

Notes:
- Use the `anon` key (public key), not `service_role`.
- Frontend reads these in `src/lib/supabase.ts`.

## 2. Apply Database Schema + RLS Policy

Run the SQL in:

- `supabase/migrations/20260225001016_create_leaderboard_table.sql`
- `supabase/migrations/20260226224637_create_wallet_ledger.sql`
- `supabase/migrations/20260226225530_add_app_logs_and_wallet_disconnect.sql`

This creates:
- `leaderboard` table
- RLS enabled
- Public `SELECT` policy for `anon` and `authenticated`
- Optional seed data
- Browser/wallet ledger tables:
  - `browser_profiles`
  - `wallet_registry`
  - `browser_wallets`
  - `app_state_ledger` (append-only)
- Generic application logs table:
  - `app_logs` (`event_name`, `payload`, timestamps, browser_id/wallet_address linkage)
- RPC write entrypoint:
  - `record_wallet_connect(p_browser_id, p_wallet_address, p_state, p_client_timestamp, p_user_agent)`
  - `record_wallet_disconnect(p_browser_id, p_wallet_address, p_state, p_client_timestamp, p_user_agent)`
  - Granted to `anon`/`authenticated`; direct table writes remain blocked by RLS

## 3. Match Frontend Query Expectations

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

## 4. Rebuild / Redeploy

For Docker deploys, env vars are baked at build time, so rebuild is required:

```bash
make redeploy
```

Or pull latest + redeploy:

```bash
make refresh
```

For local dev (`npm run dev`), restart the dev server after changing `.env`.

## 5. Quick Verification

1. Open Leaderboard page.
2. Confirm rows load (not empty due to auth/RLS error).
3. Confirm sorting by rank and season-1 data.
4. Check browser console for Supabase auth/query errors.

## Common Pitfalls

- Wrong project URL or key pair.
- Using `service_role` in frontend.
- Missing `leaderboard` table or missing RLS `SELECT` policy.
- Changed schema names without updating frontend types/query.

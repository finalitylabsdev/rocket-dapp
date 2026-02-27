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
- `supabase/migrations/20260227103000_add_eth_lock_submissions.sql`
- `supabase/migrations/20260227113000_eth_lock_status_workflow.sql`
- `supabase/migrations/20260227124500_add_eth_lock_active_override.sql`
- `supabase/migrations/20260227125500_fix_touch_eth_lock_submission_search_path.sql`
- `supabase/migrations/20260227134500_harden_eth_lock_rate_limits.sql`
- `supabase/migrations/20260227143000_add_explicit_deny_policies_for_internal_tables.sql`

This creates:
- `leaderboard` table
- `wallet_registry` table
- `app_logs` table (`event_name`, `payload`, timestamps, wallet_address linkage, `auth_user_id`)
- `eth_lock_submissions` table (`status`, `is_lock_active`, tx metadata, verification lifecycle)
- RLS enabled on all tables
- Public `SELECT` policy for `anon` and `authenticated` on `leaderboard`
- RPC write entrypoints:
  - `record_wallet_connect(p_wallet_address, p_client_timestamp, p_user_agent)`
  - `record_wallet_disconnect(p_wallet_address, p_client_timestamp, p_user_agent)`
  - `record_app_log(p_event_name, p_payload, p_wallet_address, p_client_timestamp, p_user_agent)`
  - `record_eth_lock_sent(p_wallet_address, p_tx_hash, p_chain_id, p_from_address, p_to_address, p_amount_wei, p_client_timestamp, p_user_agent)`
  - RPCs require authenticated users, verify wallet ownership against `auth.identities`, and apply per-user rate limits
  - Direct table writes remain blocked by RLS

## ETH Lock Retest Override

`eth_lock_submissions.is_lock_active` controls whether a previously confirmed wallet is treated as actively locked.

Normal behavior:
- A successful verification sets `status = 'confirmed'` and `is_lock_active = true`
- In that state, the wallet behaves exactly like the original one-shot flow and cannot submit a new lock

Retest behavior:
- Set `is_lock_active = false`
- The frontend treats the wallet as unlocked again
- `record_eth_lock_sent(...)` will allow the same wallet to submit a new test transaction
- The next successful verification sets `is_lock_active = true` again
- Repeated submit attempts are still throttled to 6 calls per 15 minutes per authenticated user

### Copy/Paste SQL

Disable the active lock for one wallet so the same wallet can test again:

```sql
update public.eth_lock_submissions
set is_lock_active = false,
    updated_at = now()
where wallet_address = '<wallet_address>';
```

Re-enable the active lock without replaying the flow:

```sql
update public.eth_lock_submissions
set is_lock_active = true,
    updated_at = now()
where wallet_address = '<wallet_address>';
```

Inspect the current ETH lock state for one wallet:

```sql
select
  wallet_address,
  status,
  is_lock_active,
  tx_hash,
  confirmed_at,
  updated_at
from public.eth_lock_submissions
where wallet_address = '<wallet_address>';
```

### LLM-Friendly MCP Pattern

When using the Supabase MCP tool, use `mcp__supabase__execute_sql` with one of the statements above.

Example request shape:

```sql
update public.eth_lock_submissions
set is_lock_active = false,
    updated_at = now()
where wallet_address = '0x6e0871b8c18b9090d36c03465c50b7a5c264908b';
```

## Security Advisor Notes

Current expected outcomes:
- `Function Search Path Mutable` on `public.touch_eth_lock_submission` is addressed by `20260227125500_fix_touch_eth_lock_submission_search_path.sql`
- `record_eth_lock_sent(...)` now rate-limits repeated submissions, and `verify-eth-lock` applies a 20-second server-side verification cooldown to reduce RPC abuse
- Internal tables (`app_logs`, `app_state_ledger`, `browser_profiles`, `browser_wallets`, `wallet_registry`) now use explicit deny-all client policies so Security Advisor no longer flags them as policy-less

Recommended follow-up:
- Keep the internal tables private if that is the intent, but consider adding explicit deny-all policies if you want to make the no-direct-access stance obvious and silence those Advisor items
- Review whether `browser_profiles` / `browser_wallets` are still needed at all, since older migrations suggest they may be legacy
- Enable leaked password protection in Supabase Auth unless you have a concrete reason not to

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

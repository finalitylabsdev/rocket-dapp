# Security Hardening Status

This document tracks the concrete Supabase security hardening applied to the current project and the remaining manual follow-up.

## Applied Changes

The following controls are now in place:

- `supabase/migrations/20260227125500_fix_touch_eth_lock_submission_search_path.sql`
  - Recreates `public.touch_eth_lock_submission()` with an explicit `search_path`
  - Clears the Security Advisor `Function Search Path Mutable` warning for that function

- `supabase/migrations/20260227134500_harden_eth_lock_rate_limits.sql`
  - Adds a per-user throttle to `record_eth_lock_sent(...)`
  - Caps ETH lock submissions at 6 calls per 15 minutes per authenticated user
  - Reduces spam writes to `app_logs` and limits the easiest abuse path for repeated ETH lock transaction persistence

- `supabase/functions/verify-eth-lock/index.ts`
  - Returns the same `404` for both missing submissions and submissions owned by a different user
  - Removes the wallet-presence enumeration difference that previously surfaced as `404` vs `403`
  - Applies a 20-second verification cooldown while a submission is already `verifying`
  - Reduces repeat Ethereum RPC polling when the frontend or a caller retries too aggressively

- `supabase/migrations/20260227143000_add_explicit_deny_policies_for_internal_tables.sql`
  - Adds explicit deny-all RLS policies for `app_logs`, `app_state_ledger`, `browser_profiles`, `browser_wallets`, and `wallet_registry`
  - Makes the “internal-only” access model explicit instead of relying on “RLS enabled with zero policies”
  - Clears the Security Advisor `RLS Enabled No Policy` findings for those tables

## Current Security Advisor State

After the latest hardening pass, the expected remaining Security Advisor warning is:

- `Leaked Password Protection Disabled` (`WARN`)
  - This is a Supabase Auth project setting, not a SQL migration issue
  - It should be enabled in the Supabase Dashboard unless there is a deliberate product reason to keep it off

## Manual Dashboard Action

Enable leaked password protection:

1. Open Supabase Dashboard.
2. Go to `Authentication -> Providers` or the current Auth security settings area.
3. Enable leaked password protection / compromised password checks.

Supabase references this warning here:

- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Notes

- The deny-all policies intentionally apply only to `anon` and `authenticated`.
- Service-role and privileged backend paths continue to work as before.
- The browser-linked tables still exist in the live database, so they remain part of the schema surface until they are explicitly removed in a later cleanup migration.
- If those legacy tables are confirmed unused, dropping them is still cleaner than carrying them indefinitely.

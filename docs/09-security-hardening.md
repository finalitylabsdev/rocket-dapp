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

- `supabase/migrations/20260228120000_add_nebula_bids_auction.sql`
  - Enables RLS on `auction_rounds`, `auction_submissions`, `auction_bids`
  - Grants `SELECT` only to `authenticated`; explicitly revokes `INSERT`, `UPDATE`, `DELETE` from `anon` and `authenticated`
  - All write mutations happen through `SECURITY DEFINER` RPCs with explicit `search_path = public`
  - Lifecycle RPCs (`start_auction_round`, `transition_auction_to_bidding`, `finalize_auction`) are restricted to `service_role` only
  - Player RPCs (`submit_auction_item`, `place_auction_bid`) are restricted to `authenticated` only
  - Read RPCs (`get_active_auction`, `get_auction_history`) are restricted to `authenticated` only
  - Wallet ownership is verified via `resolve_authenticated_wallet()` in every player-facing RPC

- `supabase/migrations/20260227153000_add_flux_faucet_ledger.sql`
  - RLS denies all direct client access to `wallet_flux_balances` and `flux_ledger_entries`
  - All balance mutations happen through RPCs only
  - Ledger entries are append-only from the client perspective

- `supabase/migrations/20260228130000_add_auction_ops_diagnostics.sql`
  - Adds `auction_round_diagnostics`, `flux_ledger_reconciliation`, `auction_scheduler_health` views
  - All views are explicitly denied to `anon` and `authenticated`
  - Only `service_role` can read diagnostic views

- `supabase/functions/auction-tick/index.ts`
  - Bearer token validation against `SUPABASE_SERVICE_ROLE_KEY` and optional `AUCTION_TICK_SERVICE_ROLE_FALLBACK`
  - 30-second in-memory rate limit between invocations
  - Uses service-role client for all RPC calls (never impersonates a user)

## RLS Summary by Table

| Table | RLS | `anon` | `authenticated` | `service_role` | Notes |
|-------|-----|--------|-----------------|----------------|-------|
| `auction_rounds` | Enabled | No access | SELECT only | Full | Writes via RPCs only |
| `auction_submissions` | Enabled | No access | SELECT only | Full | Writes via RPCs only |
| `auction_bids` | Enabled | No access | SELECT only | Full | Writes via RPCs only |
| `wallet_flux_balances` | Enabled | No access | No access | Full | All mutations via RPCs |
| `flux_ledger_entries` | Enabled | No access | No access | Full | Append-only via RPCs |
| `inventory_parts` | Enabled | No access | SELECT own | Full | Writes via RPCs only |
| `app_logs` | Enabled | Deny-all | Deny-all | Full | Explicit deny policy |
| `app_state_ledger` | Enabled | Deny-all | Deny-all | Full | Explicit deny policy |
| `browser_profiles` | Enabled | Deny-all | Deny-all | Full | Explicit deny policy |
| `browser_wallets` | Enabled | Deny-all | Deny-all | Full | Explicit deny policy |
| `wallet_registry` | Enabled | Deny-all | Deny-all | Full | Explicit deny policy |

## RPC Permission Summary

| Function | `anon` | `authenticated` | `service_role` | Validates wallet? |
|----------|--------|-----------------|----------------|-------------------|
| `submit_auction_item` | No | Yes | Yes | Yes |
| `place_auction_bid` | No | Yes | Yes | Yes |
| `get_active_auction` | No | Yes | Yes | No (read-only) |
| `get_auction_history` | No | Yes | Yes | No (read-only) |
| `start_auction_round` | No | No | Yes | N/A (system) |
| `transition_auction_to_bidding` | No | No | Yes | N/A (system) |
| `finalize_auction` | No | No | Yes | N/A (system) |
| `open_mystery_box` | No | Yes | Yes | Yes |
| `record_eth_lock_sent` | No | Yes | Yes | Yes |

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
- All `SECURITY DEFINER` functions use explicit `SET search_path = public` to prevent search path injection.
- Auction diagnostic views are service-role-only and expose no data to end users.

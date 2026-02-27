# Security Hardening Status

> Last updated: 2026-02-27

This document records the security controls that are actually present in the current repo, plus the remaining manual follow-up. It is intentionally scoped to the schema and server code that ship today, not to earlier schema that has already been removed.

## Current Schema Reality

- `browser_profiles`, `browser_wallets`, and `app_state_ledger` were dropped by `supabase/migrations/20260227000000_consolidate_drop_browser_tables.sql`.
- `supabase/migrations/20260227143000_add_explicit_deny_policies_for_internal_tables.sql` still checks those legacy table names with `to_regclass(...)`, but only as a defensive no-op for environments that may not have been fully consolidated yet.
- The current internal tables that still exist and matter for hardening are `app_logs`, `wallet_registry`, `wallet_flux_balances`, `flux_ledger_entries`, and the gameplay tables added for Star Vault / Nebula Bids.

## Applied Controls

### Auth and audit writes

- `supabase/migrations/20260227000000_consolidate_drop_browser_tables.sql`
  - Removes the browser-linked tables and the redundant `app_state_ledger`.
  - Recreates `record_wallet_connect(...)`, `record_wallet_disconnect(...)`, and `record_app_log(...)` against the simplified schema.
- `supabase/migrations/20260226232534_secure_wallet_auth_and_logs.sql`
  - Binds log writes to authenticated Supabase users.
  - Verifies the requested wallet belongs to the active Auth identity.
  - Adds per-user rate limiting for connect/disconnect log writes.

### ETH lock

- `supabase/migrations/20260227103000_add_eth_lock_submissions.sql`
  - Adds canonical `eth_lock_submissions`.
  - Restricts reads to the owning authenticated user.
  - Keeps writes behind `record_eth_lock_submission(...)`.
- `supabase/migrations/20260227125500_fix_touch_eth_lock_submission_search_path.sql`
  - Recreates `touch_eth_lock_submission()` with explicit `SET search_path = public`.
- `supabase/migrations/20260227134500_harden_eth_lock_rate_limits.sql`
  - Caps `record_eth_lock_sent(...)` to 6 calls per 15 minutes per authenticated user.
- `supabase/functions/verify-eth-lock/index.ts`
  - Uses a uniform `404` for missing or foreign submissions.
  - Applies a 20-second verification cooldown while a submission is already verifying.

### FLUX ledger

- `supabase/migrations/20260227153000_add_flux_faucet_ledger.sql`
  - Adds `wallet_flux_balances` and append-only `flux_ledger_entries`.
  - Denies direct client access to both tables.
  - Routes balance changes through `SECURITY DEFINER` RPCs only.
  - Uses explicit `SET search_path = public` on the RPC layer.

### Star Vault inventory

- `supabase/migrations/20260228110000_add_inventory_and_box_rpc.sql`
  - Adds `inventory_parts` with RLS enabled.
  - Grants authenticated users `SELECT` on their own rows only.
  - Keeps writes in `open_mystery_box(...)` and other privileged server paths.
- `supabase/migrations/20260228140000_add_chain_cutover_linkage_fields.sql`
  - Adds metadata-only chain linkage columns to `inventory_parts`.
  - Does not change launch authority; the new fields default to `offchain`.

### Nebula Bids

- `supabase/migrations/20260228120000_add_nebula_bids_auction.sql`
  - Enables RLS on `auction_rounds`, `auction_submissions`, and `auction_bids`.
  - Grants `SELECT` only to `authenticated`.
  - Keeps all writes behind `SECURITY DEFINER` RPCs.
  - Restricts lifecycle RPCs (`start_auction_round`, `transition_auction_to_bidding`, `finalize_auction`) to `service_role`.
  - Restricts player RPCs (`submit_auction_item`, `place_auction_bid`) to `authenticated`.
- `supabase/migrations/20260228140000_add_chain_cutover_linkage_fields.sql`
  - Adds metadata-only bid-level chain linkage columns to `auction_bids`.
  - Leaves `auction_rounds` and `auction_submissions` unchanged because the future contract-side identifiers are still not stable enough to reserve safely.
- `supabase/functions/auction-tick/index.ts`
  - Requires a Bearer token matching `SUPABASE_SERVICE_ROLE_KEY` or `AUCTION_TICK_SERVICE_ROLE_FALLBACK`.
  - Applies a 30-second in-memory rate limit between invocations.
  - Uses a service-role client for all lifecycle RPC calls.

### Diagnostic surfaces

- `supabase/migrations/20260228130000_add_auction_ops_diagnostics.sql`
  - Adds `auction_round_diagnostics`, `flux_ledger_reconciliation`, and `auction_scheduler_health`.
  - Explicitly revokes all access from `anon` and `authenticated`.
  - Grants `SELECT` only to `service_role`.

## Table Access Summary

| Table group | RLS | `anon` | `authenticated` | `service_role` | Notes |
|-------------|-----|--------|-----------------|----------------|-------|
| `rarity_tiers`, `rocket_sections`, `part_variants`, `box_tiers`, `box_drop_weights` | Enabled | Read | Read | Full | Public catalog/reference data by design |
| `eth_lock_submissions` | Enabled | No access | Read own | Full | Writes via RPC + Edge Function flow |
| `inventory_parts` | Enabled | No access | Read own | Full | Writes via RPCs only |
| `auction_rounds`, `auction_submissions`, `auction_bids` | Enabled | No access | Read only | Full | Writes via RPCs only |
| `wallet_flux_balances`, `flux_ledger_entries` | Enabled | No access | No access | Full | Mutations only through server RPCs |
| `app_logs`, `wallet_registry` | Enabled | Deny-all | Deny-all | Full | Internal tables only |
| `auction_round_diagnostics`, `flux_ledger_reconciliation`, `auction_scheduler_health` | N/A (views) | No access | No access | Read | Service-role-only operational views |

## RPC Permission Summary

| Function | `anon` | `authenticated` | `service_role` | Purpose |
|----------|--------|-----------------|----------------|---------|
| `record_eth_lock_submission` | No | Yes | Yes | Persist wallet-owned ETH lock proof |
| `open_mystery_box` | No | Yes | Yes | Atomic FLUX debit + part creation |
| `submit_auction_item` | No | Yes | Yes | Lock and submit inventory part |
| `place_auction_bid` | No | Yes | Yes | Ledger-backed bid escrow |
| `get_active_auction`, `get_auction_history` | No | Yes | Yes | Authenticated read models |
| `start_auction_round`, `transition_auction_to_bidding`, `finalize_auction` | No | No | Yes | Scheduler-only lifecycle |

## Security Notes

- All shipped `SECURITY DEFINER` functions in the current gameplay path use explicit `SET search_path = public`.
- The chain linkage columns added for later cutover are metadata only in this launch branch; they do not introduce a second authority path.
- The repo no longer depends on browser fingerprint tables for auth or gameplay state.

## Remaining Manual Follow-Up

- Enable Supabase Auth leaked password protection in the dashboard.
- Complete the production deployment steps for `auction-tick` from the runbook; those are operational hardening tasks, not schema changes.
- If full inventory/auction event replay is required later, add dedicated append-only transition tables instead of treating current mutable state tables as a substitute event log.

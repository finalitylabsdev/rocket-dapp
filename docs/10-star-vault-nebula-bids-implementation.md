# Star Vault & Nebula Bids

> Version: 2.0
> Date: 2026-02-27
> Status: Implemented architecture record

This document is no longer a forward-looking build plan. The main Star Vault and Nebula Bids backend has already landed in this repo. What follows is the current architecture, the migration history that established it, and the remaining launch follow-up that is still intentionally manual or deferred.

## What Shipped

The current repo now runs App 3 on a database-authoritative model:

- Star Vault catalog data is stored in Supabase reference tables.
- Box opens are executed by `open_mystery_box(...)`, not by client RNG.
- Inventory ownership lives in `inventory_parts`.
- Nebula Bids rounds, submissions, and bids live in canonical auction tables.
- Auction lifecycle transitions are driven by the `auction-tick` Edge Function plus lifecycle RPCs.
- Operator diagnostics are available through service-role-only SQL views.

The chain is already used for wallet-linked identity proof and ETH lock verification, but not yet for gameplay authority.

## Migration Record

| Migration | What it established |
|-----------|---------------------|
| `20260228100000_add_star_vault_catalog.sql` | Catalog/config tables for rarity tiers, rocket sections, part variants, box tiers, and drop weights |
| `20260228110000_add_inventory_and_box_rpc.sql` | `inventory_parts`, `open_mystery_box(...)`, `get_user_inventory(...)`, inventory RLS |
| `20260228120000_add_nebula_bids_auction.sql` | `auction_rounds`, `auction_submissions`, `auction_bids`, bidding/submission/lifecycle RPCs, realtime publication |
| `20260228130000_add_auction_ops_diagnostics.sql` | `auction_round_diagnostics`, `flux_ledger_reconciliation`, `auction_scheduler_health` |
| `20260228140000_add_chain_cutover_linkage_fields.sql` | Additive chain-cutover metadata on `inventory_parts` and `auction_bids` |

This work sits on top of the earlier auth, ETH lock, and FLUX ledger migrations from `20260226224637` through `20260227153000`.

## Current Authority Model

### Launch authority

- Supabase is the gameplay source of truth for FLUX, inventory, and auctions.
- The chain is authoritative only for wallet-linked proof and ETH lock evidence.
- `GameState` and the App 3 UI mirror server snapshots; they do not author gameplay state.

### Reserved cutover metadata

The branch now reserves the first cutover fields directly on canonical records:

- `inventory_parts`
  - Existing provenance: `source`, `source_ref`
  - New linkage fields: `chain_status`, `chain_tx_hash`, `chain_token_id`, `chain_block_number`, `reconciled_at`
- `auction_bids`
  - New linkage fields: `chain_status`, `chain_tx_hash`, `chain_block_number`, `reconciled_at`

These fields are metadata only. They default to `offchain` and do not change runtime gameplay semantics.

### Explicit non-goals in the current repo

- `auction_rounds` and `auction_submissions` do not yet reserve contract-side IDs.
- FLUX balances are not chain-driven.
- On-chain auction settlement and on-chain part ownership are not active.
- Full event-history parity for mutable inventory/auction transitions is not implemented yet.

## Implemented Data Model

### Catalog and config

The following tables are read-only reference data:

- `rarity_tiers`
- `rocket_sections`
- `part_variants`
- `box_tiers`
- `box_drop_weights`

These replace the old hardcoded catalog and drop-table definitions for the launch path.

### Canonical gameplay state

- `wallet_flux_balances`
  - Current balance snapshot per wallet
- `flux_ledger_entries`
  - Append-only balance ledger for faucet claims, box opens, bid escrow, refunds, and seller payouts
- `inventory_parts`
  - Canonical part ownership, stats, rarity, and lock/equip state
- `auction_rounds`
  - Round timing and winner summary
- `auction_submissions`
  - Submitted parts for a round
- `auction_bids`
  - Bid records plus ledger references for escrow/refunds

### Operational read models

- `auction_round_diagnostics`
- `flux_ledger_reconciliation`
- `auction_scheduler_health`

These are service-role-only operational views, not public gameplay tables.

## Implemented Runtime Flows

### Star Vault box open

`open_mystery_box(...)` performs the launch path atomically:

1. Resolve the authenticated wallet.
2. Validate the selected box tier.
3. Ensure the wallet balance row exists and apply any first-time whitelist bonus.
4. Debit FLUX by writing `flux_ledger_entries` and updating `wallet_flux_balances`.
5. Pick rarity and part variant server-side.
6. Insert the canonical `inventory_parts` row.
7. Return the created part plus the updated balance snapshot.

### Nebula Bids player flow

- `submit_auction_item(...)`
  - Verifies ownership, lock state, equip state, rarity threshold, and one-submission-per-wallet-per-round.
  - Locks the submitted part.
- `place_auction_bid(...)`
  - Verifies bidding window and minimum increment.
  - Refunds the bidder's own previous active bid before taking the new escrow delta.
  - Writes the new bid and its escrow ledger linkage.

### Nebula Bids lifecycle flow

- `start_auction_round()`
  - Starts a new round only when no active round exists.
- `transition_auction_to_bidding(round_id)`
  - Picks the best submission by `(rarity_tier_id DESC, part_value DESC)`.
  - Unlocks all non-selected submitted parts.
- `finalize_auction(round_id)`
  - Marks the winning bid.
  - Refunds losing bids.
  - Transfers the selected part to the winner.
  - Credits the seller.
  - Unlocks non-selected submitted parts.

`supabase/functions/auction-tick/index.ts` runs those lifecycle RPCs in three passes: transition, finalize, then start.

## Replay and Reconstruction Boundary

The current repo supports operational reconstruction, not full historical replay parity:

- Live App 3 state can be reconstructed from the canonical gameplay tables plus `flux_ledger_entries`.
- FLUX balance integrity can be checked with `flux_ledger_reconciliation`.
- Inventory and auction state transitions are not yet mirrored into dedicated append-only event tables.

If a future chain-primary cutover needs deterministic replay from historical events, the missing inventory/auction event layer should be added explicitly instead of inferring history from the latest mutable rows.

## Remaining Launch Follow-Up

The backend implementation is present, but several launch tasks are still outside the repo or intentionally deferred:

- Deploy `auction-tick` to the production Supabase project.
- Set `AUCTION_TICK_SERVICE_ROLE_FALLBACK` if an external scheduler will call it.
- Register and monitor a production cron job.
- Run production lifecycle verification across round start, transition, finalization, and restart.
- Add stronger balance-flow idempotency if the team wants stricter replay protection for all FLUX mutations.
- Migrate Rocket Lab off the legacy local-only 5-part downstream model.

This branch does not change auction refund semantics and does not add balance-flow idempotency changes.

## Historical Note

The previous version of this file was written as an implementation plan before the schema and RPC work landed. That planning content has been superseded by the migrations and runtime code now present in the repo. This version is the maintained record of the shipped architecture and the remaining launch gap.

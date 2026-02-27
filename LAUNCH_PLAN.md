# Launch Plan

> Version: 0.3.2
> Date: 2026-02-27
> Status: Active
> Scope reference: `SCOPE.md`

## Purpose

This document is the step-by-step launch plan for shipping Entropy in a hybrid mode that covers current scope without making blockchain the gameplay source of truth yet.

Launch mode:

- On-chain now: wallet connection, message signing, ETH transfer/lock verification
- Off-chain now: FLUX balances, Star Vault, inventory, Nebula Bids, auction settlement, UI state, metadata
- On-chain later: inventory ownership, box minting, auction escrow, auction settlement, final gameplay authority

The goal is to launch with a database-authoritative gameplay system that is explicitly shaped for a later blockchain cutover.

## Current Repo Status

### Implemented

- [x] Wallet auth and SIWE-style message-signature flow
- [x] ETH lock submission and verification pipeline
- [x] ETH lock database foundation and verification Edge Function
- [x] ETH lock backend hardening: cooldown, duplicate retry, rate limiting (6/15min), uniform 404
- [x] FLUX ledger and balance foundation (append-only, reason-coded, wallet-scoped)
- [x] Canonical Star Vault catalog tables in Supabase (rarity tiers, sections, variants, box tiers, drop weights)
- [x] Canonical Star Vault inventory table and `open_mystery_box()` RPC
- [x] Chain-cutover linkage metadata reserved on canonical gameplay records (`inventory_parts`, `auction_bids`)
- [x] Canonical Nebula Bids schema, bid/submission RPCs, and round lifecycle RPCs
- [x] `auction-tick` Edge Function with bearer token auth and 30s rate limiting
- [x] App 3 split UI for Star Vault, Nebula Bids, and shared inventory
- [x] Realtime-backed inventory and auction refresh wiring
- [x] Auction operator diagnostics panel (round lifecycle, bid/submission stats, scheduler health)
- [x] Auction ops SQL views: `auction_round_diagnostics`, `flux_ledger_reconciliation`, `auction_scheduler_health`
- [x] Auction-tick deployment runbook with secrets, cron, monitoring, and recovery procedures
- [x] Explicit deny-all RLS policies on internal tables
- [x] Security hardening documentation for ETH lock, RLS, and auction tables
- [x] `GameState` uses real server-backed FLUX and inventory snapshots
- [x] Basic multi-page product shell and page routing
- [x] Basic brand and visual primitives

### Launch-Critical Gaps

- [x] Remove remaining local authority from Rocket Lab state (only non-authoritative local simulation history persists)
- [x] Remove or explicitly demote Star Vault fallback catalog/config behavior from the normal launch path
- [x] Replace page-local nav bars with one persistent cross-app shell
- [x] Add visible ETH lock status UX (Hero shows lock state, realtime polling, retry on error)
- [ ] Add ETH lock gating that blocks access-sensitive flows for non-locked wallets
- [x] Replace placeholder-heavy box/part visual logic with metadata-driven rendering (tier-keyed visuals with explicit fallback are now the launch path)
- [x] Migrate Rocket Lab away from the legacy 5-part local model
- [ ] Deploy `auction-tick` to production and configure cron (see `docs/11-auction-tick-runbook.md`)
- [ ] Enable leaked password protection in Supabase Dashboard

### Remaining Launch Scope

- [x] Canonical asset and metadata pipeline for launch visuals (metadata-driven launch path shipped; asset URL swaps remain iterative art work)
- [x] Real App 4 compatibility for the canonical 8-part inventory model (Rocket Lab now consumes the canonical 8-slot inventory through a read-only adapter)
- [ ] Feature flags for staged rollout
- [ ] Launch rehearsal — internal, closed beta, public gates
- [ ] Full DB-versus-chain reconciliation workflows for later authority cutover

## Stage Progress Snapshot

These checklists describe the current codebase state as of the version/date above. They are intended to show shipped work versus remaining launch work, not the original idealized build order.

### Stage 0: Freeze the Hybrid Boundary

- [x] Supabase is the effective gameplay authority for App 3 at launch
- [x] The repo is aligned to DB-authoritative FLUX, inventory, and auctions
- [x] Write the authority matrix explicitly into launch docs so the boundary is operational, not implied

**3/3 done. The launch authority boundary is now explicit.**

### Stage 1: Harden Identity, Wallet Proof, and ETH Lock

- [x] Wallet auth and session restoration
- [x] ETH lock verification flow with Edge Function
- [x] ETH lock backend hardening: 20s verification cooldown, uniform 404, rate limiting (6 calls / 15 min)
- [x] Explicit deny-all RLS on current internal tables (`app_logs`, `wallet_registry`) with defensive no-op coverage for already-dropped legacy tables
- [ ] Launch-grade reconnect, wallet-switch, and invalid-session UX review
- [x] Expose ETH lock status clearly in the UI (Hero badge with LOCKED / PENDING / SENT / VERIFYING / ERROR states)
- [ ] Add ETH lock gating enforcement on access-sensitive flows
- [ ] Support-grade audit and dispute review workflow

**5/8 done. Remaining work is gating enforcement, UX review, and support tooling.**

### Stage 2: Build the Canonical DB Model

- [x] Catalog/config tables: rarity tiers (8), rocket sections (8), part variants (64), box tiers (8), drop weights
- [x] State tables: `inventory_parts`, `auction_rounds`, `auction_submissions`, `auction_bids`
- [x] Stable DB-backed IDs for all App 3 gameplay objects
- [x] `source` and `source_ref` fields on `inventory_parts` for provenance tracking
- [x] Reserve and document chain-linkage / reconciliation fields needed for later cutover
- [x] Document replay/reconstruction expectations if event-history parity is required

**6/6 done. The launch schema now carries explicit cutover metadata and documented replay boundaries.**

### Stage 3: Promote FLUX into the Full Gameplay Ledger

- [x] Star Vault box opening uses ledger-backed FLUX mutation
- [x] Nebula Bids bidding uses ledger-backed FLUX escrow/refund/payout
- [x] Faucet claims use ledger-backed FLUX mutation
- [x] Remove remaining implicit gameplay authority from local UI state
- [x] Rocket Lab is explicitly isolated from the launch economy (read-only inventory adapter + local simulation-only launches)
- [x] All FLUX mutations are reason-coded (`whitelist_bonus`, `faucet_claim`, `adjustment` with context)
- [x] FLUX ledger reconciliation view exists (`flux_ledger_reconciliation` — balance vs ledger sum per wallet)
- [ ] Add stronger idempotency keys for all balance-mutating flows

**7/8 done. Ledger integrity is in place and Rocket Lab is explicitly non-authoritative. Remaining work is idempotency hardening.**

### Stage 4: Replace the Star Vault Prototype with Server Authority

- [x] Box tiers load from the database
- [x] Box opening uses `open_mystery_box()` server RPC (atomic: debit FLUX, generate part, persist)
- [x] Part generation is server-side with RNG
- [x] Inventory is server-backed with realtime subscriptions
- [x] Remove fallback catalog/config assumptions from the normal production path
- [x] Harden failure-mode UX around partial outages and degraded reads
- [x] Replace placeholder rendering with canonical metadata-driven presentation

**7/7 done. Core server authority, degraded-read handling, and metadata-driven rendering are in place.**

### Stage 5: Build Nebula Bids End-to-End

- [x] Submission window and eligibility checks (Rare tier 3+ only, part locking, one submission per wallet per round)
- [x] Candidate selection: best by (rarity DESC, value DESC), non-selected parts unlocked
- [x] Bid placement with 5% minimum increment, escrow, outbid refund, bid replacement
- [x] Settlement: winner gets part, seller gets FLUX proceeds, losers refunded
- [x] Client UI: submissions, bidding, active round reads, history reads, realtime updates
- [x] `auction-tick` Edge Function with bearer auth, 30s rate limit, three-pass lifecycle
- [x] Operator diagnostics panel: round lifecycle timeline, bid/submission stats, scheduler health indicator
- [x] SQL diagnostics views: `auction_round_diagnostics`, `flux_ledger_reconciliation`, `auction_scheduler_health`
- [x] Deployment runbook: `docs/11-auction-tick-runbook.md` with secrets, cron config, monitoring, recovery, and explicit manual production steps
- [x] Local transactional smoke test passed on 2026-02-27 (box open -> submit -> bid -> finalize -> rollback on local Supabase)
- [ ] Deploy `auction-tick` to production with required secrets
- [ ] Configure production cron (pg_cron or external) at 5-minute cadence or better
- [ ] Verify full round lifecycle in production: start, transition, finalize, restart

**10/13 done. Runtime code and local smoke coverage are in place; deployment, cron, and production verification remain manual operational work.**

### Stage 6: Deliver the Shared Shell and App 3 UX

- [x] App 3 is split into Star Vault and Nebula Bids tabs
- [x] Shared inventory surface exists
- [x] Core loading / retry / empty / degraded states exist in App 3
- [x] Build one persistent cross-app navigation shell and wallet HUD
- [x] Remove per-page duplicated nav chrome
- [ ] Add clearer next-step / four-app journey cues
- [ ] Add lightweight onboarding path
- [ ] Replace placeholder docs links / dead-end navigation

**5/8 done. Shared shell and core App 3 state handling are in place. Remaining work is docs/navigation polish, journey guidance, and onboarding.**

### Stage 7: Establish the Canonical Asset and Metadata Pipeline

- [x] Canonical rarity / section / part / box data exists at the data-model level
- [x] Replace placeholder box visuals with tier-keyed launch visual treatments (local fallback until asset URLs land)
- [x] Define metadata-backed rendering for parts and boxes
- [x] Make UI rendering depend on metadata references instead of hardcoded visual branching
- [x] Keep fallback visuals only as explicit compatibility behavior if needed

**5/5 done. Metadata-driven rendering, keyed launch visuals, and explicit fallback behavior are in place.**

### Stage 8: Add App 4 Compatibility Only

- [x] Canonical 8-section inventory model exists in App 3
- [x] Type-level groundwork exists for canonical part data
- [x] Make Rocket Lab consume canonical inventory or an explicit adapter
- [x] Remove the legacy 5-part local-only model as the effective downstream consumer
- [x] Eliminate model drift between App 3 rewards and downstream usage

**5/5 done. Rocket Lab now mirrors the canonical 8-slot inventory through an explicit compatibility adapter.**

### Stage 9: Add Ops Controls and Rehearse the Launch

- [x] Backend scheduler primitive (`auction-tick`)
- [x] Auction operator diagnostics panel in Nebula Bids UI
- [x] SQL diagnostic views for round lifecycle, ledger reconciliation, scheduler health
- [x] Deployment runbook with secrets, cron, monitoring, failure recovery, and explicit manual pre-launch steps
- [ ] Feature flags for staged rollout
- [ ] Support and audit tooling for wallet-level dispute review
- [ ] Launch rehearsal — internal, closed beta, public gates

**4/7 done. Ops visibility and runbook are in place. Rehearsal and feature flags are not started.**

## Launch Rules

These rules apply across every stage:

- Supabase is the authoritative gameplay ledger until chain cutover.
- No client-side gameplay action is allowed to be authoritative.
- Every material state mutation must be wallet-scoped, timestamped, auditable, and replayable.
- Current off-chain APIs must be shaped so they can later map to chain-backed implementations without a UI rewrite.
- ETH lock and signature verification are the only required blockchain-linked launch dependencies.

## Stage 0: Freeze the Hybrid Boundary

Define the exact authority split before building more product surface.

Deliverables:

- A written authority matrix for wallet auth, ETH lock, FLUX, inventory, auctions, and derived views
- Stable rules for what is on-chain now versus deferred
- A future cutover rule: no mixed authority between DB and chain for the same gameplay flow during launch

Launch authority matrix:

| Surface | Launch authority | Normal write path | Operational rule before cutover |
|---------|------------------|-------------------|---------------------------------|
| Wallet auth/session identity | Supabase Auth | Supabase Auth + wallet-signature login flow | Wallet signatures prove identity, but gameplay writes still key off authenticated Supabase user + verified wallet |
| Wallet-to-user ownership checks | `resolve_authenticated_wallet()` + `wallet_registry` | `SECURITY DEFINER` RPCs only | Wallet ownership mismatches block writes; no client-side override |
| ETH lock proof / whitelist gate | `eth_lock_submissions` + `verify-eth-lock` | `record_eth_lock_submission(...)` + Edge Function verification | Chain receipt is evidence for eligibility only; it does not become gameplay authority |
| FLUX balances and ledger | `wallet_flux_balances` + `flux_ledger_entries` | Ledger-backed RPCs only | No client cache or chain read can credit/debit FLUX directly during launch |
| Star Vault inventory / part ownership | `inventory_parts` | `open_mystery_box()` and auction settlement RPCs | `chain_*` fields are linkage metadata only until a full inventory cutover moves reads and writes together |
| Nebula Bids rounds / submissions / bids | `auction_rounds`, `auction_submissions`, `auction_bids` | Auction RPCs + `auction-tick` | Scheduler and RPCs own lifecycle; chain mirrors are deferred and cannot partially replace round logic |
| Derived reads / operator diagnostics | SQL views + read RPCs over canonical tables | Service-role queries / authenticated read RPCs | Derived views may lag, but they never become the source of truth |
| Rocket Lab local progression (`equipped`, `levels`, `scores`) | Local client state only | Frontend local state | Explicitly outside the launch-authoritative economy until migrated off the legacy local model |

Operational rules:

- If a chain event disagrees with DB state before cutover, treat it as audit evidence for manual review, not as an automatic gameplay mutation.
- A future cutover must move both reads and writes for a gameplay surface at the same release boundary.
- `service_role` may repair or reconcile data, but ad hoc edits are break-glass operations, not the normal authority path.

Exit criteria:

- The team agrees that gameplay remains DB-authoritative at launch
- No open ambiguity remains around which layer owns each state transition

## Stage 1: Harden Identity, Wallet Proof, and ETH Lock

Preserve the existing wallet and ETH-lock foundation, but make it launch-safe.

Work:

- Audit wallet auth for reconnect, wallet switching, and invalid session handling
- Harden ETH lock verification for idempotency and duplicate submission safety
- Ensure verified ETH lock state is the only gating input needed for access-sensitive flows
- Keep auditability strong for support and dispute review

Exit criteria:

- A user can connect, sign in, lock ETH, and reliably remain recognized across sessions
- Wallet changes do not leak or cross-contaminate user state

## Stage 2: Build the Canonical DB Model

Add the authoritative gameplay schema that the launch version actually runs on.

Work:

- Add catalog/config tables for rarity tiers, rocket sections, part variants, box tiers, and drop weights
- Add canonical state tables for inventory parts, auction submissions, auctions, bids, and derived ownership
- Keep the shipped append-only ledger (`flux_ledger_entries`) and document the still-missing event-history layer for full inventory/auction replay
- Add chain-ready linkage fields now where the mapping is unambiguous: `inventory_parts` reserves `source`, `source_ref`, `chain_status`, `chain_tx_hash`, `chain_token_id`, `chain_block_number`, `reconciled_at`; `auction_bids` reserves bid-level `chain_status`, `chain_tx_hash`, `chain_block_number`, `reconciled_at`
- Add stable public IDs that can later map to on-chain IDs

Current reconstruction boundary:

- Live App 3 state is reconstructable from canonical tables plus `flux_ledger_entries`.
- Full inventory/auction event-history parity still needs dedicated append-only transition tables before any chain-primary replay workflow is treated as launch-ready.

Exit criteria:

- The database can represent all App 3 gameplay without local-only fallback state
- Core gameplay state can be reconstructed from canonical tables, with any missing replay/event-history guarantees explicitly documented as follow-up work

## Stage 3: Promote FLUX into the Full Gameplay Ledger

Turn the existing FLUX foundation into the only valid source for gameplay debits and credits, and keep non-authoritative launch simulation outside that economy.

Work:

- Route all gameplay balance mutations through ledger-backed RPCs only
- Add reason-coded credits/debits for faucet, box purchase, bid escrow, refund, payout, and operational adjustments
- Add idempotency keys for all balance-mutating operations
- Remove any remaining implicit balance authority from local state
- Keep Rocket Lab as a read-only compatibility simulation until a server-authoritative launch path exists

Exit criteria:

- No user can gain or lose FLUX without a corresponding ledger record
- FLUX balances are reproducible from ledger history
- Rocket Lab cannot imply FLUX payout authority or write launch-side gameplay state in the compatibility branch

## Stage 4: Replace the Star Vault Prototype with Server Authority

Convert the current Star Vault UI from a prototype into a real product flow.

Work:

- Replace hardcoded catalog/config reads with DB-backed reads
- Replace client-side randomness with a server RPC
- Make box opening atomic: debit FLUX, generate canonical part, and persist inventory in one RPC
- Return canonical part payloads from the server only
- Remove local-only inventory creation from the box-open path

Exit criteria:

- Hardcoded box config is gone
- Client-side part generation is gone
- A refresh or crash during box open cannot lose FLUX without a persisted part result

## Stage 5: Build Nebula Bids End-to-End

Build Nebula Bids as a DB-authoritative auction engine.

Work:

- Add submission window and eligibility checks
- Add candidate selection logic for each round
- Add active auction state, bid placement, minimum increment enforcement, escrow, outbid refunds, final settlement, and seller payout
- Add a scheduler/cron-driven round lifecycle
- Add read models for current auction, auction history, and operator diagnostics
- Keep scheduler reruns operationally safe; treat stronger balance-flow idempotency as separate follow-up work (not in this branch)

Exit criteria:

- Auctions can run repeatedly after the documented production deploy + cron steps are completed
- Refunds, payouts, and winner selection remain operationally recoverable across scheduler reruns; stronger balance-flow idempotency is still a hardening follow-up

## Stage 6: Deliver the Shared Shell and App 3 UX

Once the backend truth exists, align the UI around it.

Work:

- Add a persistent navigation shell and wallet HUD
- Split App 3 properly into Star Vault and Nebula Bids
- Add inventory-driven navigation and next-step cues across the four-app journey
- Align global patterns: toasts, confirmation drawers, loading states, empty states, responsive behavior
- Add the platform-wide living starfield treatment
- Add a lightweight onboarding path

Exit criteria:

- App 3 no longer feels like an isolated prototype page
- The four-app journey is legible even before the rest of the platform is fully rebuilt

## Stage 7: Establish the Canonical Asset and Metadata Pipeline

Make visual content launchable without hardwiring placeholder logic into the product model.

Work:

- Replace placeholder box visuals with tier-specific launch assets
- Define canonical rarity treatments, including high-rarity motion/effects
- Establish the 8-section, 64-part metadata registry
- Make inventory and auction rendering depend on metadata references, not hardcoded visual branching
- Keep placeholder fallbacks only as a compatibility layer

Exit criteria:

- The UI can render canonical parts and boxes from stable metadata references
- Replacing art later does not require a domain model rewrite

## Stage 8: Add App 4 Compatibility Only

Do the minimum needed so App 3 outputs fit the broader product loop.

Work:

- Migrate domain types toward the canonical 8-part model
- Add a read-only adapter so Rocket Lab consumes canonical DB-backed inventory through the 8-slot section layout
- Remove model drift between App 3 rewards and downstream usage
- Keep Rocket Lab labeled as local simulation only until a server-authoritative launch path exists

Boundary:

- Do not attempt a full App 4 rebuild in this launch cycle
- Do not add a launch RPC, ledger write, or economic authority in this compatibility stage

Exit criteria:

- A canonical part earned in App 3 can be surfaced coherently outside App 3
- Rocket Lab uses canonical 8-slot section keys throughout and marks launch history/results as local simulation only

## Stage 9: Add Ops Controls and Rehearse the Launch

Prepare the product to run as a live service.

Work:

- Wire the documented scheduler monitoring, alerting, and failure visibility into production
- Add support and audit tooling
- Add feature flags for staged rollout
- Keep balance and auction reconciliation/admin views available; add wallet-eligibility support tooling separately
- Run internal rehearsal, closed beta, and public launch gates

Exit criteria:

- The team can detect and respond to launch issues without relying on ad hoc DB edits as the normal path
- The manual deployment steps in the runbook have been executed and verified in production

## Parallel Track: Prepare for Chain Cutover Later

This is architecture work only, not a launch dependency.

Prepare now:

- Keep service interfaces stable for future backend swaps
- Keep domain APIs stable across storage backends
- Add reconciliation hooks for future DB-versus-chain comparison
- Preserve the reserved chain-ready columns now present on `inventory_parts` and `auction_bids`
- Keep `auction_rounds` and `auction_submissions` off-chain-only until the contract-side round/listing identifiers are fixed and unambiguous

Do not do yet:

- Do not make the UI depend on chain events for core functionality
- Do not split authority between DB and chain for the same gameplay flow
- Do not partially tokenise isolated flows while the rest remains mutable and off-chain

## Remaining Recommended Execution Order

1. Stage 1: Harden identity, wallet proof, and ETH lock
2. Stage 3: Audit and harden the FLUX ledger paths now used by App 3
3. Stage 4: Remove launch-risk fallback behavior from Star Vault and validate failure handling
4. Stage 5: Add monitoring, operator controls, and rerun safety around live auctions
5. Stage 6: Deliver the shared shell and the remaining App 3 UX integration work
6. Stage 7: Establish the canonical asset and metadata pipeline
7. Stage 8: Add App 4 compatibility only
8. Stage 9: Add ops controls and rehearse the launch

## Go/No-Go Launch Standard

The hybrid launch is ready when:

- Wallet auth and ETH lock are stable and auditable
- No client-side gameplay logic remains authoritative
- No local-only inventory remains
- FLUX mutations are fully ledgered
- Star Vault is atomic and server-backed
- Nebula Bids can run unattended across repeated rounds
- App 3 fits the documented four-app journey
- The schema and service layer are already shaped for future chain authority

## Deferred Until Chain Authority

These are intentionally deferred beyond this launch plan:

- On-chain NFT minting for parts
- On-chain inventory as the source of truth
- On-chain auction escrow and settlement
- Chain-event-driven gameplay authority
- Full chain-primary reconciliation
- A broader migration of all game and prize systems to immutable contract-backed ownership

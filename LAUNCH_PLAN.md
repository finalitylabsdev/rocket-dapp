# Launch Plan

> Version: 0.2.0
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
- [x] FLUX ledger and balance foundation
- [x] Canonical Star Vault catalog tables in Supabase
- [x] Canonical Star Vault inventory table and `open_mystery_box()` RPC
- [x] Canonical Nebula Bids schema, bid/submission RPCs, and round lifecycle RPCs
- [x] `auction-tick` Edge Function exists as the scheduler primitive
- [x] App 3 split UI for Star Vault, Nebula Bids, and shared inventory
- [x] Realtime-backed inventory and auction refresh wiring
- [x] Basic multi-page product shell and page routing
- [x] Basic brand and visual primitives

### Partial / Must Harden

- [x] `GameState` uses real server-backed FLUX and inventory snapshots
- [ ] Remove local authority from `GameState` for equipped state, levels, and scores
- [ ] Remove or explicitly demote Star Vault fallback catalog/config behavior from the normal launch path
- [x] Replace page-local nav bars with one persistent cross-app shell
- [ ] Add visible ETH lock status / gating UX instead of keeping it only in libs
- [ ] Replace placeholder-heavy box/part visual logic with metadata-driven rendering
- [ ] Migrate Rocket Lab away from the legacy 5-part local model
- [ ] Add auction operator visibility, diagnostics, and recovery controls
- [ ] Add launch docs/runbook for scheduler deployment and cron configuration

### Still Missing For Launch

- [x] Persistent cross-app shell outside the current page-local App 3 surface
- [ ] Canonical asset and metadata pipeline for launch visuals
- [ ] Real App 4 compatibility for the canonical 8-part inventory model
- [ ] Ops controls, feature flags, and launch rehearsal tooling
- [ ] Full DB-versus-chain reconciliation workflows for later authority cutover
- [ ] Production deployment/scheduling of `auction-tick`
- [ ] Admin / reconciliation views for balances, auctions, and wallet eligibility

## Stage Progress Snapshot

### Stage 0: Freeze the Hybrid Boundary

- [x] Supabase is the effective gameplay authority for App 3 at launch
- [x] The repo is aligned to DB-authoritative FLUX, inventory, and auctions
- [ ] Write the authority matrix explicitly into launch docs so the boundary is operational, not implied

Status: Functionally complete, but the authority matrix should be made explicit.

### Stage 1: Harden Identity, Wallet Proof, and ETH Lock

- [x] Wallet auth and session restoration exist
- [x] ETH lock verification flow exists
- [x] ETH lock verification has backend hardening for cooldown / duplicate retry behavior
- [ ] Add launch-grade reconnect, wallet-switch, and invalid-session UX review
- [ ] Expose ETH lock status and gating clearly in the UI
- [ ] Confirm support-grade audit and dispute review workflow

Status: In progress.

### Stage 2: Build the Canonical DB Model

- [x] Catalog/config tables exist for rarity tiers, rocket sections, part variants, box tiers, and drop weights
- [x] Canonical state tables exist for inventory and auctions
- [x] Stable DB-backed IDs exist for current App 3 gameplay
- [ ] Add or document any still-required chain-linkage / reconciliation fields for later cutover
- [ ] Document replay/reconstruction expectations clearly if event-history parity is still required

Status: Core path landed.

### Stage 3: Promote FLUX into the Full Gameplay Ledger

- [x] Star Vault box opening uses ledger-backed FLUX mutation
- [x] Nebula Bids bidding uses ledger-backed FLUX mutation
- [x] Faucet claims use ledger-backed FLUX mutation
- [ ] Remove remaining implicit gameplay authority from local UI state
- [ ] Decide whether Rocket Lab is launch-authoritative or explicitly isolate it from the launch economy
- [ ] Add stronger idempotency / reconciliation review for all balance-mutating flows
- [ ] Add operator visibility for ledger-related support and reconciliation

Status: Core ledger flows landed, but not fully hardened.

### Stage 4: Replace the Star Vault Prototype with Server Authority

- [x] Box tiers load from the database
- [x] Box opening uses server RPCs
- [x] Part generation is server-side
- [x] Inventory is server-backed
- [ ] Remove fallback catalog/config assumptions from the normal production path
- [ ] Harden failure-mode UX around partial outages and degraded reads
- [ ] Replace placeholder rendering with canonical metadata-driven presentation

Status: Functional, but not fully launch-hardened.

### Stage 5: Build Nebula Bids End-to-End

- [x] Submission window and eligibility checks exist
- [x] Candidate selection and round lifecycle RPCs exist
- [x] Bid placement, escrow, refund, and settlement paths exist
- [x] Client UI supports submissions, bidding, active round reads, and history reads
- [x] Scheduler primitive exists via `auction-tick`
- [ ] Deploy `auction-tick` with required secrets
- [ ] Configure production cron / scheduler
- [ ] Add launch-grade operator controls and failure visibility
- [ ] Add reconciliation/admin views for support

Status: Functional, but live-service hardening remains.

### Stage 6: Deliver the Shared Shell and App 3 UX

- [x] App 3 is split into Star Vault and Nebula Bids
- [x] Shared inventory surface exists
- [x] Core loading / retry / empty states exist in App 3
- [x] Build one persistent cross-app navigation shell and wallet HUD
- [x] Remove per-page duplicated nav chrome
- [ ] Add clearer next-step / four-app journey cues
- [ ] Add lightweight onboarding path
- [x] Replace placeholder docs links / dead-end navigation

Status: Partially complete.

### Stage 7: Establish the Canonical Asset and Metadata Pipeline

- [x] Canonical rarity / section / part / box data exists at the data-model level
- [ ] Replace placeholder box visuals with launch-ready assets
- [ ] Define metadata-backed rendering for parts and boxes
- [ ] Make UI rendering depend on metadata references instead of hardcoded visual branching
- [ ] Keep fallback visuals only as explicit compatibility behavior if needed

Status: Not started in a launch-ready form.

### Stage 8: Add App 4 Compatibility Only

- [x] Canonical 8-section inventory model exists in App 3
- [x] Type-level groundwork exists for canonical part data
- [ ] Make Rocket Lab consume canonical inventory or an explicit adapter
- [ ] Remove the legacy 5-part local-only model as the effective downstream consumer
- [ ] Eliminate model drift between App 3 rewards and downstream usage

Status: Partial compatibility prep only.

### Stage 9: Add Ops Controls and Rehearse the Launch

- [x] Backend scheduler primitive exists (`auction-tick`)
- [ ] Add scheduler monitoring and failure visibility
- [ ] Add support and audit tooling
- [ ] Add feature flags for staged rollout
- [ ] Add admin/reconciliation views for balances, auctions, and wallet eligibility
- [ ] Write a launch runbook and rehearsal checklist
- [ ] Run internal rehearsal, closed beta, and public launch gates

Status: Early partial on backend primitives only.

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
- Add append-only event tables for every critical state transition
- Add chain-ready linkage fields now: `source`, `chain_status`, `chain_tx_hash`, `chain_token_id`, `chain_block_number`, `reconciled_at`
- Add stable public IDs that can later map to on-chain IDs

Exit criteria:

- The database can represent all App 3 gameplay without local-only fallback state
- Core gameplay state can be reconstructed from canonical tables plus event history

## Stage 3: Promote FLUX into the Full Gameplay Ledger

Turn the existing FLUX foundation into the only valid source for gameplay debits and credits.

Work:

- Route all gameplay balance mutations through ledger-backed RPCs only
- Add reason-coded credits/debits for faucet, box purchase, bid escrow, refund, payout, and operational adjustments
- Add idempotency keys for all balance-mutating operations
- Remove any remaining implicit balance authority from local state

Exit criteria:

- No user can gain or lose FLUX without a corresponding ledger record
- FLUX balances are reproducible from ledger history

## Stage 4: Replace the Star Vault Prototype with Server Authority

Convert the current Star Vault UI from a prototype into a real product flow.

Work:

- Replace hardcoded catalog/config reads with DB-backed reads
- Replace client-side randomness with a server RPC
- Make box opening atomic: debit FLUX, generate canonical part, persist inventory, emit event records
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
- Add read models for current auction, bid history, contributor stats, and between-round states
- Make auction settlement idempotent

Exit criteria:

- Auctions can run repeatedly without manual operator intervention
- Refunds, payouts, and winner selection remain consistent across retries and scheduler reruns

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
- Add adapters so Rocket Lab can consume DB-backed inventory
- Remove model drift between App 3 rewards and downstream usage

Boundary:

- Do not attempt a full App 4 rebuild in this launch cycle

Exit criteria:

- A canonical part earned in App 3 can be surfaced coherently outside App 3

## Stage 9: Add Ops Controls and Rehearse the Launch

Prepare the product to run as a live service.

Work:

- Add scheduler monitoring and failure visibility
- Add support and audit tooling
- Add feature flags for staged rollout
- Add reconciliation/admin views for balances, auctions, and wallet eligibility
- Run internal rehearsal, closed beta, and public launch gates

Exit criteria:

- The team can detect and respond to launch issues without relying on ad hoc DB edits as the normal path

## Parallel Track: Prepare for Chain Cutover Later

This is architecture work only, not a launch dependency.

Prepare now:

- Keep service interfaces stable for future backend swaps
- Keep domain APIs stable across storage backends
- Add reconciliation hooks for future DB-versus-chain comparison
- Preserve chain-ready columns and status fields in the canonical model

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

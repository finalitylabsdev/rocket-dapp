# Entropy Testnet - Spec Freeze and App Alignment Plan

Status: Draft for implementation  
Date: 2026-02-26  
Scope: Align product behavior, UX, naming, economy, and data contracts across:
- `docs/05-app_overview.md`
- `docs/06-design_brand.md`
- `docs/04-system-overview.md`
- Current app implementation in `src/`

## 1. Objective

Create one implementation-ready baseline so the app can be built without ambiguity.  
This document freezes decisions where source docs conflict and defines phased work to align the app to the docs where that alignment is practical and valuable.

## 2. Source of Truth Hierarchy (Frozen)

1. `docs/05-app_overview.md` is primary for app behavior, economy loops, and user journey.
2. `docs/06-design_brand.md` is primary for visual system, motion, UX patterns, copy tone, accessibility, and responsive behavior.
3. `docs/04-system-overview.md` is primary for system constraints, deployment/security posture, and protocol-level framing, except where superseded by newer app-level decisions.
4. Existing code in `src/` is implementation state, not product truth.

## 3. Frozen Contradiction Resolutions

The following decisions are final unless a new change request is approved.

| Topic | Conflicts | Frozen Decision |
| --- | --- | --- |
| Native token name | ET vs Flux vs phi display | Contract/domain token name is `Flux`. UI amount prefix uses custom `phi` glyph. All `ET` references are deprecated aliases only. |
| Faucet function name | `claimET()` vs `claimFlux()` | Canonical function is `claimFlux()`. |
| Bridge whitelist signature | `whitelist(amount)` vs `whitelist()` payable | Canonical call is `whitelist()` payable with exact `0.05 ETH`. |
| DEX app name | Flux Exchange vs Entropy Exchange | User-facing brand name is `Entropy Exchange`. `Flux Exchange` remains an accepted legacy label in docs only until cleanup is complete. |
| Prize winners | Top 3 daily vs rank-1 trigger wording | Top 3 are winners per 24h epoch. Prize trigger must support all 3 winners, not rank 1 only. |
| Prize split clarity | "Top 3 get 50%" with no fixed breakdown | Distributable pool per epoch is 50% of locked ETH snapshot. Split of that distributable pool is fixed: 50% / 25% / 25% for places 1/2/3. |
| Auction refunds | "auto refunded" vs pull-based withdraw | Pull-based refunds are canonical for security. Outbid funds are claimable via `withdrawBid()`. |
| Rarity tiers | 8-tier in app/brand vs older reduced wording | Canonical rarity model is 8 tiers (Common -> Quantum) with the multipliers/prices in `docs/05-app_overview.md`. |
| Launch slot requirement | 8-slot rocket spec vs current 5-slot implementation | Canonical launch requirement is 8/8 slots filled. |
| Score formula | Formula without full parameters vs event-heavy gameplay | Canonical score equation includes rarity bonus and event penalties; constants are frozen in Section 5. |
| Event coverage | UI requires bid history/prize CTA but listener list misses events | Required indexed events include `AuctionStart`, `BidPlaced`, `AuctionEnded`, `LaunchCompleted`, and `PrizeTrigger`. |

## 4. Canonical Product Model (Frozen)

## 4.1 App Map and IA

1. Entropy Gate (Bridge + Faucet)
2. Entropy Exchange (DEX)
3. Star Vault (Mystery Boxes) + Nebula Bids (Auction)
4. Celestial Assembler + Quantum Lift-Off + Cosmic Jackpot

Global nav labels (desktop): `Gate`, `Exchange`, `Vault`, `Assembler`, `Jackpot`  
Global nav labels (mobile): same destinations with icon-first tab bar.

## 4.2 Token and Economy Semantics

1. `Flux` is the native token unit in contracts and internal domain types.
2. UI displays Flux amounts with the custom `phi` symbol.
3. Whitelist lock: exactly `0.05 ETH` per wallet.
4. Faucet claim: `1 Flux` per 24h window.
5. Locked ETH is prize source; ETH exits only via prize mechanism.

### Dev-mode note

Current app uses local simulation values (`100` Flux on lock, `10` per day).  
Freeze outcome: these multipliers must move behind an explicit development flag and not be used in production/default experience.

## 4.3 Rarity and Parts

Canonical rarity tiers and economics:

1. Common, x1.0, price 10
2. Uncommon, x1.25, price 25
3. Rare, x1.6, price 50
4. Epic, x2.0, price 100
5. Legendary, x2.5, price 200
6. Mythic, x3.2, price 350
7. Celestial, x4.0, price 500
8. Quantum, x5.0, price 750

Rocket assembly sections (8):
1. Core Engine
2. Wing-Plate
3. Fuel Cell
4. Navigation Module
5. Payload Bay
6. Thruster Array
7. Propulsion Cables
8. Shielding

## 4.4 Auction Rules

1. Cadence: 4-hour rounds.
2. Eligibility: rarity tier 3+ (Rare and above).
3. Min increment: 5%.
4. Escrow: locked bids; pull-based refunds.
5. Selection: one submitted item selected per round using deterministic rarity/stat ranking policy.

## 4.5 Launch and Leaderboard Rules

1. Launch allowed only with 8/8 equipped slots.
2. Score:
   - `GravScore = SumAttributes * (0.5 * EnvironmentFactor) * (1 + RarityBonus) - EventPenalties`
3. Random event families include the 6 listed in `docs/05-app_overview.md`.
4. Primary rank metric: cumulative Grav Score.
5. Epoch: 24h prize window.

## 5. Frozen Technical Parameters

These values must be centralized in one config module (`src/config/spec.ts`) and reused across UI/state/back-end integrations.

| Key | Value |
| --- | --- |
| `WHITELIST_ETH` | `0.05` |
| `FAUCET_INTERVAL_SECONDS` | `86400` |
| `FAUCET_CLAIM_FLUX` | `1` |
| `AUCTION_ROUND_SECONDS` | `14400` |
| `AUCTION_MIN_INCREMENT_BPS` | `500` |
| `AUCTION_MIN_RARITY_TIER` | `3` |
| `PRIZE_EPOCH_SECONDS` | `86400` |
| `PRIZE_DISTRIBUTABLE_SHARE_BPS` | `5000` |
| `PRIZE_SPLIT_BPS` | `[5000, 2500, 2500]` |
| `ROCKET_SLOT_COUNT` | `8` |
| `DEX_DEFAULT_SLIPPAGE` | `0.5` |

## 6. Implementation Gap Matrix (Current App vs Frozen Spec)

## 6.1 Domain State and Naming

Current:
- `src/context/GameState.tsx` uses 5 slots, 4 rarities, and simulation-only balance rules.
- `src/components/brand/RarityBadge.tsx` only supports Common/Rare/Epic/Legendary.
- Multiple components still use "Flux Exchange" naming.

Required:
1. Expand domain models to 8 slots and 8 rarities.
2. Separate simulation helpers from canonical rules.
3. Migrate naming to canonical app labels while keeping route compatibility.

## 6.2 Entropy Gate

Current:
- Hero has lock and daily claim interactions (`src/components/Hero.tsx`) but uses simulated rewards and no streak/XP logic.

Required:
1. Enforce canonical whitelist and faucet values.
2. Add streak/XP model and milestones (7/14/30 days).
3. Add wallet/network status and prize trigger CTA conditions.

## 6.3 Entropy Exchange

Current:
- `src/pages/DexPage.tsx`, `src/components/dex/*` implement swap/liquidity shells and slippage control.
- No canonical event wiring and no finalized depth/market sourcing contract.

Required:
1. Keep AMM-based swap and LP.
2. Define depth chart as reserve-derived depth (not CLOB orderbook).
3. Standardize copy/components to brand spec (labels, loaders, confirmation drawer, toast patterns).
4. Freeze optional features (`Flash Trade`, yield banner) as non-blocking enhancements.

## 6.4 Star Vault and Nebula Bids

Current:
- `src/components/mystery/BoxSection.tsx` has 4 tiers and no auction implementation.

Required:
1. Expand to 8 box tiers, 8 rarity outcomes, canonical pricing.
2. Implement inventory sorting/filtering by section/rarity/value/date.
3. Implement Nebula Bids round lifecycle, submit flow, bidding, escrow refunds, bid history.
4. Add no-active-auction state and round countdown.

## 6.5 Assembler and Lift-Off

Current:
- `src/pages/RocketLabPage.tsx` and `src/components/lab/*` consume `GameState.inventory` through a read-only 8-slot adapter keyed by `RocketSection`.
- Launch requires all 8 canonical slots to be filled with unlocked parts.
- Launch history/results are explicitly local simulation only in this branch (no launch RPC, ledger write, or economic authority).

Required:
1. Preserve the read-only compatibility boundary until a server-authoritative launch path exists.
2. Replace local simulation history/results with server authority only when that path is implemented.
3. Keep canonical Grav Score components and random event penalties aligned with the spec.
4. Preserve cinematic sequence, but keep simulation/compatibility copy explicit until cutover.

## 6.6 Cosmic Jackpot

Current:
- `src/pages/LeaderboardPage.tsx` consumes Supabase leaderboard data.
- Data fields still include `et_burned` naming in interface.

Required:
1. Migrate leaderboard schema naming to Flux-based naming.
2. Enforce top-3 epoch prize logic with deterministic payout shares.
3. Add prize-eligible CTA state tied to `PrizeTrigger`.
4. Add user trajectory chart and profile drill-down parity with design goals.

## 6.7 Design System and Accessibility

Current:
- `src/index.css` and `tailwind.config.js` use `Inter` and `JetBrains Mono` defaults.
- Brand spec calls for `Satoshi` + `Geist Mono`, app accent tokens, motion and accessibility patterns.

Required:
1. Adopt typography stack from design bible.
2. Ensure app-specific accent tokens and rarity override rules are respected.
3. Add full loading/empty/error state system and keyboard/ARIA support.
4. Add `prefers-reduced-motion` behavior across key animated flows.

## 7. Phased Delivery Plan

## Phase 0 - Doc Normalization and Freeze Commit

Deliverables:
1. Approve this spec freeze document.
2. Create a changelog section in `docs/04`, `docs/05`, `docs/06` pointing to this freeze.
3. Mark legacy terms (`ET`, `claimET`, `whitelist(amount)`) as deprecated.

Exit criteria:
1. One canonical glossary exists and is referenced by all docs.
2. No unresolved contradictions remain in freeze-critical areas.

## Phase 1 - Shared Domain and Config Refactor

Deliverables:
1. Add `src/config/spec.ts` with frozen constants.
2. Add canonical types (`Token`, `RarityTier8`, `RocketSection8`, `PrizeEpoch`).
3. Update state/context layer for 8-slot model and canonical token semantics.

Exit criteria:
1. No hardcoded economy constants outside config.
2. Existing pages compile with new domain types.

## Phase 2 - Entropy Gate Alignment

Deliverables:
1. Canonical lock/claim values and cooldown.
2. Streak/XP tracking and milestone UI.
3. Prize trigger condition in Gate and Jackpot surfaces.

Exit criteria:
1. Claim only succeeds after 24h interval.
2. XP progress and streak reset behavior tested.

## Phase 3 - Exchange Alignment

Deliverables:
1. Rename UI to `Entropy Exchange`.
2. Confirm slippage/fee display patterns and confirmation drawer behavior.
3. Implement reserve-based depth view and pool stats consistency.

Exit criteria:
1. Swap/LP actions always show explicit fee, slippage, minimum receive.
2. Brand and motion states align with design patterns.

## Phase 4 - Star Vault and Nebula Bids Alignment

Deliverables:
1. 8-tier box storefront.
2. Inventory filters/sorting and detail view.
3. Auction round engine, bidding, pull refunds, bid history, winner resolution.

Exit criteria:
1. Auction operates on 4h rounds in simulation/on-chain mode.
2. Refund path is pull-only and tested.

## Phase 5 - Assembler and Lift-Off Alignment

Deliverables:
1. 8-slot assembly UI with compatibility checks.
2. Canonical score formula implementation.
3. Random event pipeline and post-launch result view.

Exit criteria:
1. Launch blocked until 8/8 slots.
2. Score breakdown visible and reproducible from stored launch input.

## Phase 6 - Jackpot and Prize Distribution Alignment

Deliverables:
1. Cumulative Grav Score leaderboard.
2. Epoch finalization with top-3 split over distributable pool.
3. Prize claim UX with eligibility gating.

Exit criteria:
1. Deterministic payout amounts for top 3.
2. Trigger and claim flow works end-to-end in test environment.

## Phase 7 - Polish, Accessibility, and Performance

Deliverables:
1. Typography/color/motion parity with design bible.
2. WCAG AA contrast, keyboard nav, ARIA labels.
3. Reduced motion mode and mobile adaptations.

Exit criteria:
1. Accessibility checklist passes.
2. Mobile and desktop layouts pass visual QA.

## 8. Data and Integration Contract Freeze

## 8.1 Event Contract (Required)

Required events for app state:
1. `AuctionStart(partId, startTime, endTime)`
2. `BidPlaced(partId, bidder, amount)`
3. `AuctionEnded(partId, winner, finalPrice)`
4. `LaunchCompleted(rocketId, sender, gravScore, epochId)`
5. `PrizeTrigger(winner, epochId, place, amount)`

## 8.2 Storage Contract (Required)

Minimum persisted entities:
1. Wallet profile (address, first seen, referral, streak)
2. Claims (timestamp, streak day, xp delta)
3. Inventory parts (id, section, rarity, attributes, source)
4. Auctions (round, submissions, bids, winner, refunds)
5. Launches (build snapshot, random seed inputs, events, final score)
6. Leaderboard snapshots (epoch, rank, cumulative score)
7. Prize claims (epoch, place, amount, status)

## 8.3 Naming Migration

Schema/API migration rules:
1. `et_*` fields are migrated to `flux_*`.
2. Public API must not emit `ET` labels.
3. Backward compatibility shim allowed only at ingestion boundaries.

## 9. Testing and Verification Plan

## 9.1 Unit Tests

1. Faucet cooldown and claim eligibility.
2. Rarity multipliers and part value computation.
3. Auction min increment and pull refund logic.
4. Grav Score deterministic computation from fixed inputs.
5. Prize split math and epoch finalization.

## 9.2 Integration Tests

1. Gate -> Exchange -> Vault -> Assembler -> Launch -> Jackpot happy path.
2. Failed cases: insufficient balance, ineligible auction submit, cooldown not reached.
3. Event-to-UI reactivity for all required events.

## 9.3 UX and Accessibility Tests

1. Keyboard-only navigation of all critical flows.
2. Screen reader labels for icon-only controls and rarity badges.
3. Reduced motion behavior for launch and box opening.
4. Mobile breakpoint checks for each app.

## 10. Out of Scope for Freeze v1 (Explicit)

The following are intentionally deferred unless explicitly approved:

1. Real L1/L2 cross-chain payout infrastructure for mainnet ETH destination handling.
2. Fully on-chain verifiable randomness replacement (e.g., VRF) beyond deterministic block-based simulation.
3. Production-grade referral anti-abuse and sybil controls.
4. Governance/DAO mechanics (remains no-governance deterministic model).

## 11. Operational Governance

1. Any change to Sections 3, 4, or 5 requires a spec change request.
2. Every merged implementation PR must reference one frozen item and one acceptance criterion.
3. If docs diverge again, this file remains canonical until superseded by `08-*` freeze doc.

## 12. Immediate Next Actions

1. Approve this freeze baseline.
2. Implement Phase 0 and Phase 1 first (no feature work before shared model/config freeze).
3. Open tracked work items per phase with file-level owners.

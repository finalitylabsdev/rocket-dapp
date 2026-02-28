# Feedback Parallel Worktree Plan

## Summary
This document converts the recent meeting feedback into implementation-tracking workstreams with explicit dependencies, public API changes, and updateable checklists.

Use this as the canonical progress tracker during implementation. Each worktree section includes:
- A clear scope boundary
- Files and surfaces owned
- Concrete implementation checklist items
- Validation checklist items
- Merge and dependency notes

## Current Branch Status
- [x] `wt_core_inv_contract` completed the backend inventory contract workstream in this branch.
- [x] `wt_core_inv_contract` completed the immediate Star Vault UI adoption work that depends on the enriched inventory payload.
- [x] `wt_core_inv_contract` also landed the box drop-curve changes because they share the authoritative `open_mystery_box(...)` RPC.
- [x] `wt/nav_refactor` completed the home / navigation / gate / wallet workstream.
- [x] `wt/nebula` completed auction cadence migration and UI surfaces for serial/shiny/totalPower.
- [ ] Rocket Lab server-authority work remains for other branches.

## Implementation Decisions Locked For This Wave
- [x] Backend changes are in scope.
- [ ] Rocket Lab becomes server-authoritative in this wave.
- [x] Part identifiers are global monotonic serials.
- [ ] "Green box" means `Uncommon`.
- [ ] "Blue item" means `Rare`.
- [x] "Duplicate-number part" means repeated-digit serials only.
- [x] `part_value` stays temporarily for compatibility, but `total_power` becomes the canonical player-facing metric immediately.
- [ ] Non-FLUX wallet balances remain scaffolded unless a real holdings source is added in the same wave.

## Cross-Cutting Contract Changes
This section is the shared contract reference for all branches before touching feature code.

### Public API / Schema Checklist
- [x] Add `gate` and `wallet` to the app `Page` union and routing.
- [x] Add `variant_id`, `illustration_key`, `illustration_url`, and `illustration_alt` to the inventory payload returned by Supabase RPCs.
- [x] Add `total_power` to `inventory_parts` and expose it to the client.
- [x] Add `serial_number` to `inventory_parts` as a globally monotonic unique value.
- [x] Add `serial_trait` to `inventory_parts`.
- [x] Add `is_shiny` to `inventory_parts`.
- [x] Add `condition_pct` to `inventory_parts` with default `100`.
- [x] Extend `InventoryPart` in the client with `variantId`, `totalPower`, `serialNumber`, `serialTrait`, `isShiny`, and `conditionPct`.
- [x] Keep `partValue` in payloads for one compatibility release only.
- [x] Extend `RarityTierConfig` with `attrFloor`, `attrCap`, `attrBias`, and `dropCurveExponent`.
- [ ] Add authenticated RPCs: `equip_inventory_part`, `unequip_inventory_part`, `launch_rocket`, `repair_inventory_part`.
- [ ] Add persistent `rocket_launches` storage.

Note: this branch implemented `serial_trait` as named display-grade labels (`Twin Pulse`, `Mirror Drift`, etc.), so the original placeholder enum listed above has been superseded.

### Shared Acceptance Checklist
- [x] Existing inventory rows are backfilled for the new columns.
- [x] Client builds against the enriched inventory contract without fallback hacks.
- [x] No new UI depends on `partValue` as the primary user-facing metric.

## Worktree Plan

### 1. `wt-backend-inventory-contract`
**Purpose:** establish the canonical inventory and rarity contract required by the rest of the work.

**Owns**
- `supabase/migrations/*` (new migration(s))
- `src/lib/starVault.ts`
- `src/types/domain.ts`
- Any shared hooks that hydrate rarity / box config

**Implementation Checklist**
- [x] Add a global sequence for inventory serial numbers.
- [x] Add `serial_number`, `serial_trait`, `is_shiny`, `total_power`, and `condition_pct` columns to `inventory_parts`.
- [x] Add rarity tuning columns to `rarity_tiers`: `attr_floor`, `attr_cap`, `attr_bias`, `drop_curve_exponent`.
- [x] Seed rarity tuning values for all 8 tiers.
- [x] Extend `part_variants` with illustration metadata if missing.
- [x] Update `open_mystery_box()` to:
- [x] Generate upward-biased attributes within rarity-specific floor/cap.
- [x] Compute `total_power = attr1 + attr2 + attr3`.
- [x] Assign the next global serial number.
- [x] Derive `serial_trait`.
- [x] Set `is_shiny` for repeated-digit serials only.
- [x] Return the enriched payload fields.
- [x] Update `get_user_inventory()` to return the enriched payload fields.
- [x] Backfill all existing rows in deterministic order.
- [x] Update client normalizers and types to consume the new contract.
- [x] Mark `partValue` as deprecated in code comments / type naming where appropriate.

**Validation Checklist**
- [x] New rows receive unique monotonic serial numbers.
- [x] Existing rows are backfilled without nulls in required new columns.
- [x] `totalPower` in the client matches the backend-returned total.
- [x] Inventory responses include variant and illustration metadata.

**Dependency Notes**
- This branch lands first.
- All other backend-dependent branches rebase on this.

### 2. `wt-star-vault-ui-polish`
**Purpose:** implement the visual and compact inventory changes that are primarily UI-facing.

**Owns**
- `src/components/mystery/BoxCard.tsx`
- `src/components/mystery/InventoryPartCard.tsx`
- `src/components/mystery/InventoryPanel.tsx`
- `src/components/mystery/metadataVisuals.tsx`
- Shared mystery UI helpers as needed

**Implementation Checklist**
- [x] Make reveal-state box title and accent use the pulled item rarity, not only the box tier rarity.
- [x] Convert item art rendering to a real image path with explicit error fallback.
- [x] Fall back to the section visual recipe when the art URL is missing or broken.
- [x] Remove duplicate category pills when `illustration.key` matches the slot key.
- [x] Replace visible `Part Value` labels with `Total Power`.
- [x] Change compact inventory sorting default from value-centric to power-centric.
- [x] Show `Ready`, `Locked`, and `Equipped` as distinct user-facing statuses.
- [x] Hide `Source` in the small right-hand inventory card.
- [x] Keep `Source` only in expanded intel or detail views.
- [x] Display `Total Power` in the card summary area.
- [x] Replace text-only attribute labels in the compact card with fixed attribute icons.
- [x] Make `Open Another` visually enabled as the primary action when the next open is possible.
- [ ] Show a clearly disabled `Open Another` state only when wallet or FLUX conditions block another open.

**Validation Checklist**
- [x] Reveal chrome visibly follows the pulled rarity.
- [x] Broken item art no longer produces a blank tile.
- [x] No duplicate pill renders for section-fallback items.
- [x] Compact inventory cards no longer show `Source`.
- [x] `Total Power` appears anywhere the user previously saw `Part Value`.

**Dependency Notes**
- Rebase onto `wt-backend-inventory-contract` before merge.

### 3. `wt-home-nav-gate-wallet`
**Purpose:** separate Gate from home, simplify the home header, and add a wallet page with trackable checklist coverage.

**Owns**
- `src/App.tsx`
- `src/components/Hero.tsx`
- `src/components/ShellNav.tsx`
- `src/components/EntropyGateBanner.tsx`
- `src/components/QuickActions.tsx`
- `src/components/Footer.tsx`
- `src/pages/GatePage.tsx` (new)
- `src/pages/WalletPage.tsx` (new)

**Implementation Checklist**
- [x] Add `gate` and `wallet` routes to the hash-based router.
- [x] Extract the existing Gate interaction surface out of `Hero` into a dedicated page.
- [x] Reduce the home hero title scale.
- [x] Remove the embedded Gate card from home.
- [x] Keep home as a lighter overview and launch page.
- [x] Update `EntropyGateBanner` navigation to point to `#gate` instead of `#home`.
- [x] Remove `DOCS` from the home header.
- [x] Remove `JACKPOT` from the home header.
- [x] Preserve leaderboard access elsewhere in the app.
- [x] Turn the desktop FLUX pill into a labeled wallet navigation control.
- [x] Turn the mobile FLUX pill into the same wallet navigation control.
- [x] Add `WalletPage` listing `Flux`, `wETH`, `wBTC`, and `UVD`.
- [x] Show live `Flux` from `GameState.fluxBalance`.
- [x] Show non-FLUX currencies as scaffold rows with explicit placeholder status if no live balance source is added.
- [x] Update footer and quick-actions links so `Entropy Gate` navigates to the new route.

**Validation Checklist**
- [x] Home no longer contains the full Gate claim/lock card.
- [x] Gate actions from other pages open the dedicated Gate page.
- [x] Header no longer shows `DOCS` or `JACKPOT`.
- [x] Clicking the balance control opens the wallet page.
- [x] Wallet page always lists all four currencies.

**Resolved In This Worktree**
- Dedicated `#gate` and `#wallet` routes are live, with the former home-embedded lock / claim flow moved into a standalone Gate page.
- Home now acts as a lighter funnel surface, while leaderboard access remains available through normal navigation and footer links.
- The wallet route includes live `FLUX` from `GameState.fluxBalance`, with `wETH`, `wBTC`, and `UVD` left as explicit scaffold rows rather than fake balances.
- A follow-up build pass also split `web3Onboard.ts` into its own chunk cleanly; one entry chunk remains slightly above Vite's default warning threshold.

**Dependency Notes**
- This branch is independent of the backend contract branch.

### 4. `wt-drop-curve-and-hourly-auction`
**Purpose:** change rarity distribution behavior and shift Nebula auction cadence and selection logic.

**Owns**
- `supabase/migrations/*` (new migration(s))
- Auction lifecycle SQL and related Supabase runtime
- `src/config/spec.ts`
- Auction UI surfaces that display cadence and selected-part details

**Implementation Checklist**
- [x] Replace the current flat box rarity roll with an exponential curve using `drop_curve_exponent`.
- [x] Add bounded per-open randomization to the effective weight calculation.
- [x] Enforce an `Uncommon -> Rare` floor of at least `12%`.
- [x] Reduce overall higher-rarity outcomes versus the current distribution.
- [x] Update auction round duration from `4h` to `1h`.
- [x] Update submission window from `30m` to `15m`.
- [x] Update remaining bid phase timing accordingly.
- [x] Update any frontend countdown assumptions to match the new timing.
- [x] Change selected-part ranking from `rarity DESC, part_value DESC` to `total_power DESC, rarity DESC, created_at ASC`.
- [x] Surface serial number and shiny state anywhere the selected or historical part is shown.

**Validation Checklist**
- [ ] Statistical simulation confirms `Rare` from `Uncommon` is at or above `12%`.
- [ ] Hourly rounds start and transition with the new timing.
- [x] The selected part is now chosen by `total_power`.
- [x] Auction UI labels and timers reflect the new cadence.

**Dependency Notes**
- Rebase onto `wt-backend-inventory-contract` before merge.

### 5. `wt-rocket-lab-server-authority`
**Purpose:** move Rocket Lab from local simulation to real persisted gameplay.

**Owns**
- `supabase/migrations/*` (new migration(s))
- New or existing Rocket Lab data/RPC layer
- Shared state wiring for launch and repair responses

**Implementation Checklist**
- [ ] Add authoritative equip and unequip RPCs.
- [ ] Use `is_equipped` and `equipped_section_id` as the canonical loadout state.
- [ ] Validate that only one part occupies each section at a time.
- [ ] Block equipping auction-locked or fully broken parts.
- [ ] Add `launch_rocket()` RPC.
- [ ] Require exactly 8 equipped parts, one per canonical section.
- [ ] Debit FLUX for fuel during launch via the existing ledger-backed flow.
- [ ] Compute and persist `base_score`, `luck_score`, `randomness_score`, and `total_score` server-side.
- [ ] Implement serial-based luck rules.
- [ ] Implement meteorite damage chance and persisted part damage.
- [ ] Add `rocket_launches` persistence.
- [ ] Add `repair_inventory_part()` RPC.
- [ ] Charge FLUX based on missing condition percentage.
- [ ] Restore repaired parts to `100` condition.

**Validation Checklist**
- [ ] Launch is rejected when fewer than 8 valid equipped parts exist.
- [ ] FLUX is debited on successful launch.
- [ ] Launch rows persist and are queryable.
- [ ] Damage persists after refresh.
- [ ] Repairs debit FLUX and restore condition.
- [ ] Score breakdown is returned from the backend in a stable response shape.

**Dependency Notes**
- Rebase onto `wt-backend-inventory-contract` before merge.

### 6. `wt-rocket-lab-ui-authority`
**Purpose:** replace the compatibility UI with an authoritative loadout and launch client.

**Owns**
- `src/pages/RocketLabPage.tsx`
- `src/components/lab/*`
- Any new Rocket Lab hooks and client adapters
- `src/context/GameState.tsx` integration points

**Implementation Checklist**
- [ ] Remove `compatibility` and `local-only` copy from Rocket Lab.
- [ ] Stop auto-selecting the best unlocked part per section.
- [ ] Render explicitly equipped state from the authoritative backend.
- [ ] Add explicit equip and unequip actions per eligible part.
- [ ] Show `serialNumber`, `serialTrait`, `isShiny`, and `conditionPct` in the UI.
- [ ] Show repair actions for damaged parts.
- [ ] Replace local simulation launch with backend `launch_rocket()` calls.
- [ ] Display backend-returned `Base`, `Luck`, `Randomness`, and `Total` scores.
- [ ] Display current fuel cost and damage risk in the launch surface.
- [ ] Use `variantId` to map each part to a stable, deterministic visual gimmick.
- [ ] Make rarity affect sheen, glow, and accent only, not client-side stats.
- [ ] Render the inverted and shiny treatment for repeated-digit serial parts only.
- [ ] Update history UI to reflect persisted launches rather than local storage-only simulations.
- [ ] Remove or migrate existing local-storage compatibility history.

**Validation Checklist**
- [ ] Rocket Lab no longer launches locally.
- [ ] Equipped-state UI matches backend state after refresh.
- [ ] Launch result shown in UI exactly matches backend response values.
- [ ] Damaged parts visually reflect their condition state.
- [ ] Each variant has a stable distinct visual treatment.

**Dependency Notes**
- Rebase onto both `wt-backend-inventory-contract` and `wt-rocket-lab-server-authority` before merge.
- Merge last.

## Merge Order Checklist
- [ ] Merge `wt-backend-inventory-contract`.
- [ ] Merge `wt-home-nav-gate-wallet`.
- [ ] Rebase `wt-star-vault-ui-polish`.
- [ ] Rebase `wt-drop-curve-and-hourly-auction`.
- [ ] Merge `wt-star-vault-ui-polish`.
- [ ] Merge `wt-drop-curve-and-hourly-auction`.
- [ ] Merge `wt-rocket-lab-server-authority`.
- [ ] Merge `wt-rocket-lab-ui-authority`.

## Test And Acceptance Matrix

### Tooling Checklist
- [ ] Add a frontend test runner (`Vitest` + React Testing Library) because the repo currently has no test framework configured.
- [ ] Add stable scripts for running frontend tests in CI and local development.
- [ ] Add SQL and RPC smoke-check instructions for local Supabase validation.

### Feature Verification Checklist
- [x] Box reveal recolors to the pulled rarity.
- [x] Broken item art falls back safely.
- [x] Duplicate badge is removed.
- [x] `Total Power` is the primary user-visible metric.
- [x] Home and Gate are separated.
- [x] Wallet page route works.
- [x] Hourly auction cadence works.
- [x] Auction selection uses `total_power`.
- [ ] Eight equipped parts are required for launch.
- [ ] Launch burns FLUX.
- [ ] Meteorite damage persists.
- [ ] Repair restores part condition.
- [ ] Rocket Lab UI reflects server-authoritative results.

### Manual End-To-End Checklist
- [ ] Connect wallet.
- [ ] Open Star Vault box.
- [ ] Verify serial number and shiny state on the received part.
- [ ] Confirm compact inventory shows `Total Power` and status.
- [ ] Submit a valid part to auction.
- [ ] Confirm hourly round selects the strongest valid submission.
- [ ] Equip 8 valid parts in Rocket Lab.
- [ ] Launch successfully and verify FLUX spend.
- [ ] Observe damage on any impacted parts.
- [ ] Repair a damaged part.
- [ ] Re-launch with the repaired loadout.

## Progress Rollup

### `wt_nebula` Branch Update (2026-02-28)
- [x] Added and applied a live inventory metadata sync migration for `serial_number`, `serial_trait`, `is_shiny`, `total_power`, and `condition_pct`.
- [x] Updated `open_mystery_box()` and `get_user_inventory()` to match the live inventory metadata contract used in this worktree.
- [x] Added and applied the hourly Nebula auction migration plus a safe reconciliation for untouched legacy-format active rounds.
- [x] Updated auction UI surfaces to show `Total Power`, serial number, and shiny / inverted state for active and historical items.
- [x] Drop-curve rarity-roll changes landed via `wt_core_inv_contract`.
- [ ] Full client adoption of `variantId`, `serialTrait`, and `conditionPct` remains outstanding.

### Overall Progress
- [x] Backend contract complete
- [x] Star Vault UI polish complete
- [x] Home / navigation / wallet complete
- [ ] Drop curve and hourly auction complete
- [ ] Rocket Lab backend authority complete
- [ ] Rocket Lab UI authority complete
- [ ] Cross-feature QA complete
- [ ] Ready to merge all workstreams

## Assumptions And Deferred Items
- `wETH`, `wBTC`, and `UVD` can remain non-authoritative placeholders in the wallet page unless a live balance source is added during implementation.
- `partValue` remains in storage and RPCs for one compatibility release only.
- If leaderboard logic depends on Rocket Lab scores later, that is a separate follow-up unless explicitly added to this wave.
- If full on-chain authority is required after this wave, that is a separate phase beyond the server-authoritative Supabase transition.

## Success Criteria
The plan is complete when:
- Each worktree has an owned checklist in the doc.
- The doc can be used as a living progress tracker during implementation.
- All cross-cutting contract changes are explicitly listed once.
- No implementer needs to guess route names, metric semantics, or authority boundaries.

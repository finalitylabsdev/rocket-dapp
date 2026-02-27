# Entropy Network — MVP Reduction Plan

> **Goal**: Strip the ɸ-net frontend from a visually polished but functionally hollow demo into a working MVP where the core game loop operates end-to-end.

---

## 1. Current State Audit

### Codebase Summary

| Metric | Value |
|--------|-------|
| Total source lines (`src/`) | 8,815 |
| Source files | 37 (28 `.tsx`/`.ts` + config + CSS) |
| Pages | 6 |
| Components | 26 |
| Backend integrations | 1 (Supabase — leaderboard only) |
| Working API calls | 1 (`leaderboard` table fetch) |
| State persistence | None (all state resets on navigation) |
| Wallet connection | Fake (button does nothing) |
| Routing | Manual `useState<Page>` in `App.tsx`, no URL sync |

### File Inventory (by line count)

| File | Lines | Status |
|------|------:|--------|
| `components/lab/LaunchSequence.tsx` | 901 | Over-engineered, replace |
| `components/lab/PartIllustrations.tsx` | 763 | Over-engineered, replace |
| `components/lab/RocketPreview.tsx` | 627 | Over-engineered, replace |
| `pages/AssemblerPage.tsx` | 619 | Cut entirely |
| `components/mystery/BoxSection.tsx` | 518 | Simplify (8 tiers → 4) |
| `components/assets/RocketPartAssets.tsx` | 421 | Cut entirely |
| `components/assets/MysteryBoxAssets.tsx` | 420 | Cut entirely |
| `pages/LeaderboardPage.tsx` | 367 | Keep as-is (only real API call) |
| `components/assets/FeatureModuleAssets.tsx` | 361 | Cut entirely |
| `components/mystery/AuctionSection.tsx` | 325 | Cut entirely |
| `components/lab/PartsGrid.tsx` | 301 | Simplify (10 parts → 5) |
| `pages/RocketLabPage.tsx` | 300 | Simplify (1 model, wire state) |
| `components/dex/SwapTab.tsx` | 241 | Keep as-is |
| `components/lab/StatsPanel.tsx` | 233 | Simplify (remove model selector refs) |
| `index.css` | 194 | Clean up unused keyframes |
| `components/dex/LiquidityTab.tsx` | 193 | Keep as-is |
| `components/QuickActions.tsx` | 187 | Simplify (remove assembler card) |
| `components/SystemStatus.tsx` | 171 | Cut entirely |
| `components/brand/StarField.tsx` | 154 | Keep (background ambiance) |
| `components/brand/RarityBadge.tsx` | 152 | Simplify (8 tiers → 4) |
| `components/HowItWorks.tsx` | 145 | Cut entirely |
| `pages/DexPage.tsx` | 139 | Keep as-is |
| `components/dex/MarketStats.tsx` | 131 | Keep as-is |
| `components/Hero.tsx` | 119 | Simplify (add Entropy Gate inline) |
| `components/RocketIllustration.tsx` | 118 | Cut entirely |
| `components/brand/SectionIcon.tsx` | 118 | Cut entirely |
| `components/Navbar.tsx` | 96 | Simplify (add wallet button) |
| `pages/MysteryPage.tsx` | 91 | Simplify (remove AuctionSection) |
| `components/Footer.tsx` | 76 | Keep as-is |
| `hooks/useCountUp.ts` | 75 | Keep (used by QuickActions) |
| `components/brand/PhiSymbol.tsx` | 69 | Keep (used across app) |
| `components/mystery/FloatingParticles.tsx` | 60 | Cut entirely |
| `App.tsx` | 55 | Modify (remove assembler, add hash routing) |
| `components/lab/RocketModels.ts` | 46 | Simplify (3 models → 1) |
| `lib/supabase.ts` | 18 | Keep as-is |
| `main.tsx` | 10 | Keep as-is |
| `vite-env.d.ts` | 1 | Keep as-is |

### What Actually Works

- **Leaderboard fetch**: Queries Supabase `leaderboard` table, renders real data with loading states and refresh.
- **Box opening animation**: Visual shake/crack/reveal sequence works, but rewards are random and not persisted.
- **Part equip/unequip**: Toggle works within a session, but state resets on navigation.
- **Launch sequence**: Fires and computes a score, but the score goes nowhere.
- **Rarity badge system**: Fully rendered across 8 tiers with correct colors and glows.

### What Doesn't Work

- **Wallet connection**: Every "Connect Wallet" button is a no-op `<button>` with no handler.
- **Flux balance**: No concept of a balance. Box purchases are free. Upgrades are free. Nothing costs anything.
- **Inventory**: Box rewards vanish after the reveal animation. Parts in the Rocket Lab are hardcoded, not earned.
- **Score persistence**: Launch scores are computed then discarded. No connection to leaderboard.
- **Page state**: Navigating away from any page resets all state. No shared context.
- **URL routing**: No hash or path routing. Browser back button navigates away from the app entirely.
- **DEX**: UI renders but all swap/liquidity actions are mock. This is acceptable for MVP.

---

## 2. Core Loop Definition

The MVP must support this end-to-end loop:

```
Lock ETH → Get Flux → Open Boxes → Get Parts → Build Rocket → Launch → Win ETH
    │           │           │            │            │           │         │
    ▼           ▼           ▼            ▼            ▼           ▼         ▼
 Entropy    100 Flux    Deduct Flux   Add to      Equip from   Compute   Display on
  Gate      granted     from balance  inventory   inventory    Grav Score leaderboard
```

**Each step must actually modify shared state that persists across page navigation.**

### Minimum Viable Actions

1. **Lock ETH** — Click button, receive 100 Flux (one-time, stored in localStorage)
2. **Claim Daily Flux** — Click button, receive 10 Flux (24h cooldown, stored in localStorage)
3. **Open Box** — Deduct Flux from balance, receive a random part added to inventory
4. **Equip Part** — Parts grid reads from inventory, equip/unequip persists
5. **Launch Rocket** — Requires 3+ equipped parts, computes Grav Score, writes to game state
6. **View Score** — Score visible on leaderboard page (localStorage for now, Supabase later)

---

## 3. What to Cut

### Pages to Delete

| Page | File | Lines | Reason |
|------|------|------:|--------|
| Asset Gallery | `pages/AssemblerPage.tsx` | 619 | Display-only gallery with no game function. All 3 asset component dependencies are also deleted. |

### Components to Delete

| Component | Lines | Reason |
|-----------|------:|--------|
| `components/assets/RocketPartAssets.tsx` | 421 | Inline SVG assets only used by AssemblerPage |
| `components/assets/MysteryBoxAssets.tsx` | 420 | Inline SVG assets only used by AssemblerPage |
| `components/assets/FeatureModuleAssets.tsx` | 361 | Inline SVG assets only used by AssemblerPage |
| `components/mystery/AuctionSection.tsx` | 325 | Requires real-time bidding infrastructure (WebSocket, countdown timers, bid validation). Not part of core loop. |
| `components/mystery/FloatingParticles.tsx` | 60 | Pure decoration. Used by MysteryPage, LeaderboardPage, and RocketLabPage — remove all imports. |
| `components/lab/LaunchSequence.tsx` | 901 | 901-line SVG animation. Replace with ~80-line simple overlay. |
| `components/lab/RocketPreview.tsx` | 627 | 627-line multi-model 3-section preview. Replace with ~100-line single-model display. |
| `components/lab/PartIllustrations.tsx` | 763 | 763 lines of hand-drawn SVG part illustrations. Replace with Lucide icons. |
| `components/brand/SectionIcon.tsx` | 118 | Custom SVG icons for 8 rocket sections. Replace with text labels (only used in PartsGrid power display). |
| `components/HowItWorks.tsx` | 145 | Marketing/explainer section on home page. Not functional. |
| `components/SystemStatus.tsx` | 171 | All metrics are hardcoded fakes (TPS, block height, active stakers). |
| `components/RocketIllustration.tsx` | 118 | Hero section decoration. Hero will be repurposed for Entropy Gate. |

### Total Lines Cut: ~5,049

---

## 4. What to Simplify

### 4.1 Rarity Tiers: 8 → 4

**Current** (`RarityBadge.tsx`): Common, Uncommon, Rare, Epic, Legendary, Mythic, Celestial, Quantum

**MVP**: Common, Rare, Epic, Legendary

Affects:
- `components/brand/RarityBadge.tsx` — Remove 4 tier configs, 4 GemIcon branches (~50 lines saved)
- `components/mystery/BoxSection.tsx` — Remove 4 box tiers from `TIERS` array, simplify filter tabs (~80 lines saved)
- `tailwind.config.js` — Remove `uncommon`, `mythic`, `celestial`, `quantum` color definitions
- `index.css` — Remove `.rarity-badge` variants for deleted tiers, remove `prismaticShift`, `auroraFlow`, `emberRise` keyframes

### 4.2 Rocket Parts: 10 → 5

**Current** (`PartsGrid.tsx`): engine, fuel, body, wings, booster, noseCone, heatShield, gyroscope, solarPanels, landingStruts

**MVP**: engine, fuel, body, wings, booster

Affects:
- `components/lab/PartsGrid.tsx` — Remove 5 part definitions from `PARTS` array, update `EquippedParts` interface (~80 lines saved)
- `pages/RocketLabPage.tsx` — Reduce initial equipped/levels state objects
- `components/lab/StatsPanel.tsx` — Simplify stat formulas (fewer parts to check)

### 4.3 Rocket Models: 3 → 1

**Current** (`RocketModels.ts`): Standard, Heavy Lifter, Scout

**MVP**: Standard only

Affects:
- `components/lab/RocketModels.ts` — Remove 2 model definitions (~20 lines saved)
- `pages/RocketLabPage.tsx` — Remove model selector UI (~30 lines saved), hardcode `'standard'`

### 4.4 Upgrade Levels: 5 → 3

**Current**: maxLevel 5 per part

**MVP**: maxLevel 3 per part

Affects:
- `components/lab/PartsGrid.tsx` — Change `maxLevel: 5` → `maxLevel: 3` in PARTS definitions
- `components/lab/StatsPanel.tsx` — Adjust level divisor in `computeStats`
- `pages/RocketLabPage.tsx` — Change `Math.min(5, ...)` → `Math.min(3, ...)`

### 4.5 Mystery Box Tiers: 8 → 4

**Current** (`BoxSection.tsx`): Void Crate (10φ), Nebula Crate (25φ), Star Vault Box (75φ), Astral Chest (200φ), Solaris Vault (400φ), Ember Forge (750φ), Aurora Vault (1200φ), Quantum Chest (2500φ)

**MVP**: Void Crate (10φ, Common drops), Star Vault Box (50φ, Rare drops), Astral Chest (150φ, Epic drops), Solaris Vault (300φ, Legendary drops)

Affects:
- `components/mystery/BoxSection.tsx` — Rewrite `TIERS` to 4 entries, simplify filter to just "All" and "Premium", remove Celestial/Quantum-specific box rendering effects (~200 lines saved)

### 4.6 Box Opening Animation

**Current**: Complex multi-stage SVG animation — shake (700ms), crack with split halves and spark particles (500ms), reveal with rarity-specific effects (aurora bands, prismatic shifting, ember particles).

**MVP**: Simple colored box with scale-up reveal. No SVG shake/crack/split. No particle effects.

Affects:
- `components/mystery/BoxSection.tsx` — Replace `BoxIllustration` component (~180 lines) with ~30-line colored-div version. Remove `BoxState` type complexity, simplify to 'idle' | 'opening' | 'revealed'.

### Estimated Lines Saved from Simplifications: ~640

---

## 5. What to Add

### 5.1 GameState Context (~80 lines)

**File**: `src/context/GameState.tsx`

Provides shared state across all pages via React Context + localStorage persistence:

```
GameStateProvider
├── fluxBalance: number
├── inventory: Part[]           // parts earned from boxes
├── equipped: Record<PartSlot, Part | null>
├── levels: Record<PartSlot, number>
├── scores: number[]            // launch history
├── walletAddress: string | null
├── lockedEth: boolean
├── lastDailyClaim: number | null  // timestamp
├── actions:
│   ├── lockEth()               // sets lockedEth, adds 100 flux
│   ├── claimDailyFlux()        // adds 10 flux if 24h elapsed
│   ├── spendFlux(amount)       // deducts flux, returns boolean
│   ├── addPart(part)           // adds to inventory
│   ├── equipPart(slot, part)   // equips from inventory
│   ├── unequipPart(slot)       // returns to inventory
│   ├── upgradePart(slot)       // increments level, deducts flux
│   └── recordScore(score)      // appends to scores
└── persistence: localStorage read/write on every mutation
```

### 5.2 Wallet Stub Hook (~40 lines)

**File**: `src/hooks/useWallet.ts`

Mock wallet connection for testnet UX:

```typescript
// Provides:
// - address: string | null
// - isConnected: boolean
// - connect(): void    // generates random 0x... address, stores in localStorage
// - disconnect(): void // clears address
```

Integrates with Navbar "Connect Wallet" button. All pages show truncated address when connected.

### 5.3 Entropy Gate Section (~50 lines)

**Inline in**: `components/Hero.tsx` (replaces RocketIllustration card)

Two buttons on the home page hero:
1. **Lock ETH** — One-time action. Grants 100 Flux. Disabled after use. Shows "Locked" state.
2. **Claim Daily Flux** — Grants 10 Flux. 24h cooldown. Shows countdown timer when on cooldown.

Both read/write from GameState context. Flux balance displayed prominently.

### 5.4 Hash-Based Routing (~15 lines)

**Modified in**: `src/App.tsx`

```typescript
// On mount: read window.location.hash → set page
// On setPage: update window.location.hash
// Listen to 'hashchange' event for browser back/forward
// Maps: #dex, #mystery, #lab, #leaderboard → page state
// Default (no hash or #home) → home page
```

### 5.5 Loop Wiring (~100 lines of modifications across existing files)

Modifications to wire GameState through the existing component tree:

| File | Change |
|------|--------|
| `App.tsx` | Wrap app in `<GameStateProvider>`. Remove AssemblerPage import/route. |
| `components/mystery/BoxSection.tsx` | `handleOpen` → call `gameState.spendFlux(tier.price)`, on success call `gameState.addPart(randomPart)`. Show "Insufficient Flux" if balance too low. |
| `components/lab/PartsGrid.tsx` | Read `gameState.inventory` instead of hardcoded `PARTS` array. `onToggle` → calls `gameState.equipPart`/`unequipPart`. |
| `pages/RocketLabPage.tsx` | `handleLaunchComplete` → calls `gameState.recordScore(score)`. Remove hardcoded equipped state. Read from context. |
| `components/Navbar.tsx` | Show wallet address (truncated) when connected. "Connect Wallet" → calls `wallet.connect()`. |
| `pages/MysteryPage.tsx` | Display flux balance in header. Remove AuctionSection + FloatingParticles imports. |

### 5.6 Simplified LaunchSequence Replacement (~80 lines)

**File**: `components/lab/LaunchSequence.tsx` (complete rewrite)

Replaces the 901-line SVG animation extravaganza with:
- Full-screen dark overlay with fade-in
- 3-2-1 countdown text (large, centered)
- "LAUNCHING..." pulse text
- Result card: Grav Score (big number), event bonus text, multiplier
- "Close" button to dismiss

No SVG. No canvas. No particle systems. Just text and CSS transitions.

### 5.7 Simplified RocketPreview Replacement (~100 lines)

**File**: `components/lab/RocketPreview.tsx` (complete rewrite)

Replaces the 627-line multi-model rocket builder with:
- Single rocket silhouette (CSS shapes or a single simple SVG, ~40 lines)
- 5 highlighted zones corresponding to the 5 part slots
- Each zone: colored when part is equipped (uses rarity color), gray when empty
- Subtle glow effect on equipped parts
- No model switching, no animation states, no launch animation integration

### Total Lines Added: ~465

---

## 6. Phased Implementation Roadmap

### Phase 1 — Foundation (~2 hours)

**Goal**: Establish shared state, wallet stub, and URL routing. Delete everything marked for removal.

1. **Create `src/context/GameState.tsx`** (~80 lines)
   - React context with provider
   - localStorage persistence (read on mount, write on every action)
   - All action methods

2. **Create `src/hooks/useWallet.ts`** (~40 lines)
   - Mock connect/disconnect
   - Random address generation
   - localStorage persistence

3. **Modify `src/App.tsx`**
   - Wrap in `<GameStateProvider>`
   - Remove `AssemblerPage` import and route
   - Remove `'assembler'` from `Page` type
   - Add hash-based routing (read hash on mount, sync on navigate, listen to `hashchange`)
   - Remove `SystemStatus` and `HowItWorks` imports/usage from home layout

4. **Delete files**:
   - `src/pages/AssemblerPage.tsx`
   - `src/components/assets/RocketPartAssets.tsx`
   - `src/components/assets/MysteryBoxAssets.tsx`
   - `src/components/assets/FeatureModuleAssets.tsx`
   - `src/components/mystery/AuctionSection.tsx`
   - `src/components/mystery/FloatingParticles.tsx`
   - `src/components/HowItWorks.tsx`
   - `src/components/SystemStatus.tsx`
   - `src/components/RocketIllustration.tsx`
   - `src/components/brand/SectionIcon.tsx`

5. **Fix broken imports**
   - `MysteryPage.tsx` — remove `FloatingParticles` and `AuctionSection` imports
   - `LeaderboardPage.tsx` — remove `FloatingParticles` import
   - `RocketLabPage.tsx` — remove `FloatingParticles` import
   - `Hero.tsx` — remove `RocketIllustration` import
   - `PartsGrid.tsx` — remove `SectionIcon` import, replace `SECTION_META[part.section].label` with plain text
   - `QuickActions.tsx` — remove assembler card from `cards` array, remove `onOpenAssembler` prop

6. **Verify**: App compiles and renders. No runtime errors. All 5 pages accessible.

### Phase 2 — Simplify Complexity (~1.5 hours)

**Goal**: Reduce all config dimensions to MVP scope.

1. **Rarity tiers 8 → 4** in `RarityBadge.tsx`
   - Keep: Common, Rare, Epic, Legendary
   - Remove: Uncommon, Mythic, Celestial, Quantum from `RARITY_CONFIG` and `RarityTier` type
   - Remove corresponding `GemIcon` SVG branches
   - Remove `RarityGlow` wrapper (only used for high-intensity tiers)

2. **Parts 10 → 5** in `PartsGrid.tsx`
   - Keep: engine, fuel, body, wings, booster
   - Remove: noseCone, heatShield, gyroscope, solarPanels, landingStruts from `EquippedParts` interface and `PARTS` array
   - Update `RocketLabPage.tsx` initial state to match

3. **Models 3 → 1** in `RocketModels.ts`
   - Keep only Standard model
   - Remove model selector UI from `RocketLabPage.tsx`
   - Hardcode `selectedModel = 'standard'`

4. **Levels 5 → 3**
   - Update `maxLevel` in remaining PARTS definitions
   - Update `Math.min(5, ...)` → `Math.min(3, ...)` in `RocketLabPage.tsx`

5. **Box tiers 8 → 4** in `BoxSection.tsx`
   - Rewrite `TIERS` array to 4 entries (Common 10φ, Rare 50φ, Epic 150φ, Legendary 300φ)
   - Simplify filter tabs to "All" / "Premium"
   - Remove Celestial aurora effects, Quantum prismatic effects, Mythic ember effects from `BoxIllustration`

6. **Verify**: App compiles. Box section shows 4 tiers. Parts grid shows 5 parts. No model selector.

### Phase 3 — Replace Over-Engineered Components (~2 hours)

**Goal**: Swap the three heaviest components with minimal replacements.

1. **Replace `LaunchSequence.tsx`** (901 → ~80 lines)
   - Full-screen overlay, countdown, result display
   - Accepts same props interface for compatibility
   - No SVG, no particle effects

2. **Replace `RocketPreview.tsx`** (627 → ~100 lines)
   - Single rocket shape with 5 slot indicators
   - Color each slot based on equipped state + rarity
   - No model switching, no launch animation

3. **Replace `PartIllustrations.tsx`** (763 → ~30 lines)
   - Map each `PartId` to a Lucide icon (e.g., engine → `Zap`, fuel → `Fuel`, body → `Shield`, wings → `Wind`, booster → `Rocket`)
   - Wrap in colored container matching rarity
   - Or: delete entirely and inline icons directly in `PartsGrid.tsx`'s `PartCard`

4. **Verify**: Launch sequence fires and shows score. Rocket preview renders with part highlights. Parts show icons.

### Phase 4 — Wire the Loop (~2 hours)

**Goal**: Connect every action to GameState so the loop works end-to-end.

1. **Entropy Gate on Home** (modify `Hero.tsx`)
   - Replace the RocketIllustration card area with two action buttons
   - "Lock ETH" — calls `gameState.lockEth()`, disabled after use
   - "Claim Daily Flux" — calls `gameState.claimDailyFlux()`, shows cooldown
   - Display current Flux balance prominently

2. **Wire Navbar** (modify `Navbar.tsx`)
   - "Connect Wallet" → calls `wallet.connect()`
   - When connected: show truncated address + "Disconnect" option
   - Show Flux balance in nav bar

3. **Wire Box Opening** (modify `BoxSection.tsx`)
   - `handleOpen` checks `gameState.spendFlux(tier.price)` first
   - On success: generate random part (name, rarity based on tier drop table), call `gameState.addPart(part)`
   - On failure: show "Insufficient Flux" toast or inline error
   - Show current balance near "Open Box" button

4. **Wire Parts Grid** (modify `PartsGrid.tsx`)
   - Read available parts from `gameState.inventory`
   - Equip action → `gameState.equipPart(slot, part)`
   - Unequip action → `gameState.unequipPart(slot)`
   - Upgrade action → check flux balance, call `gameState.upgradePart(slot)`

5. **Wire Launch** (modify `RocketLabPage.tsx`)
   - `handleLaunchComplete` → `gameState.recordScore(score)`
   - Show best score and launch count from state
   - Disable launch if fewer than 3 parts equipped

6. **Verify**: Complete loop test:
   - Connect wallet → Lock ETH → See 100 Flux
   - Navigate to Star Vault → Open a box → See Flux deducted, part in inventory
   - Navigate to Rocket Lab → See part in grid → Equip it → Launch → See score
   - Navigate to Leaderboard → Confirm score display
   - Refresh browser → Confirm all state persists

### Phase 5 — Polish (~1 hour)

**Goal**: Clean up orphaned code and verify the full experience.

1. **Clean Tailwind config**
   - Remove unused rarity colors: `uncommon`, `mythic`, `celestial`, `quantum`
   - Remove unused animations: `orbit`, `twinkle`, `phi-spin`, `prismatic-shift`, `rarity-pulse`, `aurora-flow`, `ember-rise`
   - Remove `app-assembler`, `app-bids` accent colors

2. **Clean `index.css`**
   - Remove orphaned keyframes: `prismaticShift`, `emberRise`, `auroraFlow`, `boxShake`, `seam`, `boxCrack`, `boxCrackRight`, `sparkBurst`, `trail`, `phiPulse`
   - Remove `.rarity-badge` variants for deleted tiers
   - Remove `.text-gradient-quantum`

3. **Remove empty `components/assets/` directory**

4. **Full loop test (manual)**
   - Fresh localStorage → Connect → Lock → Claim → Buy boxes → Equip → Launch → Check score
   - Verify browser back/forward navigation works via hash routing
   - Verify mobile responsive layout on 5 remaining pages

5. **Verify build**: `npm run build` completes with no warnings about missing imports or unused exports.

---

## 7. Line Count Projections

### Files Deleted (5,049 lines removed)

| File | Lines |
|------|------:|
| `pages/AssemblerPage.tsx` | 619 |
| `components/assets/RocketPartAssets.tsx` | 421 |
| `components/assets/MysteryBoxAssets.tsx` | 420 |
| `components/assets/FeatureModuleAssets.tsx` | 361 |
| `components/mystery/AuctionSection.tsx` | 325 |
| `components/mystery/FloatingParticles.tsx` | 60 |
| `components/lab/LaunchSequence.tsx` | 901 |
| `components/lab/RocketPreview.tsx` | 627 |
| `components/lab/PartIllustrations.tsx` | 763 |
| `components/brand/SectionIcon.tsx` | 118 |
| `components/HowItWorks.tsx` | 145 |
| `components/SystemStatus.tsx` | 171 |
| `components/RocketIllustration.tsx` | 118 |
| **Total** | **5,049** |

### Lines Saved from Simplifications (~640)

| Area | Lines Saved |
|------|------------:|
| RarityBadge.tsx (8 → 4 tiers) | ~50 |
| BoxSection.tsx (8 → 4 tiers + simpler animation) | ~280 |
| PartsGrid.tsx (10 → 5 parts, remove SectionIcon) | ~80 |
| RocketLabPage.tsx (1 model, fewer parts) | ~60 |
| RocketModels.ts (3 → 1 model) | ~20 |
| StatsPanel.tsx (fewer parts in formulas) | ~20 |
| QuickActions.tsx (remove assembler card) | ~20 |
| Hero.tsx (remove RocketIllustration usage) | ~30 |
| index.css (orphaned keyframes/classes) | ~50 |
| tailwind.config.js (unused colors/animations) | ~30 |
| **Total** | **~640** |

### Lines Added (~465)

| Addition | Lines |
|----------|------:|
| `context/GameState.tsx` | ~80 |
| `hooks/useWallet.ts` | ~40 |
| Entropy Gate in Hero.tsx | ~50 |
| Hash routing in App.tsx | ~15 |
| LaunchSequence replacement | ~80 |
| RocketPreview replacement | ~100 |
| Part icons (inline or small file) | ~30 |
| Loop wiring across 6 files | ~70 |
| **Total** | **~465** |

### Summary

| Metric | Before | After | Change |
|--------|-------:|------:|-------:|
| Total lines | 8,815 | ~3,591 | -59% |
| Files | 37 | ~26 | -30% |
| Pages | 6 | 5 | -1 |
| Working API calls | 1 | 1 (+ localStorage) | — |
| Core loop functional | No | **Yes** | — |
| Rarity tiers | 8 | 4 | -50% |
| Rocket parts | 10 | 5 | -50% |
| Rocket models | 3 | 1 | -67% |
| Upgrade levels | 5 | 3 | -40% |
| Box tiers | 8 | 4 | -50% |

### Final File Tree (MVP)

```
src/
├── App.tsx                          ~65
├── main.tsx                          10
├── vite-env.d.ts                      1
├── index.css                       ~145
├── lib/
│   └── supabase.ts                   18
├── context/
│   └── GameState.tsx                ~80   (NEW)
├── hooks/
│   ├── useCountUp.ts                 75
│   └── useWallet.ts                 ~40   (NEW)
├── pages/
│   ├── DexPage.tsx                  139
│   ├── MysteryPage.tsx              ~70
│   ├── RocketLabPage.tsx           ~210
│   └── LeaderboardPage.tsx          367
├── components/
│   ├── Navbar.tsx                   ~110
│   ├── Hero.tsx                     ~140
│   ├── QuickActions.tsx             ~165
│   ├── Footer.tsx                     76
│   ├── brand/
│   │   ├── StarField.tsx             154
│   │   ├── RarityBadge.tsx          ~100
│   │   └── PhiSymbol.tsx              69
│   ├── mystery/
│   │   └── BoxSection.tsx           ~240
│   ├── lab/
│   │   ├── PartsGrid.tsx            ~220
│   │   ├── StatsPanel.tsx           ~210
│   │   ├── RocketModels.ts          ~26
│   │   ├── RocketPreview.tsx        ~100  (REWRITE)
│   │   └── LaunchSequence.tsx        ~80  (REWRITE)
│   └── dex/
│       ├── SwapTab.tsx               241
│       ├── LiquidityTab.tsx          193
│       └── MarketStats.tsx           131
```

---

## Appendix: Untouched Files

The following files require **zero modifications** in any phase:

| File | Lines | Reason |
|------|------:|--------|
| `pages/DexPage.tsx` | 139 | DEX kept as-is |
| `components/dex/SwapTab.tsx` | 241 | DEX kept as-is |
| `components/dex/LiquidityTab.tsx` | 193 | DEX kept as-is |
| `components/dex/MarketStats.tsx` | 131 | DEX kept as-is |
| `components/brand/StarField.tsx` | 154 | Background ambiance, no dependencies on cut code |
| `components/brand/PhiSymbol.tsx` | 69 | Small utility, used across app |
| `components/Footer.tsx` | 76 | Static footer |
| `hooks/useCountUp.ts` | 75 | Used by QuickActions |
| `lib/supabase.ts` | 18 | Only backend integration |
| `main.tsx` | 10 | Entry point |
| `vite-env.d.ts` | 1 | Type declaration |

# 12 Visual Restyle Handoff

## Purpose

This document captures the current state of the branch-wide visual restyle so work can resume later on the same branch without re-auditing the UI from scratch.

The work completed so far is a visual style transfer toward the provided reference image:

- rounded, glossy application-window surfaces
- softer dark and light theme palettes
- lime and pink accent rails/chips
- pill buttons and controls
- reduced terminal-like feel in favor of a more polished desktop-app presentation

Existing application behavior was intentionally preserved.

## Completed Work

### 1. Global Design System

The shared visual token layer was reworked first so the restyle propagates across the app:

- `src/index.css`
  - added Google font imports for `IBM Plex Sans` and `Space Grotesk`
  - replaced core color tokens for both dark and light themes
  - introduced reusable utility surfaces:
    - `.app-shell-root`
    - `.app-window`
    - `.app-panel`
    - `.app-panel-muted`
    - `.app-control`
    - `.app-chip`
    - `.app-stat`
    - `.app-accent-line`
  - updated shared buttons, tags, toasts, focus states, glow dots, and scrollbar styling
- `tailwind.config.js`
  - updated font aliases to match the new visual system
  - restored rounded radii and meaningful box shadows
  - aligned key accent colors with the new token layer
- `src/context/ThemeContext.tsx`
  - updated browser theme-color meta values to match the new palettes

### 2. Shared Shell / Chrome

The always-visible application shell was restyled so the whole app now shares the same chrome:

- `src/App.tsx`
  - added layered ambient gradient blobs behind the app shell
- `src/components/ShellNav.tsx`
  - restyled as a floating rounded top bar
  - moved nav affordances into chip-like controls
  - updated wallet controls to match the new UI language
- `src/components/Footer.tsx`
  - wrapped footer in the same rounded window treatment
  - updated icon buttons and footer status chrome
- `src/components/brand/StarField.tsx`
  - softened the ambient background effect to better fit the reference style

### 3. Home Page

The home screen now uses the same surface language as the rest of the app:

- `src/components/Hero.tsx`
  - restyled the hero card into a rounded app panel
  - added accent bars and softer metric blocks
  - updated status strips and action controls
- `src/components/QuickActions.tsx`
  - wrapped the dashboard area in a large app window
  - converted cards into rounded elevated panels with accent rails

### 4. Mystery / Star Vault / Nebula Bids

This area is structurally closest to the reference image and received the most direct visual transfer:

- `src/pages/MysteryPage.tsx`
  - wrapped the main page body in a large application window
  - restyled the tab switcher into a soft pill-style control group
- `src/components/mystery/ui.ts`
  - changed page-scoped panel/inset/control tokens to match the new shared look
- Restyled high-visibility mystery components:
  - `src/components/mystery/InventoryPanel.tsx`
  - `src/components/mystery/InventoryPartCard.tsx`
  - `src/components/mystery/BoxCard.tsx`
  - `src/components/mystery/AuctionGrid.tsx`
  - `src/components/mystery/AuctionDetail.tsx`
  - `src/components/mystery/BidsTab.tsx`
  - `src/components/mystery/VaultTab.tsx`

### 5. DEX

The DEX page and controls were restyled so the interactive areas match the new design system:

- `src/pages/DexPage.tsx`
  - updated the main tab panel and summary cards
- `src/components/dex/SwapTab.tsx`
  - converted selectors, cards, settings, and CTA into rounded panel controls
- `src/components/dex/LiquidityTab.tsx`
  - same treatment for pair selection, deposit inputs, and CTA
- `src/components/dex/MarketStats.tsx`
  - moved stat panels into rounded card surfaces
- `src/components/dex/TokenIcon.tsx`
  - replaced flat monochrome token chips with gradient token badges

### 6. Remaining Top-Level Pages

To avoid visual drift, the remaining pages were brought into the same design family:

- `src/pages/RocketLabPage.tsx`
- `src/pages/LeaderboardPage.tsx`

These were not fully redesigned at the component-detail level, but their top-level containers and visible summary surfaces now match the updated shell language.

## Verification Completed

The following checks passed after the restyle:

- `npm run typecheck`
- `npm run build`

No behavioral changes were intentionally introduced.

## Current Modified Files

At the time of writing, the branch includes edits in these files:

- `src/App.tsx`
- `src/components/Footer.tsx`
- `src/components/Hero.tsx`
- `src/components/QuickActions.tsx`
- `src/components/ShellNav.tsx`
- `src/components/brand/StarField.tsx`
- `src/components/dex/LiquidityTab.tsx`
- `src/components/dex/MarketStats.tsx`
- `src/components/dex/SwapTab.tsx`
- `src/components/dex/TokenIcon.tsx`
- `src/components/mystery/AuctionDetail.tsx`
- `src/components/mystery/AuctionGrid.tsx`
- `src/components/mystery/BidsTab.tsx`
- `src/components/mystery/BoxCard.tsx`
- `src/components/mystery/InventoryPanel.tsx`
- `src/components/mystery/InventoryPartCard.tsx`
- `src/components/mystery/VaultTab.tsx`
- `src/components/mystery/ui.ts`
- `src/context/ThemeContext.tsx`
- `src/index.css`
- `src/pages/DexPage.tsx`
- `src/pages/LeaderboardPage.tsx`
- `src/pages/MysteryPage.tsx`
- `src/pages/RocketLabPage.tsx`
- `tailwind.config.js`

## Recommended Next Steps

If resuming this branch later, continue in this order:

1. Run `npm run dev` and do a visual pass on all routes in both themes.
2. Tighten any spacing inconsistencies introduced by the new larger radii and panel padding.
3. Do a second-pass restyle of deep components not yet fully retouched:
   - Rocket Lab internals (`RocketPreview`, `StatsPanel`, `PartsGrid`, `LaunchSequence`)
   - remaining mystery subpanels not yet fully harmonized
   - any leaderboard internals that still look too close to the old theme
4. Check mobile layouts carefully, especially:
   - nav overflow
   - hero CTA row
   - mystery tab controls
   - DEX selector dropdowns
5. If the visual direction is approved, then stage and commit the branch changes normally.

## Resume Notes

The main design decision already made on this branch is:

- prefer adapting the existing UI structure to the reference style
- do not rewrite functionality
- do not replace feature flows
- keep the mystery page as the strongest reference match

If continuing, avoid redoing the token work in `src/index.css` first. Most remaining refinement should now happen in the deeper feature components and visual polish passes.

# Scope

> Version: 0.2.0
> Date: 2026-02-27
> Status: Active
> Primary references: `docs/04-system-overview.md`, `docs/05-app_overview.md`, `docs/06-design_brand.md`, `docs/10-star-vault-nebula-bids-implementation.md`, `docs/roles/01-asset-designer.md`, `docs/roles/02-uiux-interface-designer.md`

## Purpose

Define the current implementation scope for moving Entropy from a strong prototype into a coherent product baseline, with immediate focus on **Star Vault** and **Nebula Bids** while capturing the UI and asset dependencies required to make that work end-to-end.

This document is intentionally concise. `docs/10-star-vault-nebula-bids-implementation.md` remains the detailed execution plan. This file defines what is in scope at the product level.

## Current Baseline

The codebase already has:

- A functional multi-page prototype for Gate, Exchange, Star Vault, Rocket Lab, and Leaderboard.
- Server-backed wallet auth, ETH lock, and FLUX balance/ledger foundations in Supabase.
- A local-only Star Vault prototype with hardcoded box tiers, hardcoded drop logic, and local inventory state.
- A partial visual system with a phi mark, rarity badges, a starfield treatment, and placeholder rocket/box art.

The codebase does not yet have:

- A server-authoritative Star Vault inventory model.
- Any real Nebula Bids backend or frontend.
- A shared global app shell that matches the design brief across all apps.
- The canonical asset set needed for final Star Vault, Nebula Bids, and the 8-section rocket system.
- A clearly enforced cross-app implementation boundary that preserves the four-app journey and shared token/prize flow defined by the frozen specs.

## In Scope

### 1. Server-authoritative Star Vault and Nebula Bids

Deliver the App 3 gameplay loop defined in `docs/10` as the primary engineering priority:

- Replace hardcoded Star Vault catalog, rarity config, and RNG with Supabase tables, RPCs, and wallet-scoped inventory.
- Make FLUX spend + box open atomic so users cannot lose FLUX without receiving a persisted part.
- Build Nebula Bids end-to-end: submissions, auction selection, bidding, escrow/refunds, settlement, and round scheduling.
- Treat Supabase as the temporary source of truth for FLUX, inventory, and auction state until on-chain settlement exists.

### 2. Shared shell and App 3 UX completion

Implement the minimum product shell required for App 3 to feel integrated with the rest of Entropy:

- Introduce one persistent navigation and wallet HUD across the app, instead of page-specific headers.
- Add the proper App 3 split between **Star Vault** and **Nebula Bids**, including inventory and auction-focused UI states.
- Align core global UX primitives with the design brief: app-aware navigation, mobile tab behavior, consistent dialogs, and coherent toast placement/behavior.
- Apply shared styling decisions at the system level where they directly affect App 3 usability and consistency, including the platform-wide living starfield treatment.
- Restore the minimum cross-app journey cues needed for coherence: quick navigation between apps, clear next-step handoffs, and a lightweight onboarding path.

### 3. Asset and visual readiness required by App 3

Create or formalize the asset layer that App 3 depends on:

- Upgrade from placeholder box visuals to a tiered Star Vault box presentation that can support open/reveal states.
- Define a canonical visual treatment for the 8 rarity tiers, including reusable high-rarity motion/effects where needed.
- Establish the canonical 8-section, 64-part visual model so Star Vault rewards, inventory cards, auctions, and Rocket Lab can reference the same part system.
- Add the minimum shared visual assets needed for App 3 quality: app identity cues, auction-ready item presentation, and empty/interstitial states.
- Prepare the visual pipeline for metadata-backed part imagery so placeholder inline art can be replaced by canonical asset references without another model rewrite.

### 4. Compatibility work required by the new data model

Make focused cross-app changes only where they are required to prevent model drift:

- Migrate types and state away from legacy/local inventory assumptions.
- Add adapters or targeted refactors so Rocket Lab can consume the canonical 8-part inventory model without blocking App 3 delivery.
- Remove misleading or placeholder behaviors that conflict with server-authoritative flows.

### 5. System invariants and integration constraints

Preserve the frozen system rules that App 3 depends on, even where today’s implementation is off-chain or provisional:

- Keep the closed-loop journey intact: Gate feeds Exchange, Exchange feeds Star Vault/Nebula, and App 3 outputs must remain usable by Assembler/Lift-Off/Jackpot.
- Treat App 3 as a sovereign module that must not redefine core ETH lock, prize-pool, or UVD mechanics.
- Keep timing, rarity eligibility, and auction cadence as stable interfaces so the current Supabase implementation can later be aligned with on-chain rules without a product reset.
- Expose App 3 data in a way that supports future realtime listeners, metadata-backed images, and system-status surfaces rather than hardwiring purely local UI assumptions.

## Out of Scope for Version 0.1.0

The following are not part of this scope version unless required as direct dependencies of the items above:

- Full redesign or completion of every screen in all four apps.
- Full asset production for the entire product backlog described in the role briefs.
- Final on-chain NFT minting, on-chain inventory, or contract-driven auction settlement.
- A complete Celestial Assembler, Quantum Lift-Off, or Cosmic Jackpot rebuild beyond compatibility work for the shared part model.
- Any redefinition of the core cross-app economy, prize logic, or UVD/ETH system mechanics described in the frozen overview docs.

## Success Criteria

This scope version is complete when:

- App 3 is no longer driven by hardcoded box data or local-only inventory state.
- A user can open a box, receive a persisted canonical part, and use that same part in inventory-driven flows.
- Nebula Bids exists as a working product flow, not just config constants or placeholder UI.
- The app shell and App 3 experience no longer feel isolated from the rest of the platform.
- App 3 fits back into the documented four-app journey instead of behaving like a standalone prototype page.
- The part, rarity, and box visuals are coherent enough that future App 4 work can build on one canonical system instead of parallel placeholders.

## Versioning Note

Update this file when the product-level scope changes. Use semantic versioning:

- Patch: wording clarifications, no material scope change.
- Minor: new in-scope deliverables or meaningful scope reductions.
- Major: a redefinition of product direction or milestone boundaries.

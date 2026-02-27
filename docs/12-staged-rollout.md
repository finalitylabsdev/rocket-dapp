# 12 — Staged Rollout

Feature flags for controlling which product surfaces are enabled in each
deployment environment.

## Flag Reference

| Flag                          | Env Var                              | Default | Controls                             |
|-------------------------------|--------------------------------------|---------|--------------------------------------|
| `FAUCET_ENABLED`              | `VITE_FLAG_FAUCET_ENABLED`           | `true`  | Entropy Gate faucet card on home     |
| `STAR_VAULT_ENABLED`          | `VITE_FLAG_STAR_VAULT_ENABLED`       | `true`  | Star Vault tab on Mystery page       |
| `NEBULA_BIDS_ENABLED`         | `VITE_FLAG_NEBULA_BIDS_ENABLED`      | `true`  | Nebula Bids tab on Mystery page      |
| `DEX_ENABLED`                 | `VITE_FLAG_DEX_ENABLED`              | `true`  | Entropy Exchange page                |
| `ROCKET_LAB_ENABLED`          | `VITE_FLAG_ROCKET_LAB_ENABLED`       | `true`  | Rocket Lab page                      |
| `AUCTION_SCHEDULER_ENABLED`   | `VITE_FLAG_AUCTION_SCHEDULER_ENABLED`| `true`  | Auction round scheduler (server-side)|

All flags default to **true** so the app runs fully open without any env vars.
Set a flag to `false`, `0`, `no`, or `off` to disable a feature.

Flag module: `src/config/flags.ts`

## Recommended Rollout Sequence

Enable features one at a time. Validate each stage before proceeding.

1. **Faucet** — `VITE_FLAG_FAUCET_ENABLED=true`
   - Core onboarding loop. Users can lock ETH, whitelist, and claim Flux.
   - Validate: wallet connect, lock tx, daily claims.

2. **Star Vault** — `VITE_FLAG_STAR_VAULT_ENABLED=true`
   - Mystery box purchases with Flux. NFT inventory populates.
   - Validate: box purchase, inventory rendering, rarity distribution.

3. **Nebula Bids** — `VITE_FLAG_NEBULA_BIDS_ENABLED=true`
   - Auction rounds go live. Users can submit parts and place bids.
   - Validate: round creation, bid placement, round settlement.

4. **DEX** — `VITE_FLAG_DEX_ENABLED=true`
   - Swap and liquidity provision. Depends on pool bootstrapping.
   - Validate: swap execution, LP add/remove, slippage bounds.

5. **Rocket Lab** — `VITE_FLAG_ROCKET_LAB_ENABLED=true`
   - Build rockets from inventory, run launches.
   - Validate: slot population, launch simulation, Grav Score recording.

The Leaderboard (Cosmic Jackpot) is always enabled — it has no flag.

## Pre-Launch Checklist

### Leaked Password Protection (Required)

Before opening the app to the public, enable leaked password protection in the
Supabase Dashboard:

> **Settings → Auth → Enable Leaked Password Protection**

This uses the HaveIBeenPwned dataset to reject passwords that appear in known
breaches. It is a dashboard toggle — no code change is required.

### Support & Audit Tooling (Deferred)

Wallet-level dispute review and support-grade audit tooling (e.g., admin views
for inspecting individual user state, flagging suspicious activity, resolving
disputes) are **deferred to post-launch**. The flag system provides a foundation
for gating these admin surfaces when they are built.

## Usage in Code

```tsx
// Direct import (static — tree-shakes in production)
import { DEX_ENABLED, ROCKET_LAB_ENABLED } from '../config/flags';

if (DEX_ENABLED) {
  // render DEX UI
}

// Hook form (same values, useful for consistency)
import { useFeatureFlags } from '../config/flags';

function MyComponent() {
  const flags = useFeatureFlags();
  if (!flags.ROCKET_LAB_ENABLED) return <ComingSoon />;
}
```

## Environment File Example

```env
# .env.staging — disable everything except faucet
VITE_FLAG_FAUCET_ENABLED=true
VITE_FLAG_STAR_VAULT_ENABLED=false
VITE_FLAG_NEBULA_BIDS_ENABLED=false
VITE_FLAG_DEX_ENABLED=false
VITE_FLAG_ROCKET_LAB_ENABLED=false
VITE_FLAG_AUCTION_SCHEDULER_ENABLED=false
```

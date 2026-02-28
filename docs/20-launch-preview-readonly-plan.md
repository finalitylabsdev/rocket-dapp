# 20. Launch Preview Read-Only Plan

## 1. Objective

This document defines the pre-launch operating model for the `development` branch and the low-effort cutover path to the live `main` branch.

The target launch window is **March 3, 2026 at 23:11 UTC**.

Until that moment:

- `development` acts as the non-state-changing preview experience.
- `main` continues to be the live, state-changing application with database integration.
- The preview experience must stay browseable, visually active, and operationally close to production without allowing user-triggered writes.

## 2. Branch Operating Model

### 2.1 `main`

- State-changing flows remain enabled.
- Real wallet-authenticated writes are allowed.
- Supabase-backed writes continue to be the source of truth.

### 2.2 `development`

- Wallet connection and signature authentication remain enabled.
- Navigation and read-only views remain enabled.
- User-initiated writes are blocked through centralized preview flags.
- Synthetic traffic and sample data keep the experience visually “alive”.

## 3. Preview Constraints Implemented In-App

The preview branch is now designed around a single master switch:

- `VITE_FLAG_PREVIEW_READ_ONLY_ENABLED`

When this flag is enabled:

- The home page shows a UTC-safe countdown to **March 3, 2026 23:11 UTC**.
- Entropy Gate keeps wallet auth available, but ETH lock and FLUX claim actions are click-denied.
- Star Vault stays visible, some boxes can render in a preview-opened state, and box opens are click-denied.
- Nebula Bids stays visible, live rounds can still be watched, and submissions/bids are click-denied.
- Rocket Lab renders a sample loadout and sample launch history, while equip/unequip/repair/launch actions are click-denied.

## 4. Central Flag Design

### 4.1 Master Switch

- `VITE_FLAG_PREVIEW_READ_ONLY_ENABLED`
  - Default for this branch: `true`
  - Launch cutover: set to `false`

### 4.2 Countdown

- `VITE_FLAG_LAUNCH_COUNTDOWN_ENABLED`
  - Keeps the countdown independently controllable.

### 4.3 Per-Action Overrides

These allow selective re-enablement without code changes:

- `VITE_FLAG_PREVIEW_ALLOW_GATE_LOCK`
- `VITE_FLAG_PREVIEW_ALLOW_GATE_CLAIM`
- `VITE_FLAG_PREVIEW_ALLOW_BOX_OPEN`
- `VITE_FLAG_PREVIEW_ALLOW_AUCTION_SUBMIT`
- `VITE_FLAG_PREVIEW_ALLOW_AUCTION_BID`
- `VITE_FLAG_PREVIEW_ALLOW_ROCKET_EQUIP`
- `VITE_FLAG_PREVIEW_ALLOW_ROCKET_UNEQUIP`
- `VITE_FLAG_PREVIEW_ALLOW_ROCKET_REPAIR`
- `VITE_FLAG_PREVIEW_ALLOW_ROCKET_LAUNCH`

### 4.4 Preview View Flags

These control what still renders while writes are blocked:

- `VITE_FLAG_PREVIEW_ALLOW_ANON_AUCTION_VIEW`
- `VITE_FLAG_PREVIEW_SAMPLE_INVENTORY_ENABLED`
- `VITE_FLAG_PREVIEW_SAMPLE_BOX_REVEALS_ENABLED`
- `VITE_FLAG_PREVIEW_SAMPLE_LAUNCH_HISTORY_ENABLED`

## 5. Interaction Matrix

### 5.1 Allowed In Preview

- Section navigation
- Wallet connect
- Wallet signature auth
- Viewing leaderboard data
- Viewing live/simulated auction rounds and bid traffic
- Viewing sample inventory, sample box reveals, and sample Rocket Lab state

### 5.2 Denied In Preview

- ETH lock submission
- FLUX faucet claim
- Star Vault box opening
- Nebula Bids submission
- Nebula Bids bid placement
- Rocket equip/unequip
- Rocket repair
- Rocket launch

### 5.3 UX Rule

Blocked actions must:

- Stay visible in the interface
- Keep their intended labels
- Use the shared click-denied behavior
- Show `Operation not allowed in preview` on hover
- Perform no write when clicked

## 6. Synthetic User / Pseudo ETH Commit Plan

This is the next operational workstream and should be implemented server-authoritatively.

### 6.1 Goal

Generate simulated users on random intervals so the preview branch shows believable activity:

- synthetic ETH lock attempts
- synthetic FLUX claims
- synthetic Star Vault openings
- synthetic auction participation
- synthetic Rocket Lab launches
- leaderboard movement

### 6.2 Source Of Truth

Use Supabase as the durable source of truth for simulated identities and their signing material.

Recommended tables:

- `sim_wallet_keys`
  - `id`
  - `wallet_address`
  - `private_key_ciphertext`
  - `private_key_kid`
  - `status`
  - `created_at`
  - `last_used_at`

- `sim_wallet_profiles`
  - `wallet_address`
  - `persona_name`
  - `aggression_score`
  - `box_open_bias`
  - `auction_bid_bias`
  - `launch_bias`
  - `active`

- `sim_activity_schedule`
  - `id`
  - `wallet_address`
  - `activity_type`
  - `scheduled_for`
  - `executed_at`
  - `status`
  - `payload`

### 6.3 Key Handling

- Do not store raw private keys in plaintext.
- Encrypt private keys before persistence.
- Store the encryption key outside the table data path.
- Only server-side jobs/functions should decrypt and use signing material.
- Never expose these keys to the client.

### 6.4 Execution Model

Recommended order:

1. A scheduler selects an active synthetic wallet.
2. The scheduler chooses an action using weighted randomness.
3. A server-side executor signs and submits the synthetic action.
4. The write lands in the same authoritative tables used by the live app.
5. Realtime subscriptions update the preview UI naturally.

### 6.5 Safety Guardrails

- Hard-cap synthetic write frequency.
- Rate-limit per simulated wallet.
- Separate “preview synthetic” identities from real user identities.
- Add a global kill switch for synthetic traffic.
- Log every synthetic action with deterministic provenance.

## 7. Launch Cutover Procedure

When the live cutover is approved:

1. Set `VITE_FLAG_PREVIEW_READ_ONLY_ENABLED=false`.
2. Optionally set `VITE_FLAG_LAUNCH_COUNTDOWN_ENABLED=false`.
3. Leave per-action overrides unset unless a partial rollout is still needed.
4. Validate that user-triggered writes work again in Gate, Star Vault, Nebula Bids, and Rocket Lab.
5. Keep synthetic traffic isolated to the preview branch/environment unless explicitly intended for production.

## 8. Verification Checklist

- Countdown renders against the fixed UTC timestamp and reads correctly across browsers.
- Users can still connect wallets and authenticate.
- Every blocked action shows the click-denied hover text and produces no mutation.
- Star Vault and Rocket Lab still look populated even without a connected wallet.
- Nebula Bids can still be observed in preview without forcing auth.
- The leaderboard remains readable.

## 9. Immediate Next Steps

1. Use the managed-wallet mode documented in [16-synthetic-traffic-simulator.md](/Users/mblk/Code/finality/rocket/docs/16-synthetic-traffic-simulator.md) to seed and grow the synthetic actor pool.
2. Tune the managed-wallet target count and generation interval so preview traffic looks active without distorting the leaderboard too aggressively.
3. Add a small operator-only status panel so you can confirm preview flags and synthetic traffic health at a glance.

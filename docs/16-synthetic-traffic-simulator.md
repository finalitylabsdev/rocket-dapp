# Synthetic Traffic Simulator

> Scope: lightweight synthetic gameplay activity using the same Supabase web3 auth and gameplay RPC paths as the UI
> Runtime: optional Docker Compose profile `sim`

## What It Does

The simulator is a headless Node worker that:

- Signs in with real Ethereum private keys through `POST /auth/v1/token?grant_type=web3`
- Creates a normal wallet-bound Supabase session for each synthetic actor
- Calls the same authenticated gameplay RPCs the frontend uses:
  - `sync_wallet_flux_balance`
  - `record_flux_faucet_claim`
  - `open_mystery_box`
  - `get_user_inventory`
  - `submit_auction_item`
  - `get_active_auction`
  - `place_auction_bid`

This remains intentionally closer to real player behavior than a service-role SQL script.

## Wallet Source Modes

The simulator now supports two wallet-source modes.

### Mode 1: `env` (existing behavior)

- Set `SIM_WALLET_SOURCE=env` or leave it unset.
- Provide `SIM_WALLET_PRIVATE_KEYS`.
- The worker derives wallets directly from `.env`.

This is still the simplest path for one-off runs.

### Mode 2: `supabase` (managed wallet pool)

- Set `SIM_WALLET_SOURCE=supabase`.
- The worker reads encrypted simulator wallets from `public.sim_wallet_keys`.
- In this mode, `public.sim_wallet_keys` is the durable source of truth for simulator wallets.
- It can optionally import any `SIM_WALLET_PRIVATE_KEYS` into that pool on startup.
- In that case, `SIM_WALLET_PRIVATE_KEYS` is only a bootstrap/import source, not the long-term registry.
- It can generate additional wallets over time and store them durably in Supabase.
- It can pseudo-seed a confirmed ETH lock row for those generated wallets so they can immediately participate in the simulator loop.

This is the preferred path when you want the synthetic actor base to persist and grow.

## Important Limitation

The simulator still does **not** perform a real `eth_sendTransaction` browser wallet flow.

Instead, in managed-wallet mode, it can now pseudo-seed a confirmed ETH lock row server-side for synthetic wallets:

- this is still simulated
- no real on-chain ETH transaction is sent
- the resulting wallet is treated as an already-confirmed lock user for gameplay

That allows newly generated synthetic wallets to move through the rest of the gameplay loop without a browser.

## Required Environment

### Core

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`
- `VITE_SIWE_URI`
- `VITE_SIWE_DOMAIN`

### `env` Wallet Mode

- `SIM_WALLET_PRIVATE_KEYS`
  - Comma-separated or newline-separated Ethereum private keys.

### `supabase` Wallet Mode

- `SIM_WALLET_SOURCE=supabase`
- `SIM_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
  - Required so the worker can read/write the managed wallet tables.
- `SIM_MANAGED_WALLETS_ENCRYPTION_KEY`
  - Required.
  - Must be either:
    - 64 hex chars (32 bytes), or
    - base64 that decodes to 32 bytes

### Recommended For Managed Wallet Mode

- `SIM_MANAGED_WALLET_TARGET_COUNT`
  - Desired active synthetic actor count.
  - If the stored pool is smaller than this target, the worker generates more wallets over randomized intervals.
- `SIM_IMPORT_ENV_WALLETS_TO_SUPABASE=true`
  - Imports any `SIM_WALLET_PRIVATE_KEYS` into `sim_wallet_keys` on startup.
- `SIM_AUTO_CONFIRM_ETH_LOCK=true`
  - Pseudo-seeds a confirmed ETH lock row for managed wallets after auth.

### Optional Simulator Tuning

- `SIM_CHAIN_ID` (default `1`)
- `SIM_SIWE_URI`
  - If unset, the worker falls back to `VITE_SIWE_URI`, then `https://o.finality.dev/`.
- `SIM_SIWE_DOMAIN`
- `SIM_BOX_TIER_IDS`
- `SIM_LOOP_INTERVAL_MS` (default `45000`)
- `SIM_INITIAL_SPREAD_MS` (default `15000`)
- `SIM_MAX_BOX_OPENS_PER_CYCLE` (default `1`)
- `SIM_MAX_BID_ATTEMPTS_PER_CYCLE` (default `3`)
- `SIM_BID_ATTEMPT_PROBABILITY` (default `0.9`)
- `SIM_BID_MARKUP_MIN` (default `0.05`)
- `SIM_BID_MARKUP_MAX` (default `0.35`)
- `SIM_DRY_RUN` (`true` or `false`)
  - `SIM_DRY_RUN=true` only supports `SIM_WALLET_SOURCE=env` so the worker stays fully offline.
- `SIM_RUN_ONCE` (`true` or `false`)
- `SIM_BOOTSTRAP_ONLY` (`true` or `false`)
  - In `supabase` mode, seeds/imports the managed pool and exits without running gameplay loops.
- `SIM_USER_AGENT` (default `entropy-sim/1.0`)
- `SIM_MANAGED_WALLET_KID` (default `sim-local-v1`)
- `SIM_MANAGED_WALLET_GENERATION_MIN_INTERVAL_MS` (default `120000`)
- `SIM_MANAGED_WALLET_GENERATION_MAX_INTERVAL_MS` (default `420000`)
- `SIM_ETH_LOCK_TO_ADDRESS`
  - Falls back to `VITE_ETH_LOCK_RECIPIENT`, then a valid placeholder address.
- `SIM_ETH_LOCK_AMOUNT_WEI`
  - Falls back to the current whitelist lock amount.

## Managed Wallet Storage

Managed-wallet mode uses these service-role-only tables:

- `public.sim_wallet_keys`
  - encrypted private keys
  - wallet status
  - key id metadata
  - last-used tracking
- `public.sim_wallet_profiles`
  - behavior tuning metadata
- `public.sim_activity_schedule`
  - reserved for queued / future scheduled simulator actions

Private keys are stored encrypted at rest using AES-256-GCM before the worker writes them into Supabase.

The encryption key is never written to the database.

## First-Time Managed Wallet Setup

Before you use `SIM_WALLET_SOURCE=supabase` in a real run:

1. Apply the pending simulator migration to the linked Supabase project.
   - The required schema is in `supabase/migrations/20260228193000_add_managed_synthetic_wallet_pool.sql`.
2. Set the managed-wallet env flags in `.env`.
   - At minimum: `SUPABASE_SERVICE_ROLE_KEY`, `SIM_WALLET_SOURCE=supabase`, and `SIM_MANAGED_WALLETS_ENCRYPTION_KEY`.
   - Recommended: `SIM_IMPORT_ENV_WALLETS_TO_SUPABASE=true`, `SIM_AUTO_CONFIRM_ETH_LOCK=true`, and `SIM_MANAGED_WALLET_TARGET_COUNT`.
   - For local Docker runs, `rocket-sim` inherits these values from the same `.env` via `docker-compose.yml`, so `make sim-bootstrap` and `make sim-up` use the same runtime config.
3. Bootstrap the pool once.

```bash
make sim-bootstrap
```

That one-shot bootstrap imports any `SIM_WALLET_PRIVATE_KEYS` into `public.sim_wallet_keys`, seeds the managed pool, and exits.

Bootstrap-only does not authenticate wallets, so `SIM_AUTO_CONFIRM_ETH_LOCK` is applied when those wallets first authenticate during a normal managed-wallet run.

## Start It

Run the optional compose profile:

```bash
make sim-up
```

Or directly:

```bash
docker compose --profile sim up -d --build rocket-sim
```

The normal web container is unchanged. The simulator is still opt-in.

## Useful Run Patterns

### 1. Existing `.env` wallets only

```bash
zsh -lc 'set -a; source .env; SIM_WALLET_SOURCE=env SIM_RUN_ONCE=true node scripts/synthetic-traffic.mjs'
```

### 2. Bootstrap the managed wallet pool only

```bash
make sim-bootstrap
```

Equivalent direct invocation:

```bash
zsh -lc 'set -a; source .env; SIM_WALLET_SOURCE=supabase SIM_BOOTSTRAP_ONLY=true node scripts/synthetic-traffic.mjs'
```

### 3. Run with the managed wallet pool

```bash
zsh -lc 'set -a; source .env; SIM_WALLET_SOURCE=supabase node scripts/synthetic-traffic.mjs'
```

### 4. Offline one-shot self-test

```bash
SIM_SELF_TEST=true node scripts/synthetic-traffic.mjs
```

### 5. Offline dry-run loop

```bash
zsh -lc 'set -a; source .env; SIM_DRY_RUN=true SIM_RUN_ONCE=true SIM_WALLET_SOURCE=env node scripts/synthetic-traffic.mjs'
```

## What Happens In Managed Wallet Mode

On startup the worker:

1. Optionally imports any `SIM_WALLET_PRIVATE_KEYS` into `sim_wallet_keys`.
2. Loads the active managed wallet pool from Supabase.
3. If the pool is empty and `SIM_MANAGED_WALLET_TARGET_COUNT > 0`, generates the first wallet immediately.
4. Authenticates those wallets through the normal web3 auth path.
5. Optionally pseudo-seeds a confirmed ETH lock row for each managed wallet.
6. Starts the normal gameplay loop for the active managed wallets.
7. If the active count is below `SIM_MANAGED_WALLET_TARGET_COUNT`, generates and starts more wallets over randomized intervals.

## Monitor It

Tail the worker logs:

```bash
make sim-logs-follow
```

The worker emits JSON lines such as:

- `wallet_authenticated`
- `managed_wallet_pool_ready`
- `managed_wallet_generated`
- `synthetic_eth_lock_seeded`
- `faucet_claimed`
- `box_opened`
- `auction_submitted`
- `auction_bid`
- `cycle_error`

You should also watch production state directly:

- `auction_scheduler_health`
- `auction_round_diagnostics`
- `flux_ledger_reconciliation`
- `flux_ledger_entries`
- `auction_submissions`
- `auction_bids`
- `eth_lock_submissions`

## Stop It

```bash
make sim-down
```

## Why This Path

Most launch-critical gameplay RPCs in this repo require a real authenticated Supabase session tied to a wallet identity. A simple service-role SQL-only worker would not exercise the same codepath.

The simulator still uses real wallet signatures and normal web3 auth. The new managed-wallet mode only changes where those keys come from and how the actor pool is maintained.

## Operational Notes

- The worker still uses built-in Node APIs only.
- `SIM_SELF_TEST=true` remains fully offline.
- `SIM_DRY_RUN=true` remains fully offline and intentionally stays limited to `SIM_WALLET_SOURCE=env`.
- Managed-wallet mode requires the service-role key because the managed wallet tables are service-role-only.
- The current gameplay RPC surface is still mixed:
  - `place_auction_bid` uses the idempotent bid signature.
  - Other gameplay RPCs remain aligned with the current production-compatible signatures.
- If live logs show `column "idempotency_key" does not exist` during `auction_bid`, apply [20260228174500_repair_flux_ledger_idempotency_key.sql](/Users/mblk/Code/finality/rocket/supabase/migrations/20260228174500_repair_flux_ledger_idempotency_key.sql).

## Future Fallback

If you later want persistent synthetic activity without relying on a local container, a DB-side synthetic loop is still a viable fallback.

- It is not required for the current workflow.
- The preferred operating model remains: start `rocket-sim` when you want load, stop it when you do not.

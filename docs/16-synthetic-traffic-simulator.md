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

This is intentionally closer to real player behavior than a service-role SQL script.

## Important Limitation

The simulator does **not** perform the live ETH lock transaction step.

That step in the real UI requires `eth_sendTransaction` from a connected browser wallet, then triggers the `verify-eth-lock` edge function. For synthetic load, the expected path is:

- use wallets that already have `eth_lock_submissions.status = 'confirmed'`
- and `is_lock_active = true`

That matches the scenario where you already seeded pseudo lock transactions in the database.

## Required Environment

Add these to `.env` before starting the simulator:

- `SIM_WALLET_PRIVATE_KEYS`
  - Comma-separated or newline-separated Ethereum private keys.
  - Use 5-10 wallets that already exist as confirmed ETH-lock users in the production database.
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`

Recommended:

- `VITE_SPEC_WHITELIST_BONUS_FLUX`
- `VITE_SPEC_DAILY_CLAIM_FLUX`
- `VITE_SPEC_FAUCET_INTERVAL_SECONDS`

Optional simulator tuning:

- `SIM_CHAIN_ID` (default `1`)
- `SIM_SIWE_URI`
  - If unset, the worker falls back to `VITE_SIWE_URI`, then `https://o.finality.dev/`.
  - For this production setup, use the real frontend origin `https://o.finality.dev/`.
- `SIM_SIWE_DOMAIN` (defaults from the SIWE URI)
- `SIM_BOX_TIER_IDS` (comma-separated list; if omitted, the worker loads `box_tiers` from Supabase)
- `SIM_LOOP_INTERVAL_MS` (default `45000`)
- `SIM_INITIAL_SPREAD_MS` (default `15000`)
- `SIM_MAX_BOX_OPENS_PER_CYCLE` (default `1`)
- `SIM_DRY_RUN` (`true` or `false`)
  - When `true`, the worker runs the full staggered loop and emits normal gameplay events without calling Supabase.
- `SIM_RUN_ONCE` (`true` or `false`)
- `SIM_USER_AGENT` (default `entropy-sim/1.0`)

## Start It

Run the optional compose profile:

```bash
make sim-up
```

Or directly:

```bash
docker compose --profile sim up -d --build rocket-sim
```

The normal web container is unchanged. The simulator is opt-in and does not start under the default `make up`.

## Quick Checks

Use these for fast verification before you point the worker at production:

```bash
# Offline one-shot using the wallets in .env
zsh -lc 'set -a; source .env; SIM_DRY_RUN=true SIM_RUN_ONCE=true node scripts/synthetic-traffic.mjs'

# Offline crypto self-test only
SIM_SELF_TEST=true node scripts/synthetic-traffic.mjs

# Real production traffic
make sim-up
```

## Monitor It

Tail the worker logs:

```bash
make sim-logs-follow
```

The worker emits JSON lines such as:

- `wallet_authenticated`
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

## Stop It

```bash
make sim-down
```

## Why This Path

Most launch-critical gameplay RPCs in this repo require a real authenticated Supabase session tied to a wallet identity. A simple service-role container would not exercise the same codepath.

This simulator uses real wallet signatures and web3 auth, so it exercises the same normal player path after the ETH lock is already in place.

## Operational Notes

- The simulator no longer needs `npm install` inside the `rocket-sim` image.
  - The worker uses built-in Node APIs only, so `docker compose --profile sim up --build rocket-sim` does not depend on registry access.
- `SIM_SELF_TEST=true node scripts/synthetic-traffic.mjs` runs an offline crypto self-test.
  - This validates the local Keccak-256, address derivation, and Ethereum personal-sign path without touching the network.
- `SIM_DRY_RUN=true` runs the worker in a fully offline loop.
  - This is useful for checking the container lifecycle, stagger timing, and JSON event stream before you point it at production.
- The current production RPC surface is mixed.
  - `place_auction_bid` uses the idempotent signature and the simulator sends `p_idempotency_key` explicitly for bids.
  - Other simulator RPCs still target the older production-compatible signatures until their idempotency migrations are applied.
- If live logs show `column "idempotency_key" does not exist` during `auction_bid`, the DB function has outpaced the schema.
  - Apply [20260228174500_repair_flux_ledger_idempotency_key.sql](/Users/mblk/Code/finality/rocket/supabase/migrations/20260228174500_repair_flux_ledger_idempotency_key.sql) to add `public.flux_ledger_entries.idempotency_key` and its unique partial index.

## Future Fallback

If you later want persistent synthetic activity without relying on a local container, a DB-side synthetic loop is a viable fallback.

- It is not required for the current on-demand workflow.
- The preferred operating model remains: start `rocket-sim` when you want load, stop it when you do not.

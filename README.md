# Rocket

Operational quick reference for the synthetic traffic simulator:

- Canonical runbook: [docs/16-synthetic-traffic-simulator.md](docs/16-synthetic-traffic-simulator.md)
- The simulator is on-demand only.
  - Start it when you want traffic.
  - Stop it when you do not.
- The primary path is the local/container worker, not a DB-side cron loop.
  - The DB-side loop is only a future fallback.

Managed-wallet first-time setup:

1. Apply the pending simulator migration(s) in `supabase/migrations/`, including `20260228193000_add_managed_synthetic_wallet_pool.sql`.
2. Set the managed-wallet flags in `.env`.
   - Required: `SUPABASE_SERVICE_ROLE_KEY`, `SIM_WALLET_SOURCE=supabase`, `SIM_MANAGED_WALLETS_ENCRYPTION_KEY`
   - Recommended: `SIM_IMPORT_ENV_WALLETS_TO_SUPABASE=true`, `SIM_AUTO_CONFIRM_ETH_LOCK=true`, `SIM_MANAGED_WALLET_TARGET_COUNT`
   - Local `rocket-sim` container runs inherit these values from the same `.env` through `docker-compose.yml`.
3. Run `make sim-bootstrap` once to import/generate the managed wallet pool.

After that, `make sim-up` is the normal long-running simulator path when you want live traffic.
Bootstrap-only prepares the pool only. Newly generated wallets receive their pseudo ETH lock on their first authenticated managed-wallet run.
In managed-wallet mode, Supabase is the wallet source of truth; `SIM_WALLET_PRIVATE_KEYS` is only a seed/import input.

Quick commands:

```bash
# Managed-wallet bootstrap only
make sim-bootstrap

# Offline sanity check: no Supabase calls
zsh -lc 'set -a; source .env; SIM_DRY_RUN=true SIM_RUN_ONCE=true node scripts/synthetic-traffic.mjs'

# Offline container run
SIM_DRY_RUN=true make sim-up

# Live production traffic
make sim-up

# Follow logs
make sim-logs-follow

# Stop the simulator
make sim-down
```

Useful env flags:

- `SIM_DRY_RUN=true`
  - Runs the full staggered worker loop without touching Supabase.
- `SIM_RUN_ONCE=true`
  - Executes one cycle per wallet, then exits.
- `SIM_SELF_TEST=true`
  - Runs an offline crypto self-test for Keccak-256, address derivation, and Ethereum personal-sign.

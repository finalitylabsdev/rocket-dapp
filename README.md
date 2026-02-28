# Rocket

Operational quick reference for the synthetic traffic simulator:

- Canonical runbook: [docs/16-synthetic-traffic-simulator.md](docs/16-synthetic-traffic-simulator.md)
- The simulator is on-demand only.
  - Start it when you want traffic.
  - Stop it when you do not.
- The primary path is the local/container worker, not a DB-side cron loop.
  - The DB-side loop is only a future fallback.

Quick commands:

```bash
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

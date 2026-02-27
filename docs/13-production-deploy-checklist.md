# Production Deploy Checklist

> Consolidated from [11-auction-tick-runbook.md](./11-auction-tick-runbook.md)
> Last updated: 2026-02-27

Linear pre-launch checklist for deploying the FLUX ledger and Nebula Bids auction system to production. Complete each item in order.

## Pre-Deploy Verification

- [ ] All migrations applied to the production Supabase project
- [ ] Confirm `wallet_registry`, `wallet_flux_balances`, `flux_ledger_entries` tables exist
- [ ] Confirm `auction_rounds`, `auction_submissions`, `auction_bids` tables exist
- [ ] Confirm `inventory_parts`, `rarity_tiers`, `rocket_sections`, `box_tiers`, `part_variants` tables exist
- [ ] Confirm `reconciliation_snapshots` table exists
- [ ] Confirm `flux_ledger_entries.idempotency_key` column and unique index exist
- [ ] Confirm all RPCs are deployed: `sync_wallet_flux_balance`, `record_flux_faucet_claim`, `adjust_wallet_flux_balance`, `open_mystery_box`, `place_auction_bid`, `finalize_auction`, `start_auction_round`, `transition_auction_to_bidding`, `get_active_auction`, `get_auction_history`, `run_flux_reconciliation`
- [ ] Confirm diagnostic views exist: `auction_round_diagnostics`, `flux_ledger_reconciliation`, `auction_scheduler_health`

## Secrets and Configuration

- [ ] Confirm `SUPABASE_URL` is set (auto-injected)
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is set (auto-injected)
- [ ] Decide whether to use `AUCTION_TICK_SERVICE_ROLE_FALLBACK` for external schedulers
- [ ] If yes, generate and set fallback token:
  ```bash
  openssl rand -base64 32
  supabase secrets set AUCTION_TICK_SERVICE_ROLE_FALLBACK=<generated-token>
  ```
- [ ] If using `pg_cron`, store the project URL and scheduler bearer token in Supabase Vault (recommended so they do not appear in `cron.job`):
  ```sql
  SELECT vault.create_secret('<SUPABASE_URL>', 'auction_tick_url');
  SELECT vault.create_secret('<SERVICE_ROLE_KEY_OR_FALLBACK>', 'auction_tick_bearer');
  ```

## Deploy Auction-Tick Edge Function

- [ ] Deploy the function:
  ```bash
  supabase functions deploy auction-tick --no-verify-jwt
  ```
- [ ] Verify the function is listed in the Supabase dashboard under Edge Functions

## Manual Smoke Test

- [ ] Run a manual POST to the deployed endpoint:
  ```bash
  curl -s -X POST \
    https://<project-ref>.supabase.co/functions/v1/auction-tick \
    -H "Authorization: Bearer <SERVICE_ROLE_KEY_OR_FALLBACK>" \
    -H "Content-Type: application/json"
  ```
- [ ] Confirm response shape: `{ "status": "ok", "transitioned": [], "finalized": [], "started": { "status": "round_started" } }`
- [ ] Confirm a new row appears in `auction_rounds` with status `accepting_submissions`

## Configure Scheduler

Choose one scheduling path:

### Option A: pg_cron (recommended)

- [ ] Confirm `pg_cron` extension is enabled in the Supabase project
- [ ] Confirm `pg_net` / `net.http_post(...)` is available
- [ ] Decide which bearer token the job will send (`AUCTION_TICK_SERVICE_ROLE_FALLBACK` or `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Register the cron job:
  ```sql
  SELECT cron.schedule(
    'auction-tick',
    '*/5 * * * *',
    $$
    SELECT net.http_post(
      url := (SELECT decrypted_secret
              FROM vault.decrypted_secrets
              WHERE name = 'auction_tick_url') || '/functions/v1/auction-tick',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || (SELECT decrypted_secret
                                       FROM vault.decrypted_secrets
                                       WHERE name = 'auction_tick_bearer'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $$
  );
  ```
- [ ] Confirm job appears in `cron.job`
- [ ] If you skipped Vault, confirm the SQL snippet above was adjusted to inline the URL and bearer token instead

### Option B: External scheduler

- [ ] Configure external cron to POST every 5 minutes or better to:
  ```
  POST https://<project-ref>.supabase.co/functions/v1/auction-tick
  Authorization: Bearer <AUCTION_TICK_SERVICE_ROLE_FALLBACK>
  Content-Type: application/json
  ```

## Verify Full Lifecycle

- [ ] Wait for or trigger a full auction round lifecycle:
  1. Round starts (`accepting_submissions`)
  2. Submission window closes, round transitions to `bidding`
  3. Bidding window closes, round finalizes to `completed`
  4. New round starts automatically
- [ ] Confirm the scheduler cadence is 5 minutes or better
- [ ] Confirm no rounds are stuck in `overdue` or `finalizing` state

## Reconciliation Verification

- [ ] Run the reconciliation RPC:
  ```bash
  curl -s -X POST \
    "https://<project-ref>.supabase.co/rest/v1/rpc/run_flux_reconciliation" \
    -H "apikey: <SERVICE_ROLE_KEY>" \
    -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
    -H "Content-Type: application/json"
  ```
- [ ] Confirm `wallets_with_drift` is 0
- [ ] Check `reconciliation_snapshots` table for the run results

## Idempotency Verification

- [ ] Test faucet claim idempotency: claim twice with same wallet on same day, confirm only one ledger entry
- [ ] Test auction bid idempotency: submit same bid twice (same wallet, round, amount), confirm only one escrow deduction
- [ ] Test mystery box idempotency: confirm retry with same key returns original part, not a new one

## Monitoring and Alerts

- [ ] Set up alerting for `auction_scheduler_health.overdue_rounds > 0`
- [ ] Set up alerting for `auction_scheduler_health.stuck_finalizing > 0`
- [ ] Set up alerting for `auction_scheduler_health.wallets_with_drift > 0`
- [ ] Monitor `cron.job_run_details` (if using pg_cron) for failed executions
- [ ] Record the owner/on-call path for break-glass service-role intervention

## Post-Deploy

- [ ] Document the scheduler cadence and scheduling path chosen
- [ ] Confirm the break-glass recovery paths from the [runbook](./11-auction-tick-runbook.md) are understood by the on-call team
- [ ] Schedule recurring reconciliation runs (daily recommended)

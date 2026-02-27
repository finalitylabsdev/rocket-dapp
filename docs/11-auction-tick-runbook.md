# Auction-Tick Deployment Runbook

> Last updated: 2026-02-27
> Scope: production deployment and operation of `supabase/functions/auction-tick/index.ts`

This is the operational runbook for the scheduler primitive that advances Nebula Bids rounds. The repo contains the function source and the local Supabase function config entry, but production deployment, secret provisioning, cron registration, and alert wiring are still manual steps.

## What Already Exists In Repo

- `supabase/functions/auction-tick/index.ts`
  - Runs the three lifecycle passes: transition, finalize, then start.
  - Validates a Bearer token against `SUPABASE_SERVICE_ROLE_KEY` or `AUCTION_TICK_SERVICE_ROLE_FALLBACK`.
  - Applies a 30-second in-memory rate limit.
- `supabase/config.toml`
  - Declares `[functions.auction-tick]`
  - Sets `verify_jwt = false`
- `supabase/migrations/20260228120000_add_nebula_bids_auction.sql`
  - Adds the lifecycle RPCs the function calls.
- `supabase/migrations/20260228130000_add_auction_ops_diagnostics.sql`
  - Adds the operator-facing diagnostic views used for monitoring.

## What Is Still Manual

None of the following is automated by this repo:

- Deploying the Edge Function to the production project
- Setting `AUCTION_TICK_SERVICE_ROLE_FALLBACK`
- Enabling and configuring `pg_cron` / `pg_net` if the project uses in-database scheduling
- Storing scheduler secrets in Supabase Vault if the project uses a Vault-backed `pg_cron` job
- Registering the cron job itself
- Wiring alerts for overdue rounds, stuck finalization, or ledger drift
- Verifying the first production round lifecycle end to end

Treat the checklists below as pending operational work until each step has been executed in the live project.

## Scheduler Behavior

Each invocation performs the same three passes in order:

1. Transition any `accepting_submissions` rounds whose `submission_ends_at <= now()`.
2. Finalize any `bidding` rounds whose `ends_at <= now()`.
3. Start a new round if no active round exists.

The cron cadence does not define the phase windows. The database timestamps do. The scheduler only needs to run often enough that transitions occur shortly after those timestamps pass.

## Round Timing

| Phase | Duration | Timestamp field |
|-------|----------|-----------------|
| Submission window | 30 minutes | `submission_ends_at` |
| Bidding window | 3.5 hours | `ends_at` |
| Total round | 4 hours | Derived from `starts_at` + `ends_at` |

## Required Secrets

| Secret | Required | Purpose |
|--------|----------|---------|
| `SUPABASE_URL` | Yes | Edge Function project URL (auto-injected by Supabase) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Admin RPC access (auto-injected by Supabase) |
| `AUCTION_TICK_SERVICE_ROLE_FALLBACK` | No | Separate bearer token for external schedulers |

If an external scheduler should not hold the service role key directly, set a fallback token:

```bash
openssl rand -base64 32
supabase secrets set AUCTION_TICK_SERVICE_ROLE_FALLBACK=<generated-token>
```

## Manual Production Deployment

### 1. Deploy the function

This repo does not deploy the function for you. Run:

```bash
supabase functions deploy auction-tick --no-verify-jwt
```

`--no-verify-jwt` is required because the function performs its own Bearer-token validation.

### 2. Verify a manual invocation

Run a real POST against the deployed endpoint:

```bash
curl -s -X POST \
  https://<project-ref>.supabase.co/functions/v1/auction-tick \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY or AUCTION_TICK_SERVICE_ROLE_FALLBACK>" \
  -H "Content-Type: application/json"
```

Expected shape:

```json
{
  "status": "ok",
  "transitioned": [],
  "finalized": [],
  "started": {
    "status": "round_started"
  }
}
```

### 3. Register a scheduler

Choose one scheduling path. Neither is configured by this repo.

#### Option A: `pg_cron` inside Supabase

Manual prerequisites:

- Confirm the project has `pg_cron` enabled.
- Confirm the project has `pg_net` / `net.http_post(...)` available.
- Choose the bearer token the scheduled request can send (`AUCTION_TICK_SERVICE_ROLE_FALLBACK` or `SUPABASE_SERVICE_ROLE_KEY`).
- Recommended: store the project URL and chosen bearer token in Supabase Vault so they do not appear in plaintext in `cron.job`.

Store the secrets in Vault:

```sql
SELECT vault.create_secret('<SUPABASE_URL>', 'auction_tick_url');
SELECT vault.create_secret('<SERVICE_ROLE_KEY_OR_FALLBACK>', 'auction_tick_bearer');
```

Then register the job:

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

If you prefer a simpler setup, you can inline the URL and bearer token directly instead of using Vault, but the job definition in `cron.job` will then contain those values in plaintext.

#### Option B: external scheduler

Any external cron system can POST to:

```text
POST https://<project-ref>.supabase.co/functions/v1/auction-tick
Authorization: Bearer <AUCTION_TICK_SERVICE_ROLE_FALLBACK or SERVICE_ROLE_KEY>
Content-Type: application/json
```

### 4. Confirm cadence

Recommended cadence:

| Cadence | Launch suitability |
|---------|--------------------|
| Every 1 minute | Best |
| Every 5 minutes | Acceptable |
| Every 15 minutes | Too slow for the 30-minute submission window |

The function returns `429` if invoked within 30 seconds of the previous warm invocation.

## Monitoring and Manual Checks

### Health signals

- Cron execution records
  - If using `pg_cron`, inspect `cron.job_run_details`.
- HTTP responses
  - `200`: normal
  - `401`: bad/missing Bearer token
  - `429`: invoked too quickly
  - `500`: lifecycle RPC or query failure
- `auction_round_diagnostics`
  - Watch for `health = 'overdue'`
- `auction_scheduler_health`
  - Watch `stuck_finalizing > 0`
- `flux_ledger_reconciliation`
  - Watch `wallets_with_drift > 0`

### Example service-role query

```bash
curl -s \
  "https://<project-ref>.supabase.co/rest/v1/auction_scheduler_health?select=*" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

## Recovery Paths

### Scheduler missed one or more runs

Invoke the function manually:

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/auction-tick \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY or AUCTION_TICK_SERVICE_ROLE_FALLBACK>"
```

The function will process all currently overdue transitions in one call.

### A round is stuck in `finalizing`

Call `finalize_auction(...)` directly with the service role:

```bash
curl -X POST \
  "https://<project-ref>.supabase.co/rest/v1/rpc/finalize_auction" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"p_round_id": <round_id>}'
```

### A part stayed locked after the round ended

Use a manual service-role update:

```sql
UPDATE inventory_parts
SET is_locked = false,
    updated_at = now()
WHERE id = '<part_id>'
  AND is_locked = true;
```

### FLUX drift is detected

Investigate the wallet's ledger first. If the ledger is correct and the balance snapshot is wrong, repair the balance:

```sql
UPDATE wallet_flux_balances
SET available_balance = (
      SELECT COALESCE(SUM(amount_flux), 0)
      FROM flux_ledger_entries
      WHERE wallet_address = '<wallet>'
    ),
    updated_at = now()
WHERE wallet_address = '<wallet>';
```

This branch does not add stronger balance-flow idempotency. Treat repeated drift as a follow-up hardening signal, not as something already solved.

## Production Checklist

- [ ] Deploy `auction-tick` to the production project
- [ ] Set `AUCTION_TICK_SERVICE_ROLE_FALLBACK` if needed
- [ ] Choose and configure a scheduler (`pg_cron` or external)
- [ ] Verify the scheduler cadence is 5 minutes or better
- [ ] Run at least one successful manual POST against production
- [ ] Confirm a full lifecycle in production: start, transition, finalize, restart
- [ ] Add alerts for overdue rounds, stuck finalization, and ledger drift
- [ ] Record the owner/on-call path for break-glass service-role intervention

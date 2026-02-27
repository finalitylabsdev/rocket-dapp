# Auction-Tick Deployment Runbook

> Last updated: 2026-02-27

## Overview

`auction-tick` is a Supabase Edge Function that drives the Nebula Bids round lifecycle. It is the scheduler primitive that transitions rounds between submission, bidding, finalization, and start-of-new-round states.

It does not poll or run a loop. It must be called externally on a cron schedule.

## What auction-tick does

Each invocation performs three passes in order:

1. **Transition** — Find rounds in `accepting_submissions` where `submission_ends_at <= now()`. Call `transition_auction_to_bidding(round_id)` for each.
2. **Finalize** — Find rounds in `bidding` where `ends_at <= now()`. Call `finalize_auction(round_id)` for each.
3. **Start** — If no active round exists, call `start_auction_round()` to begin a new cycle.

All three passes run in a single invocation. The function is idempotent: calling it twice within the same state window produces the same result.

## Round timing

| Phase | Duration | Timestamp field |
|-------|----------|-----------------|
| Submissions | 30 minutes | `submission_ends_at` |
| Bidding | 3.5 hours | `ends_at` |
| **Total round** | **4 hours** | — |

The scheduler cron cadence does **not** determine when phases change. The database timestamps do. The cron only needs to call `auction-tick` often enough that phase transitions happen promptly after the timestamp passes.

## Required secrets

| Secret | Purpose | Where to set |
|--------|---------|--------------|
| `SUPABASE_URL` | Supabase project URL | Auto-injected by Supabase Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin RPC calls | Auto-injected by Supabase Edge Functions |
| `AUCTION_TICK_SERVICE_ROLE_FALLBACK` | Optional secondary bearer token for external callers | Set via `supabase secrets set` |

### Notes on secrets

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available to Edge Functions deployed to a Supabase project. You do not need to set them manually.
- `AUCTION_TICK_SERVICE_ROLE_FALLBACK` is optional. If set, it allows an external cron caller to authenticate with a separate token instead of the service role key. This is useful when the cron caller should not hold the full service role key.
- If neither the service role key nor the fallback token matches the request's Bearer token, the function returns `401`.

### Setting the fallback secret

```bash
supabase secrets set AUCTION_TICK_SERVICE_ROLE_FALLBACK=<your-token>
```

Generate a strong random token:

```bash
openssl rand -base64 32
```

## Deployment

### Deploy the Edge Function

```bash
supabase functions deploy auction-tick --no-verify-jwt
```

`--no-verify-jwt` is required because the function handles its own bearer token validation instead of relying on Supabase's default JWT check.

### Verify deployment

```bash
curl -s -X POST \
  https://<project-ref>.supabase.co/functions/v1/auction-tick \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json"
```

Expected response:

```json
{
  "status": "ok",
  "transitioned": [],
  "finalized": [],
  "started": { "status": "round_started", "round_id": 1, ... }
}
```

## Cron configuration

### Option A: Supabase pg_cron (recommended)

Use the `pg_cron` extension to call the Edge Function from inside the database:

```sql
SELECT cron.schedule(
  'auction-tick',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := '<SUPABASE_URL>/functions/v1/auction-tick',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

This runs every 5 minutes. Adjust cadence based on your latency tolerance for phase transitions.

### Option B: External cron service

Use any external scheduler (GitHub Actions, Vercel Crons, CloudWatch Events, etc.) to POST to:

```
POST https://<project-ref>.supabase.co/functions/v1/auction-tick
Authorization: Bearer <AUCTION_TICK_SERVICE_ROLE_FALLBACK or SERVICE_ROLE_KEY>
Content-Type: application/json
```

### Cron cadence guidance

| Cadence | Max transition delay | Recommendation |
|---------|---------------------|----------------|
| Every 1 minute | 1 minute | Production ideal |
| Every 5 minutes | 5 minutes | Acceptable for launch |
| Every 15 minutes | 15 minutes | Too slow for 30-minute submission windows |

The function enforces a 30-second rate limit between invocations. Calling more frequently than every 30 seconds returns `429`.

## Rate limiting

The function maintains an in-memory timestamp of the last invocation. If called within 30 seconds of the previous call, it returns:

```json
{ "error": "Rate limit exceeded." }
```

Status code: `429`

This prevents accidental double-invocations from aggressive cron schedules, but does not persist across function cold starts. In practice, a 5-minute cron will never hit this limit.

## Monitoring

### What to monitor

1. **Cron execution** — Verify the cron job runs on schedule. If using pg_cron, check `cron.job_run_details`.
2. **HTTP response codes** — `200` is normal. `401` means bad auth. `429` means rate limited. `500` means an RPC failed.
3. **Overdue rounds** — Query `auction_round_diagnostics` (service role) for rounds where health = `'overdue'`. These are rounds that should have transitioned but haven't.
4. **Stuck finalizing** — Query `auction_scheduler_health` for `stuck_finalizing > 0`. This means a round entered finalizing state but never completed.
5. **Empty rounds** — A high ratio of `no_submissions` rounds may indicate low user activity or a submission UX issue.

### Diagnostic views

The `20260228130000_add_auction_ops_diagnostics.sql` migration adds three service-role-only views:

| View | Purpose |
|------|---------|
| `auction_round_diagnostics` | Full lifecycle state for every round: health, timing, submission/bid counts |
| `flux_ledger_reconciliation` | Balance vs ledger sum per wallet. Drift indicates ledger integrity issues. |
| `auction_scheduler_health` | Summary counts: active, overdue, stuck, completed, empty rounds |

Query them via the Supabase client with the service role key:

```bash
# Check scheduler health
curl -s \
  "https://<project-ref>.supabase.co/rest/v1/auction_scheduler_health?select=*" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

### Alert thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Overdue rounds | >= 1 | >= 1 for > 15 minutes |
| Stuck finalizing | >= 1 | >= 1 for > 5 minutes |
| Wallets with drift | >= 1 | Any |
| Empty rounds (consecutive) | >= 3 | >= 6 |

## Failure modes and recovery

### Scheduler stops running

**Symptom:** Rounds stay in `accepting_submissions` or `bidding` past their timestamps.

**Recovery:** Invoke `auction-tick` manually. It will process all overdue transitions in one call.

```bash
curl -X POST \
  https://<project-ref>.supabase.co/functions/v1/auction-tick \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
```

### Finalization partially fails

**Symptom:** A round is stuck in `finalizing` status.

**Recovery:** The RPCs are written to be re-runnable. Call `finalize_auction(round_id)` directly via the service role:

```bash
curl -X POST \
  "https://<project-ref>.supabase.co/rest/v1/rpc/finalize_auction" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"p_round_id": <round_id>}'
```

### Duplicate round started

**Symptom:** Two rounds appear active simultaneously.

**Root cause:** Should not happen — `start_auction_round()` checks for existing active rounds. If it does happen, the older round's timestamps will expire first and be processed normally.

**Recovery:** Let the scheduler process both rounds naturally. The older round will finalize first.

### Locked parts not unlocked after round

**Symptom:** A user's part remains `is_locked = true` after the round it was submitted to has completed.

**Root cause:** The part was submitted but not selected, and the unlock step in `transition_auction_to_bidding` or `finalize_auction` did not cover it.

**Recovery:** Manual unlock via service role:

```sql
UPDATE inventory_parts
SET is_locked = false, updated_at = now()
WHERE id = '<part_id>' AND is_locked = true;
```

### FLUX balance drift

**Symptom:** `flux_ledger_reconciliation` shows `has_drift = true` for a wallet.

**Root cause:** A balance update did not match a corresponding ledger entry (or vice versa).

**Recovery:** Investigate the ledger entries for the affected wallet. If the ledger is correct, adjust the balance:

```sql
UPDATE wallet_flux_balances
SET available_balance = (
  SELECT COALESCE(SUM(amount_flux), 0)
  FROM flux_ledger_entries
  WHERE wallet_address = '<wallet>'
), updated_at = now()
WHERE wallet_address = '<wallet>';
```

## Pre-launch checklist

- [ ] Edge Function deployed: `supabase functions deploy auction-tick --no-verify-jwt`
- [ ] Fallback secret set (if using external cron): `supabase secrets set AUCTION_TICK_SERVICE_ROLE_FALLBACK=...`
- [ ] Cron configured (pg_cron or external) at 5-minute cadence or better
- [ ] Manual invocation tested successfully
- [ ] Diagnostic views migration applied: `20260228130000_add_auction_ops_diagnostics.sql`
- [ ] Alert thresholds configured for overdue rounds and stuck finalization
- [ ] Verified that `start_auction_round()` creates a round when invoked with no active rounds
- [ ] Verified that `transition_auction_to_bidding()` selects the best submission and unlocks the rest
- [ ] Verified that `finalize_auction()` settles winner, refunds losers, transfers part, pays seller

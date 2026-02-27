# verify-eth-lock

Verifies ETH lock transactions server-side and updates `public.eth_lock_submissions` status.

## Required secrets

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ETH_RPC_URL`
- `ETH_LOCK_RECIPIENT`

## Optional secrets

- `ETH_LOCK_AMOUNT_WEI` (default: `1000000000000000`, i.e. `0.001 ETH`)
- `ETH_LOCK_MIN_CONFIRMATIONS` (default: `1`)
- `ETH_LOCK_VERIFY_POLL_ATTEMPTS` (default: `8`)
- `ETH_LOCK_VERIFY_POLL_INTERVAL_MS` (default: `3000`)

## Deploy

```bash
supabase functions deploy verify-eth-lock
```

Set secrets:

```bash
supabase secrets set ETH_RPC_URL=... ETH_LOCK_RECIPIENT=0x8c80dD6327Ed5889Be09e77F9CA49D5Bad2B0Bf7
```

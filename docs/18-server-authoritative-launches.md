# 18 — Server-Authoritative Rocket Launches

## Context

The Rocket Lab page (`src/pages/RocketLabPage.tsx`) previously ran launches as
client-side simulations. Scores were computed locally via
`simulateRocketLabLaunch()` in `rocketLabAdapter.ts` and stored in
localStorage.

Every other game action (Flux balance, inventory, auctions) is already
server-authoritative via Supabase RPCs. This change closes the gap by making
launches server-authoritative too, and integrates cumulative GravScore into the
Cosmic Jackpot leaderboard.

## Design

### Launch fee

Each launch costs Flux. The fee is 10 % of the total `part_value` of the
eight equipped parts. This can never exceed the equipment cost — it is always a
fraction.

```
launch_fee = round(sum(part_value) * 0.1, 2)
```

The constant `LAUNCH_FEE_RATE = 0.1` lives in `src/config/spec.ts` and is used
client-side only for the preview display. The server computes the fee
independently.

### Scoring formula

The server replicates the exact logic from `computeRocketLabMetrics()` and
`simulateRocketLabLaunch()` in PL/pgSQL:

1. Select the best unlocked part per slot using `getPartRank()`.
2. Derive stability, fuel efficiency, launch power, grav score base, and win
   probability identically to the TypeScript version.
3. Pick a random simulation event (5 events, uniform distribution).
4. Compute `base_multiplier`, `final_multiplier`, `grav_score`, and `power`.

### No cooldown

Players may launch as often as they can afford the fee.

### Cumulative GravScore leaderboard

The Cosmic Jackpot snapshot RPC is updated to rank wallets by
`cumulative_grav_score` (sum of all `grav_score` values from
`rocket_launches`) instead of activity event counts.

## Schema

### `rocket_launches` table

| Column | Type | Notes |
|--------|------|-------|
| id | bigint (PK) | generated always as identity |
| wallet_address | text (FK) | |
| auth_user_id | uuid (FK) | |
| idempotency_key | text (unique when non-null) | |
| slot_part_* (×8) | uuid (FK → inventory_parts) | one per rocket section |
| stability | smallint | |
| fuel_efficiency | smallint | |
| launch_power | smallint | |
| grav_score_base | integer | |
| win_probability | smallint | |
| base_multiplier | numeric(8,4) | |
| final_multiplier | numeric(8,4) | |
| grav_score | integer | |
| power_result | smallint | |
| random_seed | double precision | |
| event_index | smallint | |
| event_bonus | text | |
| launch_fee_flux | numeric(18,2) | |
| ledger_entry_id | bigint (FK) | |
| chain_status | text | default 'offchain' |
| chain_tx_hash | text | nullable |
| chain_block_number | bigint | nullable |
| reconciled_at | timestamptz | nullable |
| created_at | timestamptz | default now() |

### RPCs

- `launch_rocket(p_wallet_address, p_idempotency_key)` → JSONB
- `get_launch_history(p_wallet_address, p_limit)` → JSONB

### Updated RPCs

- `get_cosmic_jackpot_snapshot()` — ranks by cumulative GravScore, includes
  `cumulative_grav_score` and `launch_count` per entry, plus
  `total_grav_score` and `total_launches` in summary.

## Files changed

| Action | File |
|--------|------|
| Create | `docs/18-server-authoritative-launches.md` |
| Create | `supabase/migrations/20260228013035_add_server_authoritative_launches.sql` |
| Create | `src/lib/rocketLaunch.ts` |
| Modify | `src/config/spec.ts` |
| Modify | `src/components/lab/LaunchSequence.tsx` |
| Modify | `src/components/lab/StatsPanel.tsx` |
| Modify | `src/pages/RocketLabPage.tsx` |
| Modify | `src/pages/LeaderboardPage.tsx` |

---

## Supabase MCP Handoff

**For an LLM with Supabase MCP access.** This branch already includes the
client-side changes and the TypeScript build passes. The remaining work is
applying the migration SQL to the live Supabase project and verifying the
database objects.

### What to do

1. **Apply the migration.** The complete SQL is in:

   ```
   supabase/migrations/20260228013035_add_server_authoritative_launches.sql
   ```

   Execute the full file against the project database. It is a single
   migration that creates everything in order. It is safe to run — it uses
   `IF NOT EXISTS`, `DROP … IF EXISTS`, and `CREATE OR REPLACE` throughout.

2. **Verify the table was created.** Confirm `public.rocket_launches` exists
   with the expected columns. Key columns:

   - `id` (bigint, PK, identity)
   - `wallet_address` (text, FK → wallet_registry)
   - `auth_user_id` (uuid, FK → auth.users)
   - `idempotency_key` (text, unique partial index where not null)
   - 8 slot columns: `slot_core_engine`, `slot_wing_plate`, `slot_fuel_cell`,
     `slot_navigation_module`, `slot_payload_bay`, `slot_thruster_array`,
     `slot_propulsion_cables`, `slot_shielding` (all uuid, FK → inventory_parts)
   - Scoring: `stability`, `fuel_efficiency`, `launch_power`,
     `grav_score_base`, `win_probability`, `base_multiplier`,
     `final_multiplier`, `grav_score`, `power_result`
   - RNG: `random_seed`, `event_index`, `event_bonus`
   - Fee: `launch_fee_flux`, `ledger_entry_id`
   - Chain cutover: `chain_status`, `chain_tx_hash`, `chain_block_number`,
     `reconciled_at`
   - `created_at`

3. **Verify RLS.** The table should have RLS enabled with one policy:
   - `"Users can view own launches"` — `FOR SELECT TO authenticated USING (auth_user_id = auth.uid())`
   - No INSERT/UPDATE/DELETE policies (RPCs are `SECURITY DEFINER`)

4. **Verify indexes.** Two custom indexes:
   - `rocket_launches_idempotency_key_idx` — unique on `idempotency_key` where not null
   - `rocket_launches_wallet_address_idx` — on `(wallet_address, created_at DESC)`

5. **Verify RPCs exist and have correct grants.**

   | Function | Signature | Grants |
   |----------|-----------|--------|
   | `launch_rocket` | `(p_wallet_address text, p_idempotency_key text DEFAULT NULL) → jsonb` | `authenticated` only |
   | `get_launch_history` | `(p_wallet_address text, p_limit integer DEFAULT 20) → jsonb` | `authenticated` only |
   | `get_cosmic_jackpot_snapshot` | `() → jsonb` | `anon, authenticated` |

6. **Verify the heartbeat trigger.** Confirm
   `touch_cosmic_jackpot_updates_from_rocket_launches` exists on
   `public.rocket_launches`, AFTER INSERT OR UPDATE OR DELETE, calling
   `public.touch_cosmic_jackpot_updates()`.

7. **Smoke test `launch_rocket`.** If the project has test wallets with 8
   unlocked inventory parts across all 8 slots and a positive Flux balance:

   ```sql
   SELECT public.launch_rocket('0x<test_wallet>', 'test-key-1');
   ```

   Expected return shape:
   ```json
   {
     "launch_id": 1,
     "grav_score": <integer>,
     "event_bonus": "<string>",
     "final_multiplier": <numeric>,
     "power": <smallint>,
     "launch_fee_flux": <numeric>,
     "balance": { "wallet_address": "...", "available_balance": ..., ... }
   }
   ```

   Verify:
   - A row now exists in `rocket_launches`
   - A row was inserted in `flux_ledger_entries` with `payload->>'reason' = 'rocket_launch_fee'`
   - `wallet_flux_balances.available_balance` decreased by `launch_fee_flux`
   - Calling again with the same idempotency key returns the same result
     without inserting a second row

8. **Smoke test `get_launch_history`.**
   ```sql
   SELECT public.get_launch_history('0x<test_wallet>');
   ```
   Should return a JSON array with the launch from step 7.

9. **Smoke test updated `get_cosmic_jackpot_snapshot`.**
   ```sql
   SELECT public.get_cosmic_jackpot_snapshot();
   ```
   Confirm:
   - The summary now includes `total_grav_score` and `total_launches`
   - Each entry includes `cumulative_grav_score` and `launch_count`
   - Entries are ranked by `cumulative_grav_score DESC` (not `activity_events`)

### Existing tables the migration depends on

These must already exist in the project (they were created by earlier
migrations):

- `public.wallet_registry` — has `wallet_address` text PK
- `auth.users` — Supabase auth
- `public.inventory_parts` — has `id` uuid PK, `wallet_address`, `variant_id`,
  `rarity_tier_id`, `attr1`, `attr2`, `attr3`, `part_value`, `is_locked`,
  `created_at`
- `public.part_variants` — has `id`, `section_id`
- `public.rocket_sections` — has `id`, `key` (e.g. `'coreEngine'`)
- `public.flux_ledger_entries` — has `id` bigint PK, `wallet_address`,
  `auth_user_id`, `entry_type`, `amount_flux`, `settlement_kind`,
  `settlement_status`, `payload`, `idempotency_key`
- `public.wallet_flux_balances` — has `wallet_address`, `available_balance`,
  `lifetime_spent`, `updated_at`
- `public.cosmic_jackpot_updates` — singleton heartbeat table
- `public.touch_cosmic_jackpot_updates()` — trigger function
- `public.resolve_authenticated_wallet(text)` — returns `(auth_user_id, wallet_address)`
- `public.ensure_wallet_flux_balance_row(text, uuid, numeric, timestamptz, text)` — upserts balance row
- `public.app_logs`, `public.eth_lock_submissions`, `public.auction_submissions`,
  `public.auction_bids` — used by the updated jackpot snapshot query

### Error cases to test (if possible)

| Scenario | Expected |
|----------|----------|
| Wallet missing a slot (e.g. no unlocked `coreEngine` part) | `RAISE EXCEPTION 'missing part for slot: coreEngine'` |
| Insufficient Flux balance | `RAISE EXCEPTION 'insufficient flux balance'` |
| Duplicate idempotency key | Returns cached result, no double-debit |
| Unauthenticated call | Rejected by `resolve_authenticated_wallet` |

### What NOT to do

- Do not make any further client-side changes as part of this handoff — this
  branch already includes them and the TypeScript build passes.
- Do not change the migration SQL — apply it as-is. If it fails, report the
  exact error so it can be diagnosed.

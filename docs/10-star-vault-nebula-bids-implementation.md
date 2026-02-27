# Star Vault & Nebula Bids — Database-Driven Implementation Plan

> **Version:** 1.0
> **Date:** 2026-02-27
> **Scope:** Migrate Star Vault (Mystery Box) and Nebula Bids (Auction) from hardcoded client-side data to a fully Supabase-backed architecture

## Context

The Star Vault (Mystery Box) page currently uses hardcoded client-side data for box tiers, drop tables, part names, and RNG. The spec (docs 04, 05, 06) requires 64 named part variants (8 sections × 8 each), 3 individual attributes per part, a Part Value formula, and an entire Nebula Bids auction system — none of which are implemented end-to-end in the current product. This plan migrates all game logic to server-side Supabase RPCs, adds the missing part catalog, and builds the auction system from scratch.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rarity visual config (colors, glows) | **Database-driven** | Stored in `rarity_tiers` table so changes don't require a deploy |
| Auction scheduler | **Edge Function + Cron** | `supabase/functions/auction-tick/` called on a schedule, follows existing `verify-eth-lock` pattern |
| Legacy localStorage inventory | **Fresh start** | Old parts are ignored; users begin fresh with server-backed inventory |
| Inventory + FLUX authority | **Supabase is authoritative until on-chain settlement exists** | One canonical source of truth now; later the blockchain becomes authoritative and Supabase mirrors confirmed settlements |
| Client-side ownership | **`GameState` remains the single UI cache, but only mirrors server snapshots** | Avoid duplicate caches (`GameState` vs `useInventory`) and keep navbar / page balance displays in sync |
| Auction phase split | **Explicit `submission_ends_at` column; 30m submissions + 3h30m bidding** | Scheduler transitions become deterministic instead of being hidden in cron timing |
| Star Vault box pricing | **Database-driven; retire runtime client scaling for this flow** | Avoid split authority between seeded DB prices and `VITE_SPEC_BOX_PRICE_MULTIPLIER` |

***

## Critical Files — Patterns to Follow

| File | Role |
|------|------|
| `supabase/migrations/20260227153000_add_flux_faucet_ledger.sql` | Pattern for RPCs (SECURITY DEFINER, `resolve_authenticated_wallet`, ledger entries, REVOKE/GRANT) |
| `src/lib/flux.ts` | Pattern for client service modules (`assertSupabaseConfigured()`, RPC calls, error handling, `normalizeRow()`) |
| `src/hooks/useEthLock.ts` | Pattern for data hooks (realtime subscriptions via `postgres_changes`, loading/error states, polling) |
| `src/pages/DexPage.tsx` | Pattern for tab switcher UI (`useState`, flex button row, conditional rendering) |
| `src/components/mystery/BoxSection.tsx` | Primary refactor target — remove hardcoded data, wire to RPCs |
| `src/context/GameState.tsx` | Transition inventory from localStorage to server-backed |
| `src/types/domain.ts` | Extend `InventoryPart` with attributes, add auction types |
| `src/config/spec.ts` | Already has `AUCTION_ROUND_SECONDS`, `AUCTION_MIN_INCREMENT_BPS`, `AUCTION_MIN_RARITY_TIER`; add `AUCTION_SUBMISSION_WINDOW_SECONDS = 1800` |
| `src/components/brand/RarityBadge.tsx` | Currently has hardcoded `RARITY_CONFIG` — will consume from database |
| `docs/05-app_overview.md` | Canonical spec for all 64 part names, rarity tiers, auction rules (sections 3.1–3.2) |
| `supabase/functions/verify-eth-lock/index.ts` | Pattern for Edge Functions (JWT validation, service role key, rate limiting) |

***

## Phase 1: Database — Catalog & Config Tables

**Migration:** `supabase/migrations/20260228100000_add_star_vault_catalog.sql`

These are read-only reference tables. They store the 64 part variants, 8 rarity tiers, 8 box definitions, and the drop-weight tables. They are seeded in the same migration.

### Table 1: `rarity_tiers`

Replaces hardcoded `RARITY_MULTIPLIER`, `RARITY_BOX_PRICE_FLUX` (from `src/config/spec.ts`) and `RARITY_CONFIG` (from `src/components/brand/RarityBadge.tsx`). All display config is database-driven.

For Star Vault, `VITE_SPEC_BOX_PRICE_MULTIPLIER` stops applying at runtime once this lands. If a local fast-economy mode is still needed, use a local-only seed override / alternate seed data instead of scaling prices in the client.

```sql
CREATE TABLE IF NOT EXISTS rarity_tiers (
  id smallint PRIMARY KEY,                        -- 1-8
  name text NOT NULL UNIQUE,                      -- 'Common', 'Uncommon', etc.
  multiplier numeric(4,2) NOT NULL,               -- 1.00, 1.25, 1.60, etc.
  base_box_price_flux numeric(38,18) NOT NULL,    -- 10, 25, 50, etc.
  approximate_drop_rate numeric(5,2) NOT NULL,    -- 35.00, 25.00, etc.
  color text NOT NULL,                            -- '#6B7280'
  bg text NOT NULL,                               -- 'rgba(107,114,128,0.12)'
  border text NOT NULL,                           -- 'rgba(107,114,128,0.3)'
  glow text NOT NULL,                             -- 'rgba(107,114,128,0)'
  intensity smallint NOT NULL DEFAULT 0,          -- 0-7
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Seed data** (8 rows merging `RARITY_CONFIG` + `RARITY_MULTIPLIER` + `RARITY_BOX_PRICE_FLUX`):

```sql
INSERT INTO rarity_tiers (id, name, multiplier, base_box_price_flux, approximate_drop_rate, color, bg, border, glow, intensity) VALUES
  (1, 'Common',    1.00,  10, 35.00, '#6B7280', 'rgba(107,114,128,0.12)', 'rgba(107,114,128,0.3)',  'rgba(107,114,128,0)',    0),
  (2, 'Uncommon',  1.25,  25, 25.00, '#22C55E', 'rgba(34,197,94,0.12)',   'rgba(34,197,94,0.3)',    'rgba(34,197,94,0.15)',   1),
  (3, 'Rare',      1.60,  50, 18.00, '#3B82F6', 'rgba(59,130,246,0.12)',  'rgba(59,130,246,0.3)',   'rgba(59,130,246,0.2)',   2),
  (4, 'Epic',      2.00, 100, 10.00, '#8B5CF6', 'rgba(139,92,246,0.12)',  'rgba(139,92,246,0.3)',   'rgba(139,92,246,0.25)', 3),
  (5, 'Legendary', 2.50, 200,  6.00, '#F59E0B', 'rgba(245,158,11,0.12)', 'rgba(245,158,11,0.3)',  'rgba(245,158,11,0.3)',  4),
  (6, 'Mythic',    3.20, 350,  3.50, '#EF4444', 'rgba(239,68,68,0.12)',  'rgba(239,68,68,0.3)',   'rgba(239,68,68,0.35)',  5),
  (7, 'Celestial', 4.00, 500,  1.80, '#06B6D4', 'rgba(6,182,212,0.12)',  'rgba(6,182,212,0.3)',   'rgba(6,182,212,0.4)',   6),
  (8, 'Quantum',   5.00, 750,  0.70, '#E8ECF4', 'rgba(232,236,244,0.12)','rgba(232,236,244,0.3)', 'rgba(232,236,244,0.45)',7);
```

### Table 2: `rocket_sections`

Replaces the flat `ROCKET_SECTIONS` array in `src/types/domain.ts`. Adds per-section attribute labels from spec docs 04/05 sections 7.1–7.8.

```sql
CREATE TABLE IF NOT EXISTS rocket_sections (
  id smallint PRIMARY KEY,                        -- 1-8
  key text NOT NULL UNIQUE,                       -- 'coreEngine', 'wingPlate', etc.
  display_name text NOT NULL,                     -- 'Core Engine', 'Wing-Plate', etc.
  description text,                               -- flavor text from spec
  attr1_name text NOT NULL,                       -- 'Heat Flux', 'Aerodynamic Drag', etc.
  attr2_name text NOT NULL,                       -- 'Thrust Efficiency', 'Surface Area', etc.
  attr3_name text NOT NULL,                       -- 'Mass', 'Durability', etc.
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Seed data:**

```sql
INSERT INTO rocket_sections (id, key, display_name, description, attr1_name, attr2_name, attr3_name) VALUES
  (1, 'coreEngine',       'Core Engine',        'The heart of the ship. Determines raw lift-off capability and thermal tolerance.',    'Heat Flux',            'Thrust Efficiency', 'Mass'),
  (2, 'wingPlate',        'Wing-Plate',         'Aerodynamic surfaces that govern flight stability and drag.',                        'Aerodynamic Drag',     'Surface Area',      'Durability'),
  (3, 'fuelCell',         'Fuel Cell',          'Energy storage that determines range and weight efficiency.',                         'Fuel Capacity',        'Energy Density',    'Weight'),
  (4, 'navigationModule', 'Navigation Module',  'On-board intelligence for course-keeping and decision-making.',                       'Accuracy',             'Processing Power',  'Reliability'),
  (5, 'payloadBay',       'Payload Bay',        'Cargo management — determines what your rocket can carry and how securely.',          'Cargo Capacity',       'Securing Strength', 'Modularity'),
  (6, 'thrusterArray',    'Thruster Array',     'Secondary propulsion — sustained thrust, fuel cycling, and failsafe systems.',        'Ion Output',           'Fuel Efficiency',   'Redundancy'),
  (7, 'propulsionCables', 'Propulsion Cables',  'Power transmission network — the nervous system of the rocket.',                      'Conductivity',         'Flexibility',       'Insulation'),
  (8, 'shielding',        'Shielding',          'Defensive layer — protects the rocket from cosmic hazards.',                          'Radiation Resistance', 'Impact Resistance', 'Weight');
```

### Table 3: `part_variants`

The 64 named part variants (8 sections × 8 variants each). Replaces the single-name `PART_NAMES` record in `BoxSection.tsx`.

```sql
CREATE TABLE IF NOT EXISTS part_variants (
  id smallint PRIMARY KEY,                        -- 1-64
  section_id smallint NOT NULL REFERENCES rocket_sections(id),
  variant_index smallint NOT NULL CHECK (variant_index BETWEEN 1 AND 8),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, variant_index)
);
```

**Seed data** (64 rows from spec docs 04 sections 7.1–7.8):

```sql
-- Section 1: Core Engine
INSERT INTO part_variants (id, section_id, variant_index, name) VALUES
  ( 1, 1, 1, 'Pulse Engine'),
  ( 2, 1, 2, 'Nova Thruster'),
  ( 3, 1, 3, 'Quantum Core'),
  ( 4, 1, 4, 'Radiant Combustor'),
  ( 5, 1, 5, 'Stellar Pulse'),
  ( 6, 1, 6, 'Plasma Injector'),
  ( 7, 1, 7, 'Ion Driver'),
  ( 8, 1, 8, 'Hyper-Drive');

-- Section 2: Wing-Plate
INSERT INTO part_variants (id, section_id, variant_index, name) VALUES
  ( 9, 2, 1, 'Solar Wings'),
  (10, 2, 2, 'Nebula Fins'),
  (11, 2, 3, 'Aerogel Skins'),
  (12, 2, 4, 'Comet Span'),
  (13, 2, 5, 'Meteor Brakes'),
  (14, 2, 6, 'Photon Sails'),
  (15, 2, 7, 'Lumen Vents'),
  (16, 2, 8, 'Void Glides');

-- Section 3: Fuel Cell
INSERT INTO part_variants (id, section_id, variant_index, name) VALUES
  (17, 3, 1, 'Nebula Tank'),
  (18, 3, 2, 'Void Reservoir'),
  (19, 3, 3, 'Star-Fuel Cell'),
  (20, 3, 4, 'Solar Cell Bank'),
  (21, 3, 5, 'Photon Reactor'),
  (22, 3, 6, 'Dark-Matter Cell'),
  (23, 3, 7, 'Cryo-Fuel Capsule'),
  (24, 3, 8, 'Graviton Storage');

-- Section 4: Navigation Module
INSERT INTO part_variants (id, section_id, variant_index, name) VALUES
  (25, 4, 1, 'Astro-Gyro'),
  (26, 4, 2, 'Photon Navigator'),
  (27, 4, 3, 'Quantum GPS'),
  (28, 4, 4, 'Singularity Clock'),
  (29, 4, 5, 'Eclipse Tracker'),
  (30, 4, 6, 'Stellar Atlas'),
  (31, 4, 7, 'Chrono-Scope'),
  (32, 4, 8, 'Deep-Space Comp');

-- Section 5: Payload Bay
INSERT INTO part_variants (id, section_id, variant_index, name) VALUES
  (33, 5, 1, 'Cargo Nebula'),
  (34, 5, 2, 'Quantum Cargo'),
  (35, 5, 3, 'Stellar Freight'),
  (36, 5, 4, 'Black-Hole Bay'),
  (37, 5, 5, 'Pulsar Module'),
  (38, 5, 6, 'Interstellar Hold'),
  (39, 5, 7, 'Orbital Storage'),
  (40, 5, 8, 'Modular Crate');

-- Section 6: Thruster Array
INSERT INTO part_variants (id, section_id, variant_index, name) VALUES
  (41, 6, 1, 'Ion Array'),
  (42, 6, 2, 'Hyper-Ion Pack'),
  (43, 6, 3, 'Graviton Thrusters'),
  (44, 6, 4, 'Pulsar Blades'),
  (45, 6, 5, 'Dark-Matter Flail'),
  (46, 6, 6, 'Solar-Blade Pack'),
  (47, 6, 7, 'Lumen Cluster'),
  (48, 6, 8, 'Void Engine');

-- Section 7: Propulsion Cables
INSERT INTO part_variants (id, section_id, variant_index, name) VALUES
  (49, 7, 1, 'Quantum Wire'),
  (50, 7, 2, 'Star-Fiber'),
  (51, 7, 3, 'Lumen Conduct'),
  (52, 7, 4, 'Photon Cable'),
  (53, 7, 5, 'Solar-Weld'),
  (54, 7, 6, 'Eclipse Rope'),
  (55, 7, 7, 'Photon Thread'),
  (56, 7, 8, 'Dark-Fiber');

-- Section 8: Shielding
INSERT INTO part_variants (id, section_id, variant_index, name) VALUES
  (57, 8, 1, 'Event-Horizon Shield'),
  (58, 8, 2, 'Radiation Mantle'),
  (59, 8, 3, 'Impact Field'),
  (60, 8, 4, 'Graviton Barrier'),
  (61, 8, 5, 'Nebula Shell'),
  (62, 8, 6, 'Photon Armor'),
  (63, 8, 7, 'Singularity Plating'),
  (64, 8, 8, 'Void Barrier');
```

### Table 4: `box_tiers`

Replaces the hardcoded `TIERS` array in `BoxSection.tsx`.

```sql
CREATE TABLE IF NOT EXISTS box_tiers (
  id text PRIMARY KEY,                            -- 'common', 'uncommon', etc.
  rarity_tier_id smallint NOT NULL REFERENCES rarity_tiers(id),
  name text NOT NULL,                             -- 'Void Crate', 'Stellar Cache', etc.
  tagline text NOT NULL,                          -- 'The starting point', etc.
  rewards_description text[] NOT NULL,            -- Array of reward strings
  possible_stats jsonb NOT NULL DEFAULT '[]',     -- [{label, value}, ...]
  sort_order smallint NOT NULL,                   -- Display ordering
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Seed data:**

```sql
INSERT INTO box_tiers (id, rarity_tier_id, name, tagline, rewards_description, possible_stats, sort_order) VALUES
  ('common',    1, 'Void Crate',         'The starting point',          ARRAY['Common part (×1.0)', 'Uncommon part (×1.25)', 'Rare chance'],           '[{"label":"Best Drop","value":"Rare"},{"label":"Win Chance","value":"~18%"}]'::jsonb, 1),
  ('uncommon',  2, 'Stellar Cache',      'Better odds, better loot',    ARRAY['Uncommon part (×1.25)', 'Rare chance', 'Epic chance'],                  '[{"label":"Best Drop","value":"Epic"},{"label":"Win Chance","value":"~10%"}]'::jsonb, 2),
  ('rare',      3, 'Star Vault Box',     'Rarity starts here',          ARRAY['Rare part (×1.6)', 'Epic chance', 'Legendary chance'],                  '[{"label":"Best Drop","value":"Legendary"},{"label":"Win Chance","value":"~6%"}]'::jsonb, 3),
  ('epic',      4, 'Astral Chest',       'Pulsing with energy',         ARRAY['Epic part (×2.0)', 'Legendary chance', 'Mythic chance'],                '[{"label":"Best Drop","value":"Mythic"},{"label":"Win Chance","value":"~3.5%"}]'::jsonb, 4),
  ('legendary', 5, 'Solaris Vault',      'Shimmer of gold',             ARRAY['Legendary part (×2.5)', 'Mythic chance', 'Celestial chance'],           '[{"label":"Best Drop","value":"Celestial"},{"label":"Win Chance","value":"~1.8%"}]'::jsonb, 5),
  ('mythic',    6, 'Nova Reliquary',     'Heat at the edge of chaos',   ARRAY['Mythic part (×3.2)', 'Celestial chance', 'Quantum chance'],             '[{"label":"Best Drop","value":"Quantum"},{"label":"Win Chance","value":"~0.7%"}]'::jsonb, 6),
  ('celestial', 7, 'Aurora Ark',         'Blue-fire premium crate',     ARRAY['Celestial part (×4.0)', 'High quantum chance'],                        '[{"label":"Best Drop","value":"Quantum"},{"label":"Win Chance","value":"~12%"}]'::jsonb, 7),
  ('quantum',   8, 'Prism Singularity',  'Top-tier reality split',      ARRAY['Quantum part (×5.0)', 'Celestial fallback'],                           '[{"label":"Best Drop","value":"Quantum"},{"label":"Win Chance","value":"~75%"}]'::jsonb, 8);
```

### Table 5: `box_drop_weights`

Replaces the `DROP_TABLES` object in `BoxSection.tsx`. Using separate rows per entry enables the `open_mystery_box` RPC to select a rarity using a single weighted-random SQL query.

```sql
CREATE TABLE IF NOT EXISTS box_drop_weights (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  box_tier_id text NOT NULL REFERENCES box_tiers(id),
  rarity_tier_id smallint NOT NULL REFERENCES rarity_tiers(id),
  weight smallint NOT NULL CHECK (weight > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (box_tier_id, rarity_tier_id)
);

CREATE INDEX IF NOT EXISTS box_drop_weights_tier_idx
  ON box_drop_weights (box_tier_id);
```

**Seed data** (maps current `DROP_TABLES` arrays to weights):

```sql
-- common: ['Common','Common','Uncommon','Uncommon','Rare']
INSERT INTO box_drop_weights (box_tier_id, rarity_tier_id, weight) VALUES
  ('common', 1, 2), ('common', 2, 2), ('common', 3, 1);

-- uncommon: ['Common','Uncommon','Uncommon','Rare','Rare','Epic']
INSERT INTO box_drop_weights (box_tier_id, rarity_tier_id, weight) VALUES
  ('uncommon', 1, 1), ('uncommon', 2, 2), ('uncommon', 3, 2), ('uncommon', 4, 1);

-- rare: ['Uncommon','Rare','Rare','Epic','Epic','Legendary']
INSERT INTO box_drop_weights (box_tier_id, rarity_tier_id, weight) VALUES
  ('rare', 2, 1), ('rare', 3, 2), ('rare', 4, 2), ('rare', 5, 1);

-- epic: ['Rare','Epic','Epic','Legendary','Legendary','Mythic']
INSERT INTO box_drop_weights (box_tier_id, rarity_tier_id, weight) VALUES
  ('epic', 3, 1), ('epic', 4, 2), ('epic', 5, 2), ('epic', 6, 1);

-- legendary: ['Epic','Legendary','Legendary','Mythic','Mythic','Celestial']
INSERT INTO box_drop_weights (box_tier_id, rarity_tier_id, weight) VALUES
  ('legendary', 4, 1), ('legendary', 5, 2), ('legendary', 6, 2), ('legendary', 7, 1);

-- mythic: ['Legendary','Mythic','Mythic','Celestial','Celestial','Quantum']
INSERT INTO box_drop_weights (box_tier_id, rarity_tier_id, weight) VALUES
  ('mythic', 5, 1), ('mythic', 6, 2), ('mythic', 7, 2), ('mythic', 8, 1);

-- celestial: ['Mythic','Celestial','Celestial','Quantum','Quantum']
INSERT INTO box_drop_weights (box_tier_id, rarity_tier_id, weight) VALUES
  ('celestial', 6, 1), ('celestial', 7, 2), ('celestial', 8, 2);

-- quantum: ['Celestial','Quantum','Quantum','Quantum']
INSERT INTO box_drop_weights (box_tier_id, rarity_tier_id, weight) VALUES
  ('quantum', 7, 1), ('quantum', 8, 3);
```

### Access Control for Catalog Tables

All five catalog tables are read-only reference data:

```sql
ALTER TABLE rarity_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocket_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_drop_weights ENABLE ROW LEVEL SECURITY;

-- Allow public read access; this data is non-sensitive and the current UI renders
-- Star Vault content before the wallet is connected.
CREATE POLICY "Allow public read access" ON rarity_tiers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read access" ON rocket_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read access" ON part_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read access" ON box_tiers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public read access" ON box_drop_weights FOR SELECT TO anon, authenticated USING (true);

-- Grant SELECT, revoke everything else
GRANT SELECT ON rarity_tiers TO anon, authenticated;
GRANT SELECT ON rocket_sections TO anon, authenticated;
GRANT SELECT ON part_variants TO anon, authenticated;
GRANT SELECT ON box_tiers TO anon, authenticated;
GRANT SELECT ON box_drop_weights TO anon, authenticated;
```

***

## Phase 2: Database — Inventory + Mystery Box RPC

**Migration:** `supabase/migrations/20260228110000_add_inventory_and_box_rpc.sql`

### Table: `inventory_parts`

Server-authoritative inventory. Replaces the localStorage `inventory: InventoryPart[]` in `src/context/GameState.tsx`.

```sql
CREATE TABLE IF NOT EXISTS inventory_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variant_id smallint NOT NULL REFERENCES part_variants(id),
  rarity_tier_id smallint NOT NULL REFERENCES rarity_tiers(id),
  attr1 smallint NOT NULL CHECK (attr1 BETWEEN 1 AND 100),
  attr2 smallint NOT NULL CHECK (attr2 BETWEEN 1 AND 100),
  attr3 smallint NOT NULL CHECK (attr3 BETWEEN 1 AND 100),
  part_value numeric(10,2) NOT NULL,              -- computed: (attr1+attr2+attr3) * multiplier
  source text NOT NULL DEFAULT 'mystery_box'
    CHECK (source IN ('mystery_box', 'auction_win', 'admin')),
  source_ref text,                                -- box_open ledger ID or auction ID
  is_equipped boolean NOT NULL DEFAULT false,
  equipped_section_id smallint REFERENCES rocket_sections(id),
  is_locked boolean NOT NULL DEFAULT false,       -- locked when submitted to auction
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_parts_wallet_idx
  ON inventory_parts (wallet_address, created_at DESC);

CREATE INDEX IF NOT EXISTS inventory_parts_auth_user_idx
  ON inventory_parts (auth_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS inventory_parts_rarity_idx
  ON inventory_parts (rarity_tier_id);
```

### RLS for `inventory_parts`

Users can read their own inventory directly (for the inventory panel), but all mutations go through SECURITY DEFINER RPCs:

```sql
ALTER TABLE inventory_parts ENABLE ROW LEVEL SECURITY;

-- Authenticated users can SELECT their own parts
CREATE POLICY "Users read own inventory"
  ON inventory_parts
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Block direct INSERT/UPDATE/DELETE
REVOKE INSERT, UPDATE, DELETE ON inventory_parts FROM anon, authenticated;
GRANT SELECT ON inventory_parts TO authenticated;
```

### RPC: `open_mystery_box`

Atomically validates balance, deducts Flux, generates a random part server-side, inserts it into inventory, and returns the result. Replaces the client-side `randomPart()` function in `BoxSection.tsx`.

```sql
CREATE OR REPLACE FUNCTION public.open_mystery_box(
  p_wallet_address text,
  p_box_tier_id text,
  p_whitelist_bonus_amount numeric DEFAULT 0,
  p_client_timestamp timestamptz DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_balance wallet_flux_balances;
  v_box box_tiers;
  v_price_rarity rarity_tiers;
  v_drop_rarity rarity_tiers;
  v_price numeric(38,18);
  v_new_balance numeric(38,18);
  v_section rocket_sections;
  v_variant part_variants;
  v_attr1 smallint;
  v_attr2 smallint;
  v_attr3 smallint;
  v_part_value numeric(10,2);
  v_part_id uuid;
  v_ledger_id bigint;
  v_total_weight integer;
  v_roll numeric;
BEGIN
  -- 1. Authenticate wallet (reuses existing helper)
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  -- 2. Validate box tier exists
  SELECT * INTO v_box
  FROM box_tiers
  WHERE id = p_box_tier_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid box tier: %', p_box_tier_id;
  END IF;

  -- 3. Get rarity tier to determine price
  SELECT * INTO v_price_rarity
  FROM rarity_tiers
  WHERE id = v_box.rarity_tier_id;

  v_price := v_price_rarity.base_box_price_flux;

  -- 4. Ensure balance row exists, apply whitelist bonus if eligible
  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet, v_user_id, p_whitelist_bonus_amount, p_client_timestamp, p_user_agent
  );

  -- 5. Check sufficient balance
  v_new_balance := v_balance.available_balance - v_price;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient flux balance';
  END IF;

  -- 6. Weighted random rarity selection from drop table
  -- Roll once across the total weight, then take the first cumulative bucket.
  SELECT COALESCE(SUM(weight), 0)
  INTO v_total_weight
  FROM box_drop_weights
  WHERE box_tier_id = p_box_tier_id;

  IF v_total_weight <= 0 THEN
    RAISE EXCEPTION 'drop table is not configured for box tier: %', p_box_tier_id;
  END IF;

  v_roll := random() * v_total_weight;

  SELECT rt.* INTO v_drop_rarity
  FROM (
    SELECT
      dw.rarity_tier_id,
      SUM(dw.weight) OVER (ORDER BY dw.rarity_tier_id, dw.id) AS cumulative_weight
    FROM box_drop_weights dw
    WHERE dw.box_tier_id = p_box_tier_id
  ) weighted
  JOIN rarity_tiers rt ON rt.id = weighted.rarity_tier_id
  WHERE v_roll < weighted.cumulative_weight
  ORDER BY weighted.cumulative_weight
  LIMIT 1;

  -- 7. Random section (uniform 1-8)
  SELECT * INTO v_section
  FROM rocket_sections
  ORDER BY random()
  LIMIT 1;

  -- 8. Random variant within section (uniform 1-8)
  SELECT * INTO v_variant
  FROM part_variants
  WHERE section_id = v_section.id
  ORDER BY random()
  LIMIT 1;

  -- 9. Generate 3 attributes (1-100 each)
  v_attr1 := 1 + floor(random() * 100)::smallint;
  v_attr2 := 1 + floor(random() * 100)::smallint;
  v_attr3 := 1 + floor(random() * 100)::smallint;

  -- 10. Compute part value
  v_part_value := (v_attr1 + v_attr2 + v_attr3)::numeric * v_drop_rarity.multiplier;

  -- 11. Deduct Flux (ledger entry + balance update)
  INSERT INTO flux_ledger_entries (
    wallet_address, auth_user_id, entry_type, amount_flux,
    settlement_kind, settlement_status, payload,
    client_timestamp, user_agent
  ) VALUES (
    v_wallet, v_user_id, 'adjustment', -v_price,
    'offchain_message', 'confirmed',
    jsonb_build_object(
      'reason', 'mystery_box_open',
      'context', jsonb_build_object(
        'box_tier_id', p_box_tier_id,
        'price_flux', v_price
      )
    ),
    COALESCE(p_client_timestamp, now()), p_user_agent
  )
  RETURNING id INTO v_ledger_id;

  UPDATE wallet_flux_balances
  SET
    available_balance = v_new_balance,
    lifetime_spent = lifetime_spent + v_price,
    updated_at = now()
  WHERE wallet_address = v_wallet
  RETURNING * INTO v_balance;

  -- 12. Insert inventory part
  INSERT INTO inventory_parts (
    wallet_address, auth_user_id, variant_id, rarity_tier_id,
    attr1, attr2, attr3, part_value,
    source, source_ref
  ) VALUES (
    v_wallet, v_user_id, v_variant.id, v_drop_rarity.id,
    v_attr1, v_attr2, v_attr3, v_part_value,
    'mystery_box', v_ledger_id::text
  )
  RETURNING id INTO v_part_id;

  -- 13. Return complete result
  RETURN jsonb_build_object(
    'part', jsonb_build_object(
      'id', v_part_id,
      'name', v_variant.name,
      'section_key', v_section.key,
      'section_name', v_section.display_name,
      'rarity', v_drop_rarity.name,
      'rarity_tier_id', v_drop_rarity.id,
      'attr1', v_attr1,
      'attr2', v_attr2,
      'attr3', v_attr3,
      'attr1_name', v_section.attr1_name,
      'attr2_name', v_section.attr2_name,
      'attr3_name', v_section.attr3_name,
      'part_value', v_part_value,
      'multiplier', v_drop_rarity.multiplier
    ),
    'balance', to_jsonb(v_balance),
    'ledger_entry_id', v_ledger_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.open_mystery_box(text, text, numeric, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.open_mystery_box(text, text, numeric, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.open_mystery_box(text, text, numeric, timestamptz, text) TO authenticated;
```

### RPC: `get_user_inventory`

Returns enriched inventory with joined section/variant/rarity names and attribute labels.

```sql
CREATE OR REPLACE FUNCTION public.get_user_inventory(
  p_wallet_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_result jsonb;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  SELECT COALESCE(jsonb_agg(row_to_json(q)::jsonb ORDER BY q.created_at DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      ip.id,
      pv.name AS part_name,
      rs.key AS section_key,
      rs.display_name AS section_name,
      rt.name AS rarity,
      rt.id AS rarity_tier_id,
      rt.multiplier,
      ip.attr1, ip.attr2, ip.attr3,
      rs.attr1_name, rs.attr2_name, rs.attr3_name,
      ip.part_value,
      ip.is_equipped,
      ip.equipped_section_id,
      ip.is_locked,
      ip.source,
      ip.created_at
    FROM inventory_parts ip
    JOIN part_variants pv ON pv.id = ip.variant_id
    JOIN rocket_sections rs ON rs.id = pv.section_id
    JOIN rarity_tiers rt ON rt.id = ip.rarity_tier_id
    WHERE ip.wallet_address = v_wallet
      AND ip.auth_user_id = v_user_id
  ) q;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_inventory(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_inventory(text) TO authenticated;
```

### Realtime Publication Wiring

The frontend inventory panel depends on `postgres_changes`. Add the table to the realtime publication in the same migration:

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'inventory_parts'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_parts;
    END IF;
  END IF;
END;
$$;
```

***

## Phase 3: Database — Auction System

**Migration:** `supabase/migrations/20260228120000_add_nebula_bids_auction.sql`

### Table: `auction_rounds`

```sql
CREATE TABLE IF NOT EXISTS auction_rounds (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status text NOT NULL DEFAULT 'accepting_submissions'
    CHECK (status IN ('accepting_submissions', 'bidding', 'finalizing', 'completed', 'no_submissions')),
  starts_at timestamptz NOT NULL,
  submission_ends_at timestamptz NOT NULL,
  bidding_opens_at timestamptz,
  ends_at timestamptz NOT NULL,                  -- bidding close / round end
  selected_part_id uuid REFERENCES inventory_parts(id),
  selected_by_wallet text REFERENCES wallet_registry(wallet_address),
  winning_bid_id bigint,                          -- FK added after auction_bids table
  final_price numeric(38,18),
  winner_wallet text REFERENCES wallet_registry(wallet_address),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auction_rounds_status_idx
  ON auction_rounds (status, ends_at);

CREATE INDEX IF NOT EXISTS auction_rounds_ends_at_idx
  ON auction_rounds (ends_at DESC);
```

### Table: `auction_submissions`

```sql
CREATE TABLE IF NOT EXISTS auction_submissions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  round_id bigint NOT NULL REFERENCES auction_rounds(id),
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id),
  part_id uuid NOT NULL REFERENCES inventory_parts(id),
  rarity_tier_id smallint NOT NULL REFERENCES rarity_tiers(id),
  part_value numeric(10,2) NOT NULL,
  is_selected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, wallet_address),
  UNIQUE (round_id, part_id)
);

CREATE INDEX IF NOT EXISTS auction_submissions_round_idx
  ON auction_submissions (round_id, is_selected);
```

### Table: `auction_bids`

```sql
CREATE TABLE IF NOT EXISTS auction_bids (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  round_id bigint NOT NULL REFERENCES auction_rounds(id),
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id),
  amount numeric(38,18) NOT NULL CHECK (amount > 0),
  is_winning boolean NOT NULL DEFAULT false,
  is_refunded boolean NOT NULL DEFAULT false,
  escrow_ledger_id bigint REFERENCES flux_ledger_entries(id),
  refund_ledger_id bigint REFERENCES flux_ledger_entries(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auction_bids_round_idx
  ON auction_bids (round_id, amount DESC);

CREATE INDEX IF NOT EXISTS auction_bids_wallet_idx
  ON auction_bids (wallet_address, round_id);

-- Add FK from auction_rounds to auction_bids
ALTER TABLE auction_rounds
  ADD CONSTRAINT auction_rounds_winning_bid_fk
  FOREIGN KEY (winning_bid_id) REFERENCES auction_bids(id);
```

### RLS for Auction Tables

```sql
ALTER TABLE auction_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read auction rounds" ON auction_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read auction submissions" ON auction_submissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read auction bids" ON auction_bids FOR SELECT TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON auction_rounds FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON auction_submissions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON auction_bids FROM anon, authenticated;

GRANT SELECT ON auction_rounds TO authenticated;
GRANT SELECT ON auction_submissions TO authenticated;
GRANT SELECT ON auction_bids TO authenticated;
```

### Realtime Publication Wiring

`useAuctions` depends on `postgres_changes`, so publish all three tables in the same migration:

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'auction_rounds'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_rounds;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'auction_submissions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_submissions;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'auction_bids'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;
    END IF;
  END IF;
END;
$$;
```

### RPC: `submit_auction_item`

```sql
CREATE OR REPLACE FUNCTION public.submit_auction_item(
  p_wallet_address text,
  p_part_id uuid,
  p_client_timestamp timestamptz DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_part inventory_parts;
  v_round auction_rounds;
  v_min_rarity_tier smallint := 3;  -- Rare and above (from AUCTION_MIN_RARITY_TIER)
  v_submission_id bigint;
BEGIN
  -- 1. Authenticate
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  -- 2. Validate part ownership and eligibility
  SELECT * INTO v_part
  FROM inventory_parts
  WHERE id = p_part_id
    AND wallet_address = v_wallet
    AND auth_user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'part not found or not owned by wallet';
  END IF;

  IF v_part.is_locked THEN
    RAISE EXCEPTION 'part is already locked (submitted to another auction)';
  END IF;

  IF v_part.is_equipped THEN
    RAISE EXCEPTION 'part is currently equipped; unequip before submitting';
  END IF;

  IF v_part.rarity_tier_id < v_min_rarity_tier THEN
    RAISE EXCEPTION 'part rarity must be Rare (tier 3) or above to auction';
  END IF;

  -- 3. Find current active round (accepting submissions)
  SELECT * INTO v_round
  FROM auction_rounds
  WHERE status = 'accepting_submissions'
    AND starts_at <= now()
    AND submission_ends_at > now()
  ORDER BY starts_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no active auction round accepting submissions';
  END IF;

  -- 4. Check one submission per wallet per round
  IF EXISTS (
    SELECT 1 FROM auction_submissions
    WHERE round_id = v_round.id AND wallet_address = v_wallet
  ) THEN
    RAISE EXCEPTION 'already submitted a part for this auction round';
  END IF;

  -- 5. Lock the part
  UPDATE inventory_parts
  SET is_locked = true, updated_at = now()
  WHERE id = p_part_id;

  -- 6. Create submission
  INSERT INTO auction_submissions (
    round_id, wallet_address, auth_user_id,
    part_id, rarity_tier_id, part_value
  ) VALUES (
    v_round.id, v_wallet, v_user_id,
    p_part_id, v_part.rarity_tier_id, v_part.part_value
  )
  RETURNING id INTO v_submission_id;

  RETURN jsonb_build_object(
    'submission_id', v_submission_id,
    'round_id', v_round.id,
    'part_id', p_part_id,
    'status', 'submitted'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_auction_item(text, uuid, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_auction_item(text, uuid, timestamptz, text) TO authenticated;
```

### RPC: `place_auction_bid`

```sql
CREATE OR REPLACE FUNCTION public.place_auction_bid(
  p_wallet_address text,
  p_round_id bigint,
  p_amount numeric,
  p_whitelist_bonus_amount numeric DEFAULT 0,
  p_client_timestamp timestamptz DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_round auction_rounds;
  v_current_highest numeric(38,18);
  v_min_increment_bps smallint := 500;  -- 5% (from AUCTION_MIN_INCREMENT_BPS)
  v_min_bid numeric(38,18);
  v_balance wallet_flux_balances;
  v_new_balance numeric(38,18);
  v_previous_bid auction_bids;
  v_escrow_ledger_id bigint;
  v_bid_id bigint;
  v_effective_deduction numeric(38,18);
BEGIN
  -- 1. Authenticate
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  -- 2. Validate round is in bidding state
  SELECT * INTO v_round
  FROM auction_rounds
  WHERE id = p_round_id
    AND status = 'bidding'
    AND ends_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'auction round is not currently accepting bids';
  END IF;

  -- 3. Cannot bid on own item
  IF v_round.selected_by_wallet = v_wallet THEN
    RAISE EXCEPTION 'cannot bid on your own submitted item';
  END IF;

  -- 4. Calculate minimum bid (current highest + 5%)
  SELECT COALESCE(MAX(amount), 0) INTO v_current_highest
  FROM auction_bids
  WHERE round_id = p_round_id AND NOT is_refunded;

  IF v_current_highest > 0 THEN
    v_min_bid := v_current_highest + (v_current_highest * v_min_increment_bps / 10000);
  ELSE
    v_min_bid := 1;  -- minimum starting bid
  END IF;

  IF p_amount < v_min_bid THEN
    RAISE EXCEPTION 'bid must be at least % Flux (current highest + 5%%)', v_min_bid;
  END IF;

  -- 5. Check if user has a previous (non-refunded) bid on this round
  SELECT * INTO v_previous_bid
  FROM auction_bids
  WHERE round_id = p_round_id
    AND wallet_address = v_wallet
    AND NOT is_refunded
  ORDER BY amount DESC
  LIMIT 1
  FOR UPDATE;

  -- 6. Calculate effective deduction (new bid minus previous escrowed amount)
  IF v_previous_bid.id IS NOT NULL THEN
    v_effective_deduction := p_amount - v_previous_bid.amount;
  ELSE
    v_effective_deduction := p_amount;
  END IF;

  -- 7. Ensure balance and deduct
  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet, v_user_id, p_whitelist_bonus_amount, p_client_timestamp, p_user_agent
  );

  v_new_balance := v_balance.available_balance - v_effective_deduction;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient flux balance';
  END IF;

  -- 8. Refund previous bid (mark as refunded; balance offset handled by deducting only the difference)
  IF v_previous_bid.id IS NOT NULL THEN
    UPDATE auction_bids
    SET is_refunded = true
    WHERE id = v_previous_bid.id;
  END IF;

  -- 9. Create escrow ledger entry
  INSERT INTO flux_ledger_entries (
    wallet_address, auth_user_id, entry_type, amount_flux,
    settlement_kind, settlement_status, payload,
    client_timestamp, user_agent
  ) VALUES (
    v_wallet, v_user_id, 'adjustment', -v_effective_deduction,
    'offchain_message', 'confirmed',
    jsonb_build_object(
      'reason', 'auction_bid_escrow',
      'context', jsonb_build_object(
        'round_id', p_round_id,
        'bid_amount', p_amount,
        'previous_bid', v_previous_bid.amount,
        'effective_deduction', v_effective_deduction
      )
    ),
    COALESCE(p_client_timestamp, now()), p_user_agent
  )
  RETURNING id INTO v_escrow_ledger_id;

  UPDATE wallet_flux_balances
  SET
    available_balance = v_new_balance,
    lifetime_spent = lifetime_spent + v_effective_deduction,
    updated_at = now()
  WHERE wallet_address = v_wallet
  RETURNING * INTO v_balance;

  -- 10. Insert bid record
  INSERT INTO auction_bids (
    round_id, wallet_address, auth_user_id,
    amount, escrow_ledger_id
  ) VALUES (
    p_round_id, v_wallet, v_user_id,
    p_amount, v_escrow_ledger_id
  )
  RETURNING id INTO v_bid_id;

  RETURN jsonb_build_object(
    'bid_id', v_bid_id,
    'round_id', p_round_id,
    'amount', p_amount,
    'min_next_bid', p_amount + (p_amount * v_min_increment_bps / 10000),
    'balance', to_jsonb(v_balance)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_auction_bid(text, bigint, numeric, numeric, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_auction_bid(text, bigint, numeric, numeric, timestamptz, text) TO authenticated;
```

### RPC: `finalize_auction` (service-role only)

```sql
CREATE OR REPLACE FUNCTION public.finalize_auction(
  p_round_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round auction_rounds;
  v_winning_bid auction_bids;
  v_selected_submission auction_submissions;
  v_refund_bid RECORD;
  v_refund_ledger_id bigint;
BEGIN
  -- 1. Find bidding round to finalize
  IF p_round_id IS NOT NULL THEN
    SELECT * INTO v_round
    FROM auction_rounds
    WHERE id = p_round_id
      AND status = 'bidding'
      AND ends_at <= now()
    FOR UPDATE;
  ELSE
    SELECT * INTO v_round
    FROM auction_rounds
    WHERE status = 'bidding'
      AND ends_at <= now()
    ORDER BY ends_at ASC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_round_to_finalize');
  END IF;

  -- 2. Validate the round already has a selected submission from the transition step
  SELECT * INTO v_selected_submission
  FROM auction_submissions
  WHERE round_id = v_round.id
    AND is_selected = true
  LIMIT 1;

  IF NOT FOUND OR v_round.selected_part_id IS NULL OR v_round.selected_by_wallet IS NULL THEN
    RAISE EXCEPTION 'auction round % is missing its selected submission', v_round.id;
  END IF;

  UPDATE auction_rounds
  SET status = 'finalizing', updated_at = now()
  WHERE id = v_round.id;

  -- 3. Find highest non-refunded bid
  SELECT * INTO v_winning_bid
  FROM auction_bids
  WHERE round_id = v_round.id AND NOT is_refunded
  ORDER BY amount DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    -- No bids: unlock the part, return to seller
    IF v_round.selected_part_id IS NOT NULL THEN
      UPDATE inventory_parts SET is_locked = false, updated_at = now()
      WHERE id = v_round.selected_part_id;
    END IF;

    UPDATE auction_rounds SET status = 'completed', updated_at = now()
    WHERE id = v_round.id;

    -- Unlock all non-selected submitted parts
    UPDATE inventory_parts SET is_locked = false, updated_at = now()
    WHERE id IN (
      SELECT part_id FROM auction_submissions
      WHERE round_id = v_round.id AND NOT is_selected
    );

    RETURN jsonb_build_object('status', 'completed_no_bids', 'round_id', v_round.id);
  END IF;

  -- 4. Mark winning bid
  UPDATE auction_bids SET is_winning = true WHERE id = v_winning_bid.id;

  -- 5. Refund all losing bidders
  FOR v_refund_bid IN
    SELECT ab.id, ab.wallet_address, ab.auth_user_id, ab.amount
    FROM auction_bids ab
    WHERE ab.round_id = v_round.id
      AND ab.id <> v_winning_bid.id
      AND NOT ab.is_refunded
  LOOP
    INSERT INTO flux_ledger_entries (
      wallet_address, auth_user_id, entry_type, amount_flux,
      settlement_kind, settlement_status, payload
    ) VALUES (
      v_refund_bid.wallet_address, v_refund_bid.auth_user_id,
      'adjustment', v_refund_bid.amount,
      'offchain_message', 'confirmed',
      jsonb_build_object(
        'reason', 'auction_bid_refund',
        'context', jsonb_build_object('round_id', v_round.id, 'bid_id', v_refund_bid.id)
      )
    )
    RETURNING id INTO v_refund_ledger_id;

    UPDATE wallet_flux_balances
    SET available_balance = available_balance + v_refund_bid.amount, updated_at = now()
    WHERE wallet_address = v_refund_bid.wallet_address;

    UPDATE auction_bids
    SET is_refunded = true, refund_ledger_id = v_refund_ledger_id
    WHERE id = v_refund_bid.id;
  END LOOP;

  -- 6. Transfer part to winner
  UPDATE inventory_parts
  SET
    wallet_address = v_winning_bid.wallet_address,
    auth_user_id = v_winning_bid.auth_user_id,
    is_locked = false,
    source = 'auction_win',
    source_ref = v_round.id::text,
    updated_at = now()
  WHERE id = v_round.selected_part_id;

  -- 7. Pay seller
  PERFORM public.ensure_wallet_flux_balance_row(
    v_round.selected_by_wallet,
    v_selected_submission.auth_user_id,
    0,
    NULL,
    'auction-finalize'
  );

  INSERT INTO flux_ledger_entries (
    wallet_address, auth_user_id, entry_type, amount_flux,
    settlement_kind, settlement_status, payload
  ) VALUES (
    v_round.selected_by_wallet,
    v_selected_submission.auth_user_id,
    'adjustment', v_winning_bid.amount,
    'offchain_message', 'confirmed',
    jsonb_build_object(
      'reason', 'auction_sale_proceeds',
      'context', jsonb_build_object(
        'round_id', v_round.id,
        'winning_bid_id', v_winning_bid.id,
        'buyer_wallet', v_winning_bid.wallet_address
      )
    )
  );

  UPDATE wallet_flux_balances
  SET available_balance = available_balance + v_winning_bid.amount, updated_at = now()
  WHERE wallet_address = v_round.selected_by_wallet;

  -- 8. Unlock non-selected submitted parts
  UPDATE inventory_parts SET is_locked = false, updated_at = now()
  WHERE id IN (
    SELECT part_id FROM auction_submissions
    WHERE round_id = v_round.id AND NOT is_selected
  );

  -- 9. Mark round completed
  UPDATE auction_rounds
  SET
    status = 'completed',
    winning_bid_id = v_winning_bid.id,
    final_price = v_winning_bid.amount,
    winner_wallet = v_winning_bid.wallet_address,
    updated_at = now()
  WHERE id = v_round.id;

  RETURN jsonb_build_object(
    'status', 'completed',
    'round_id', v_round.id,
    'winner', v_winning_bid.wallet_address,
    'final_price', v_winning_bid.amount,
    'part_id', v_round.selected_part_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_auction(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_auction(bigint) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_auction(bigint) TO service_role;
```

### RPC: `start_auction_round` (service-role only)

```sql
CREATE OR REPLACE FUNCTION public.start_auction_round()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round_seconds integer := 14400;  -- 4 hours (AUCTION_ROUND_SECONDS)
  v_submission_window_seconds integer := 1800;  -- 30 minutes (AUCTION_SUBMISSION_WINDOW_SECONDS)
  v_new_round_id bigint;
  v_starts_at timestamptz;
  v_submission_ends_at timestamptz;
  v_ends_at timestamptz;
BEGIN
  IF EXISTS (
    SELECT 1 FROM auction_rounds
    WHERE status IN ('accepting_submissions', 'bidding')
      AND ends_at > now()
  ) THEN
    RETURN jsonb_build_object('status', 'round_already_active');
  END IF;

  v_starts_at := now();
  v_submission_ends_at := v_starts_at + make_interval(secs => v_submission_window_seconds);
  v_ends_at := v_starts_at + make_interval(secs => v_round_seconds);

  INSERT INTO auction_rounds (status, starts_at, submission_ends_at, ends_at)
  VALUES ('accepting_submissions', v_starts_at, v_submission_ends_at, v_ends_at)
  RETURNING id INTO v_new_round_id;

  RETURN jsonb_build_object(
    'status', 'round_started',
    'round_id', v_new_round_id,
    'starts_at', v_starts_at,
    'submission_ends_at', v_submission_ends_at,
    'ends_at', v_ends_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.start_auction_round() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_auction_round() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_auction_round() TO service_role;
```

### RPC: `transition_auction_to_bidding` (service-role only)

```sql
CREATE OR REPLACE FUNCTION public.transition_auction_to_bidding(
  p_round_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round auction_rounds;
  v_best_submission auction_submissions;
BEGIN
  SELECT * INTO v_round
  FROM auction_rounds
  WHERE id = p_round_id
    AND status = 'accepting_submissions'
    AND submission_ends_at <= now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'round_not_ready_for_transition');
  END IF;

  SELECT * INTO v_best_submission
  FROM auction_submissions
  WHERE round_id = p_round_id
  ORDER BY rarity_tier_id DESC, part_value DESC
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE auction_rounds
    SET status = 'no_submissions', updated_at = now()
    WHERE id = p_round_id;

    RETURN jsonb_build_object('status', 'no_submissions', 'round_id', p_round_id);
  END IF;

  UPDATE auction_submissions SET is_selected = true WHERE id = v_best_submission.id;

  -- Unlock non-selected parts
  UPDATE inventory_parts SET is_locked = false, updated_at = now()
  WHERE id IN (
    SELECT part_id FROM auction_submissions
    WHERE round_id = p_round_id AND id <> v_best_submission.id
  );

  UPDATE auction_rounds
  SET
    status = 'bidding',
    selected_part_id = v_best_submission.part_id,
    selected_by_wallet = v_best_submission.wallet_address,
    bidding_opens_at = now(),
    updated_at = now()
  WHERE id = p_round_id;

  RETURN jsonb_build_object(
    'status', 'bidding',
    'round_id', p_round_id,
    'selected_part_id', v_best_submission.part_id,
    'selected_by_wallet', v_best_submission.wallet_address
  );
END;
$$;

REVOKE ALL ON FUNCTION public.transition_auction_to_bidding(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transition_auction_to_bidding(bigint) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_auction_to_bidding(bigint) TO service_role;
```

### RPC: `get_active_auction` (authenticated read)

```sql
CREATE OR REPLACE FUNCTION public.get_active_auction()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_round auction_rounds;
  v_bids jsonb;
  v_part_info jsonb;
BEGIN
  SELECT * INTO v_round
  FROM auction_rounds
  WHERE status IN ('accepting_submissions', 'bidding')
    AND ends_at > now()
  ORDER BY starts_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_active_round');
  END IF;

  IF v_round.selected_part_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', ip.id,
      'name', pv.name,
      'section_name', rs.display_name,
      'rarity', rt.name,
      'rarity_tier_id', rt.id,
      'attr1', ip.attr1, 'attr2', ip.attr2, 'attr3', ip.attr3,
      'attr1_name', rs.attr1_name, 'attr2_name', rs.attr2_name, 'attr3_name', rs.attr3_name,
      'part_value', ip.part_value,
      'submitted_by', v_round.selected_by_wallet
    ) INTO v_part_info
    FROM inventory_parts ip
    JOIN part_variants pv ON pv.id = ip.variant_id
    JOIN rocket_sections rs ON rs.id = pv.section_id
    JOIN rarity_tiers rt ON rt.id = ip.rarity_tier_id
    WHERE ip.id = v_round.selected_part_id;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', ab.id,
    'wallet', ab.wallet_address,
    'amount', ab.amount,
    'created_at', ab.created_at
  ) ORDER BY ab.created_at DESC), '[]'::jsonb)
  INTO v_bids
  FROM auction_bids ab
  WHERE ab.round_id = v_round.id AND NOT ab.is_refunded;

  RETURN jsonb_build_object(
    'round_id', v_round.id,
    'status', v_round.status,
    'starts_at', v_round.starts_at,
    'submission_ends_at', v_round.submission_ends_at,
    'ends_at', v_round.ends_at,
    'bidding_opens_at', v_round.bidding_opens_at,
    'part', v_part_info,
    'bids', v_bids,
    'current_highest_bid', (SELECT COALESCE(MAX(amount), 0) FROM auction_bids WHERE round_id = v_round.id AND NOT is_refunded),
    'bid_count', (SELECT COUNT(*) FROM auction_bids WHERE round_id = v_round.id AND NOT is_refunded)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_active_auction() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_auction() TO authenticated;
```

### RPC: `get_auction_history` (authenticated read)

```sql
CREATE OR REPLACE FUNCTION public.get_auction_history(
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(q)::jsonb), '[]'::jsonb)
    FROM (
      SELECT
        ar.id AS round_id,
        ar.status,
        ar.starts_at,
        ar.ends_at,
        ar.final_price,
        ar.winner_wallet,
        pv.name AS part_name,
        rt.name AS rarity,
        ip.part_value,
        rs.display_name AS section_name,
        ar.selected_by_wallet AS seller_wallet
      FROM auction_rounds ar
      LEFT JOIN inventory_parts ip ON ip.id = ar.selected_part_id
      LEFT JOIN part_variants pv ON pv.id = ip.variant_id
      LEFT JOIN rocket_sections rs ON rs.id = pv.section_id
      LEFT JOIN rarity_tiers rt ON rt.id = ip.rarity_tier_id
      WHERE ar.status IN ('completed', 'no_submissions')
      ORDER BY ar.ends_at DESC
      LIMIT GREATEST(1, LEAST(p_limit, 100))
      OFFSET GREATEST(0, p_offset)
    ) q
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_auction_history(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auction_history(integer, integer) TO authenticated;
```

### Scheduler — Supabase Edge Function

**New file:** `supabase/functions/auction-tick/index.ts`

Follows the `verify-eth-lock` pattern: JWT validation, service role key, rate limiting.

- Uses `SUPABASE_SERVICE_ROLE_KEY` to call `finalize_auction()`, `transition_auction_to_bidding()`, `start_auction_round()` as service role
- Single endpoint that performs three passes in order:
  1. Find all `accepting_submissions` rounds where `submission_ends_at <= now()` and call `transition_auction_to_bidding(round_id)`
  2. Find all `bidding` rounds where `ends_at <= now()` and call `finalize_auction(round_id)`
  3. Call `start_auction_round()` once if no active round remains
- Called on a cron schedule via Supabase Dashboard every 5 minutes (not every 30 minutes)
- The explicit `submission_ends_at` timestamp, not cron cadence, determines when submissions close

***

## Phase 4: Frontend — Types & Service Layer

### Extend `src/types/domain.ts`

```typescript
// Replace the legacy local-only InventoryPart shape with the canonical server-backed model.
// Do not model this as `PartWithValue extends InventoryPart`; the old `slot` + `power`
// contract no longer matches the database source of truth.
export interface InventoryPart {
  id: string;
  name: string;
  slot: RocketSection; // canonical section only; legacy aliases are removed from inventory rows
  rarity: RarityTier;
  power: number; // temporary derived UI alias until Rocket Lab stops reading "power"
  attributes: [number, number, number];
  attributeNames: [string, string, string];
  partValue: number; // (sum of attrs) * multiplier
  sectionName: string;
  rarityTierId: number;
  isLocked?: boolean;
}

// Box tier config from database
export interface BoxTierConfig {
  id: string;
  name: string;
  rarity: RarityTier;
  tagline: string;
  price: number;
  rewards: string[];
  possible: { label: string; value: string }[];
}

// Rarity config from database (replaces hardcoded RARITY_CONFIG)
export interface RarityTierConfig {
  id: number;
  name: RarityTier;
  multiplier: number;
  baseBoxPriceFlux: number;
  approximateDropRate: number;
  color: string;
  bg: string;
  border: string;
  glow: string;
  intensity: number;
}

// Auction types
export interface AuctionRound {
  roundId: number;
  status: 'accepting_submissions' | 'bidding' | 'finalizing' | 'completed' | 'no_submissions';
  startsAt: string;
  submissionEndsAt: string;
  endsAt: string;
  biddingOpensAt: string | null;
  part: AuctionPartInfo | null;
  bids: AuctionBid[];
  currentHighestBid: number;
  bidCount: number;
}

export interface AuctionPartInfo {
  id: string;
  name: string;
  sectionName: string;
  rarity: RarityTier;
  attr1: number; attr2: number; attr3: number;
  attr1Name: string; attr2Name: string; attr3Name: string;
  partValue: number;
  submittedBy: string;
}

export interface AuctionBid {
  id: number;
  wallet: string;
  amount: number;
  createdAt: string;
}

export type InventorySortKey = 'section' | 'rarity' | 'value' | 'name';
export type InventorySortDir = 'asc' | 'desc';
```

### New: `src/lib/starVault.ts`

Follows `src/lib/flux.ts` pattern (`assertSupabaseConfigured()`, RPC calls, error normalization):

`openMysteryBox()` returns the canonical post-write balance snapshot from the database. Callers must feed that snapshot into `GameState` (new `applyServerSnapshot()` / `replaceInventory()` helpers) instead of calling `game.spendFlux()` or doing any local balance math.

```typescript
export async function fetchCatalog(): Promise<{
  rarityTiers: RarityTierConfig[];
  rocketSections: RocketSectionConfig[];
  boxTiers: BoxTierConfig[];
}>

export async function openMysteryBox(
  walletAddress: string,
  boxTierId: string,
): Promise<{ part: InventoryPart; balance: FluxBalance; ledgerEntryId: number }>

export async function getUserInventory(
  walletAddress: string,
): Promise<InventoryPart[]>
```

### New: `src/lib/nebulaBids.ts`

`placeAuctionBid()` and `submitAuctionItem()` also return canonical server results. UI code must treat the RPC response as authoritative and update the shared `GameState` cache from it. After `submitAuctionItem()`, call `game.refreshInventory()` immediately if the realtime event has not landed yet so the newly locked part is reflected in the shared inventory list.

```typescript
export async function submitAuctionItem(
  walletAddress: string,
  partId: string,
): Promise<{ submissionId: number; roundId: number }>

export async function placeAuctionBid(
  walletAddress: string,
  roundId: number,
  amount: number,
): Promise<{ bidId: number; minNextBid: number; balance: FluxBalance }>

export async function getActiveAuction(): Promise<AuctionRound | null>

export async function getAuctionHistory(
  limit?: number,
  offset?: number,
): Promise<AuctionHistoryEntry[]>
```

### New Hooks (follow `useEthLock` pattern)

| Hook | File | Purpose |
|------|------|---------|
| `useRarityConfig` | `src/hooks/useRarityConfig.ts` | Fetch rarity tiers (colors, multipliers, prices) from DB; replaces hardcoded `RARITY_CONFIG` |
| `useBoxTiers` | `src/hooks/useBoxTiers.ts` | Fetch + cache box tier configs from DB |
| `useAuctions` | `src/hooks/useAuctions.ts` | Fetch active auction, bid history, realtime subscription on auction tables |
| `useCountdown` | `src/hooks/useCountdown.ts` | Countdown timer utility (1-second interval, returns `{ timeRemaining, formatted, isExpired }`) |

### Modify: `src/components/brand/RarityBadge.tsx`

- Remove the hardcoded `RARITY_CONFIG` literal
- Replace it with a shared rarity-config adapter that supports:
  - a bootstrap fallback derived from `spec.ts` for pre-hydration and legacy screens
  - runtime overrides loaded from `useRarityConfig`
- Keep the export surface compatible until `PartsGrid` and `PartIllustrations` stop importing `RARITY_CONFIG` directly
- SVG gem icons remain in the component (purely visual assets)

***

## Phase 5: Frontend — Star Vault Tab Refactor

### Restructure `src/pages/MysteryPage.tsx`

- Add tab switcher: `useState<'vault' | 'bids'>` following DexPage pattern
- Layout: `grid-cols-1 lg:grid-cols-[1fr_320px]` — main content + inventory sidebar
- Update header to "Star Vault & Nebula Bids"
- Tab button styling: use `--vault` color (#F6C547) for Star Vault, `--bids` color (#A855F7) for Nebula Bids

### Extract & Enhance Components

**`src/components/mystery/VaultTab.tsx`**
- Fetches box tiers from `useBoxTiers` hook
- Renders BoxCard grid (replaces BoxSection as tab content)
- Loading skeleton + error states

**`src/components/mystery/BoxCard.tsx`** (extracted from BoxSection.tsx)
- Replace `randomPart()` with `openMysteryBox()` RPC call
- Start the cracking animation immediately, but gate the final reveal on both:
  - minimum animation duration elapsed
  - RPC result resolved successfully
- On RPC failure, cancel the reveal state, reset to `idle`, and surface the server error (no local fallback reward generation)
- Show 3 individual attribute bars (not just power) on revealed state
- Show Part Value = (sum of attrs) × multiplier
- Enhanced animation states: `idle → shaking → cracking → revealed`
  - Leverages existing CSS keyframes in `src/index.css`: `boxShake`, `boxCrack`, `boxCrackRight`, `sparkBurst`

**`src/components/mystery/BoxIllustration.tsx`** (extracted from BoxSection.tsx)
- Enhanced with new animation states (shaking, cracking, sparkBurst)

### Remove Hardcoded Data

Delete from `BoxSection.tsx`:
- `TIERS` array (lines 19-92)
- `DROP_TABLES` object (lines 135-144)
- `PART_NAMES` record (lines 121-130)
- `randomPart()` function (lines 150-162)

Data now flows from the database through `useBoxTiers` / `useRarityConfig` plus the shared `GameState` server-snapshot cache.

### New: `src/components/mystery/InventoryPanel.tsx`

Right sidebar, shared between both tabs:
- Reads inventory from `GameState` (the shared server-snapshot cache), not a separate inventory hook
- Lists all owned parts with RarityBadge, 3 attribute bars, Part Value
- Sort by section/rarity/value, filter by rarity/section
- Action buttons: View Stats, Send to Auction
- `Equip to Rocket` no longer needs a legacy-model gate now that Rocket Lab reads the same 8-slot inventory, but it should remain hidden until a real assembly write path exists

### New: `src/components/mystery/InventoryPartCard.tsx`

Compact card for each inventory part:
- Part name, section label, RarityBadge
- 3 thin attribute bars
- Part Value with PhiSymbol
- Action buttons row

***

## Phase 6: Frontend — Nebula Bids Tab

### New Components

| Component | File | Purpose |
|-----------|------|---------|
| `BidsTab` | `src/components/mystery/BidsTab.tsx` | Main auction tab content |
| `AuctionGrid` | `src/components/mystery/AuctionGrid.tsx` | Grid of active auctions with countdown timers |
| `AuctionDetail` | `src/components/mystery/AuctionDetail.tsx` | Selected auction: part display, current bid, bid input, bid history |
| `BidInput` | `src/components/mystery/BidInput.tsx` | Pre-populated with min valid bid (current + 5%) |
| `SubmitToAuctionPanel` | `src/components/mystery/SubmitToAuctionPanel.tsx` | Shows eligible parts (Rare+), submit CTA |
| `AuctionResultModal` | `src/components/mystery/AuctionResultModal.tsx` | Post-auction result overlay |
| `TopContributors` | `src/components/mystery/TopContributors.tsx` | Sidebar ranking wallets by total Flux earned |

***

## Phase 7: GameState Migration

### Modify `src/context/GameState.tsx`

- `GameState` remains the single client-wide cache for displayed FLUX + inventory, but it is no longer authoritative
- Remove local balance math for Star Vault / Nebula Bids flows; all writes go through RPCs and `GameState` only applies server snapshots
- Add `applyServerSnapshot({ balance?, inventory? })`, `replaceInventory()`, and `refreshInventory()` helpers
- Move the single `inventory_parts` realtime subscription into `GameState` so the shared cache refreshes in one place
- On wallet connect: fetch FLUX + inventory from server only
- On wallet disconnect or wallet change: immediately clear server-backed inventory and any server-backed equipped references before refetching
- Remove `inventory` and `fluxBalance` from `StoredGameState` localStorage persistence
- Old localStorage inventory data is ignored (users start fresh with server-backed inventory)
- Rocket Lab now keeps only non-authoritative local simulation history; its assembly state reads directly from the shared inventory cache

***

## Implementation Order

| Step | Scope | Dependencies |
|------|-------|--------------|
| 1 | Migration A: catalog tables + seed data | None |
| 2 | Migration B: inventory table + `open_mystery_box` + `get_user_inventory` | Step 1 |
| 3 | Add `AUCTION_SUBMISSION_WINDOW_SECONDS` to `src/config/spec.ts`, then Migration C: auction tables + realtime wiring + all auction RPCs | Steps 1-2 |
| 4 | `src/lib/starVault.ts` + `src/hooks/useRarityConfig.ts` + `src/hooks/useBoxTiers.ts` | Step 2 |
| 5 | GameState: remove persisted inventory / FLUX authority, add server snapshot helpers | Steps 2, 4 |
| 6 | Refactor BoxSection → VaultTab + BoxCard (server-side opening) | Steps 4-5 |
| 7 | MysteryPage tab switcher + InventoryPanel | Step 6 |
| 8 | `src/lib/nebulaBids.ts` + `src/hooks/useAuctions.ts` + `src/hooks/useCountdown.ts` | Step 3 |
| 9 | BidsTab + AuctionGrid + AuctionDetail + BidInput | Step 8 |
| 10 | SubmitToAuctionPanel + AuctionResultModal + TopContributors | Step 9 |
| 11 | Auction scheduler edge function (`supabase/functions/auction-tick/`) | Step 3 |

Steps 1-3 are mostly database + config. Steps 4-7 can ship as "Star Vault v2". Steps 8-11 are the Nebula Bids build.

***

## New File Summary

| Path | Type | Purpose |
|------|------|---------|
| `supabase/migrations/20260228100000_add_star_vault_catalog.sql` | Migration | Catalog tables + seed (rarity_tiers, rocket_sections, part_variants, box_tiers, box_drop_weights) |
| `supabase/migrations/20260228110000_add_inventory_and_box_rpc.sql` | Migration | inventory_parts table + open_mystery_box + get_user_inventory RPCs |
| `supabase/migrations/20260228120000_add_nebula_bids_auction.sql` | Migration | Auction tables + all auction RPCs |
| `supabase/functions/auction-tick/index.ts` | Edge Function | Auction round lifecycle scheduler |
| `src/lib/starVault.ts` | Service | Supabase RPCs for mystery box + catalog |
| `src/lib/nebulaBids.ts` | Service | Supabase RPCs for auction system |
| `src/hooks/useRarityConfig.ts` | Hook | Fetch rarity config from DB |
| `src/hooks/useBoxTiers.ts` | Hook | Fetch box tier configs from DB |
| `src/hooks/useAuctions.ts` | Hook | Fetch + realtime auction state |
| `src/hooks/useCountdown.ts` | Hook | Countdown timer utility |
| `src/components/mystery/VaultTab.tsx` | Component | Star Vault tab content |
| `src/components/mystery/BoxCard.tsx` | Component | Extracted + enhanced box card |
| `src/components/mystery/BoxIllustration.tsx` | Component | Extracted box illustration |
| `src/components/mystery/BidsTab.tsx` | Component | Nebula Bids tab content |
| `src/components/mystery/AuctionGrid.tsx` | Component | Active auctions grid |
| `src/components/mystery/AuctionDetail.tsx` | Component | Selected auction detail |
| `src/components/mystery/BidInput.tsx` | Component | Bid form |
| `src/components/mystery/SubmitToAuctionPanel.tsx` | Component | Submit part to auction CTA |
| `src/components/mystery/AuctionResultModal.tsx` | Component | Post-auction result overlay |
| `src/components/mystery/TopContributors.tsx` | Component | Top bidders sidebar |
| `src/components/mystery/InventoryPanel.tsx` | Component | Shared inventory sidebar |
| `src/components/mystery/InventoryPartCard.tsx` | Component | Individual inventory part card |

## Modified Files

| Path | Changes |
|------|---------|
| `src/pages/MysteryPage.tsx` | Tab switcher, layout restructure, header update |
| `src/config/spec.ts` | Add `AUCTION_SUBMISSION_WINDOW_SECONDS`; retire Star Vault runtime box-price scaling |
| `src/types/domain.ts` | Replace legacy `InventoryPart` shape, add `RarityTierConfig`, and add auction types |
| `src/components/brand/RarityBadge.tsx` | Replace hardcoded RARITY_CONFIG with shared adapter + DB overrides |
| `src/context/GameState.tsx` | Stop treating local state as authoritative; add server snapshot helpers and remove persisted inventory / FLUX authority |
| `src/components/mystery/BoxSection.tsx` | Deprecated / replaced by VaultTab + BoxCard |

***

## Security Summary

| Concern | Mitigation |
|---------|-----------|
| Client-side RNG manipulation | Part generation moved entirely server-side in `open_mystery_box` RPC |
| Flux deduction race condition | Atomic: balance check + deduct + part insert in single PL/pgSQL transaction |
| Auction bid manipulation | `FOR UPDATE` row locks on round and bid records; atomic escrow |
| Inventory theft | `resolve_authenticated_wallet()` verifies wallet ownership against `auth.identities` |
| Direct table writes | `REVOKE INSERT/UPDATE/DELETE` from `authenticated`; writes only via SECURITY DEFINER RPCs |
| Client/server drift | `GameState` only mirrors server snapshots; Star Vault and auction flows stop doing local balance math |
| Auction finalization tampering | `finalize_auction` only callable by service role (not exposed to clients) |
| Catalog data integrity | Catalog tables grant only SELECT to clients; seed data applied via migration |

***

## Verification

1. **Catalog seed**: Query `SELECT count(*) FROM part_variants` — should return 64
2. **Public catalog reads**: Load Star Vault before connecting a wallet and verify box tiers / rarity visuals still render from the DB
3. **Box opening**: Open a box via UI, verify part appears in `inventory_parts` with 3 attributes and correct `part_value`, and verify the returned balance snapshot updates `GameState`
4. **Weighted drops**: Run a local sampling test (for example 10k simulated opens against one box tier) and confirm the observed rarity distribution is close to `box_drop_weights`
5. **Inventory panel**: Verify parts load from server, sort/filter works, and no stale localStorage inventory or FLUX value is shown after wallet switch
6. **Auction flow**: Submit eligible part → wait until `submission_ends_at` → transition to bidding → place bids → finalize → verify winner gets part, seller gets FLUX, losers get refunds
7. **Scheduler / service role**: Manually invoke the Edge Function with the service role key and verify it can transition and finalize rounds without permission errors
8. **Realtime**: Open two browser tabs, bid in one, and verify the other tab updates via realtime subscriptions
9. **Error cases**: Insufficient FLUX, ineligible part for auction, bid below minimum, submission closed, expired auction round
10. **Rarity config**: Verify `RarityBadge` renders correctly from database-driven config while legacy consumers still render through the shared fallback adapter

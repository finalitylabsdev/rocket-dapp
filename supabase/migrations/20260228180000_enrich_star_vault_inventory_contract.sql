/*
  # Enrich the Star Vault inventory contract and tune drop curves

  ## Summary
  - Adds serial, shiny, condition, and total-power fields to canonical inventory parts
  - Adds rarity-specific attribute generation bounds and drop-curve controls
  - Extends part variants with illustration metadata for the shared inventory payload
  - Replaces open_mystery_box() and get_user_inventory() with the enriched payload contract
*/

CREATE SEQUENCE IF NOT EXISTS public.inventory_part_serial_number_seq
  AS bigint
  INCREMENT BY 1
  MINVALUE 1
  START WITH 1
  CACHE 1;

CREATE OR REPLACE FUNCTION public.star_vault_serial_is_shiny(p_serial bigint)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_serial::text ~ '([0-9])\1', false);
$$;

CREATE OR REPLACE FUNCTION public.star_vault_serial_trait(p_serial bigint)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_serial IS NULL OR p_serial <= 0 THEN 'Pending'
    WHEN serial_text ~ '([0-9])\1\1\1' THEN 'Quad Core'
    WHEN serial_text ~ '([0-9])\1\1' THEN 'Triple Echo'
    WHEN serial_text ~ '([0-9])\1' THEN 'Twin Pulse'
    WHEN reverse(serial_text) = serial_text AND length(serial_text) >= 3 THEN 'Mirror Drift'
    WHEN mod(p_serial, 1000) = 0 THEN 'Millennium Mark'
    WHEN mod(p_serial, 100) = 0 THEN 'Century Mark'
    WHEN mod(p_serial, 8) = 0 THEN 'Zenith Run'
    WHEN mod(p_serial, 8) = 1 THEN 'Vanguard Frame'
    WHEN mod(p_serial, 8) = 2 THEN 'Vector Coil'
    WHEN mod(p_serial, 8) = 3 THEN 'Nova Lattice'
    WHEN mod(p_serial, 8) = 4 THEN 'Relay Spine'
    WHEN mod(p_serial, 8) = 5 THEN 'Pioneer Shell'
    WHEN mod(p_serial, 8) = 6 THEN 'Prism Relay'
    ELSE 'Frontier Grade'
  END
  FROM (
    SELECT p_serial::text AS serial_text
  ) resolved;
$$;

CREATE OR REPLACE FUNCTION public.star_vault_roll_attribute(
  p_floor smallint,
  p_cap smallint,
  p_bias numeric
)
RETURNS smallint
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_span integer;
  v_bias numeric := GREATEST(COALESCE(p_bias, 1), 0.05);
  v_roll numeric;
  v_offset integer;
BEGIN
  IF p_floor IS NULL OR p_cap IS NULL THEN
    RAISE EXCEPTION 'attribute floor/cap must be configured';
  END IF;

  IF p_floor > p_cap THEN
    RAISE EXCEPTION 'attribute floor must be <= cap';
  END IF;

  v_span := p_cap - p_floor;
  IF v_span <= 0 THEN
    RETURN p_floor;
  END IF;

  v_roll := 1 - power(1 - random(), v_bias);
  v_offset := LEAST(v_span, floor(v_roll * (v_span + 1))::integer);

  RETURN LEAST(p_cap, p_floor + v_offset)::smallint;
END;
$$;

ALTER TABLE public.inventory_parts
  ADD COLUMN IF NOT EXISTS serial_number bigint,
  ADD COLUMN IF NOT EXISTS serial_trait text,
  ADD COLUMN IF NOT EXISTS is_shiny boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_power integer,
  ADD COLUMN IF NOT EXISTS condition_pct smallint NOT NULL DEFAULT 100;

ALTER TABLE public.rarity_tiers
  ADD COLUMN IF NOT EXISTS attr_floor smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS attr_cap smallint NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS attr_bias numeric(5, 2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS drop_curve_exponent numeric(5, 2) NOT NULL DEFAULT 1;

ALTER TABLE public.part_variants
  ADD COLUMN IF NOT EXISTS illustration_key text,
  ADD COLUMN IF NOT EXISTS illustration_url text,
  ADD COLUMN IF NOT EXISTS illustration_alt text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_parts_condition_pct_check'
  ) THEN
    ALTER TABLE public.inventory_parts
      ADD CONSTRAINT inventory_parts_condition_pct_check
      CHECK (condition_pct BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_parts_total_power_check'
  ) THEN
    ALTER TABLE public.inventory_parts
      ADD CONSTRAINT inventory_parts_total_power_check
      CHECK (total_power IS NULL OR total_power BETWEEN 3 AND 300);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rarity_tiers_attr_floor_check'
  ) THEN
    ALTER TABLE public.rarity_tiers
      ADD CONSTRAINT rarity_tiers_attr_floor_check
      CHECK (attr_floor BETWEEN 1 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rarity_tiers_attr_cap_check'
  ) THEN
    ALTER TABLE public.rarity_tiers
      ADD CONSTRAINT rarity_tiers_attr_cap_check
      CHECK (attr_cap BETWEEN 1 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rarity_tiers_attr_floor_cap_check'
  ) THEN
    ALTER TABLE public.rarity_tiers
      ADD CONSTRAINT rarity_tiers_attr_floor_cap_check
      CHECK (attr_cap >= attr_floor);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rarity_tiers_attr_bias_check'
  ) THEN
    ALTER TABLE public.rarity_tiers
      ADD CONSTRAINT rarity_tiers_attr_bias_check
      CHECK (attr_bias > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rarity_tiers_drop_curve_exponent_check'
  ) THEN
    ALTER TABLE public.rarity_tiers
      ADD CONSTRAINT rarity_tiers_drop_curve_exponent_check
      CHECK (drop_curve_exponent > 0);
  END IF;
END;
$$;

UPDATE public.rarity_tiers
SET
  attr_floor = seeded.attr_floor,
  attr_cap = seeded.attr_cap,
  attr_bias = seeded.attr_bias,
  drop_curve_exponent = seeded.drop_curve_exponent
FROM (
  VALUES
    (1::smallint, 18::smallint, 58::smallint, 0.78::numeric(5, 2), 1.08::numeric(5, 2)),
    (2::smallint, 26::smallint, 66::smallint, 0.90::numeric(5, 2), 1.12::numeric(5, 2)),
    (3::smallint, 36::smallint, 74::smallint, 1.02::numeric(5, 2), 1.28::numeric(5, 2)),
    (4::smallint, 46::smallint, 82::smallint, 1.14::numeric(5, 2), 1.40::numeric(5, 2)),
    (5::smallint, 56::smallint, 88::smallint, 1.28::numeric(5, 2), 1.56::numeric(5, 2)),
    (6::smallint, 66::smallint, 93::smallint, 1.42::numeric(5, 2), 1.72::numeric(5, 2)),
    (7::smallint, 76::smallint, 97::smallint, 1.58::numeric(5, 2), 1.88::numeric(5, 2)),
    (8::smallint, 84::smallint, 100::smallint, 1.76::numeric(5, 2), 2.04::numeric(5, 2))
) AS seeded(id, attr_floor, attr_cap, attr_bias, drop_curve_exponent)
WHERE seeded.id = public.rarity_tiers.id;

UPDATE public.part_variants pv
SET
  illustration_key = COALESCE(NULLIF(btrim(pv.illustration_key), ''), rs.key),
  illustration_alt = COALESCE(NULLIF(btrim(pv.illustration_alt), ''), pv.name),
  illustration_url = NULLIF(btrim(pv.illustration_url), '')
FROM public.rocket_sections rs
WHERE rs.id = pv.section_id
  AND (
    pv.illustration_key IS NULL
    OR btrim(pv.illustration_key) = ''
    OR pv.illustration_alt IS NULL
    OR btrim(pv.illustration_alt) = ''
    OR (pv.illustration_url IS NOT NULL AND btrim(pv.illustration_url) = '')
  );

WITH serial_seed AS (
  SELECT
    COALESCE(MAX(serial_number), 0) AS existing_max,
    COUNT(*) FILTER (WHERE serial_number IS NOT NULL) AS populated_count
  FROM public.inventory_parts
),
ordered_missing AS (
  SELECT
    ip.id,
    (
      CASE
        WHEN (SELECT populated_count FROM serial_seed) = 0 THEN 0
        ELSE (SELECT existing_max FROM serial_seed)
      END
      + row_number() OVER (ORDER BY ip.created_at ASC, ip.id ASC)
    )::bigint AS next_serial
  FROM public.inventory_parts ip
  WHERE ip.serial_number IS NULL
)
UPDATE public.inventory_parts ip
SET serial_number = ordered_missing.next_serial
FROM ordered_missing
WHERE ip.id = ordered_missing.id;

UPDATE public.inventory_parts
SET
  serial_trait = public.star_vault_serial_trait(serial_number),
  is_shiny = public.star_vault_serial_is_shiny(serial_number),
  total_power = (attr1 + attr2 + attr3),
  condition_pct = COALESCE(condition_pct, 100)
WHERE serial_number IS NOT NULL
  AND (
    serial_trait IS DISTINCT FROM public.star_vault_serial_trait(serial_number)
    OR is_shiny IS DISTINCT FROM public.star_vault_serial_is_shiny(serial_number)
    OR total_power IS DISTINCT FROM (attr1 + attr2 + attr3)
    OR condition_pct IS NULL
  );

ALTER TABLE public.inventory_parts
  ALTER COLUMN serial_number SET NOT NULL,
  ALTER COLUMN serial_trait SET NOT NULL,
  ALTER COLUMN total_power SET NOT NULL,
  ALTER COLUMN condition_pct SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS inventory_parts_serial_number_idx
  ON public.inventory_parts (serial_number);

CREATE INDEX IF NOT EXISTS inventory_parts_total_power_idx
  ON public.inventory_parts (total_power DESC, created_at DESC);

SELECT setval(
  'public.inventory_part_serial_number_seq',
  GREATEST(COALESCE((SELECT MAX(serial_number) FROM public.inventory_parts), 1), 1),
  COALESCE((SELECT MAX(serial_number) FROM public.inventory_parts), 0) > 0
);

UPDATE public.box_tiers
SET
  rewards_description = CASE id
    WHEN 'common' THEN ARRAY['Common part (stable floor)', 'Uncommon part', 'Rare chance softened']
    WHEN 'uncommon' THEN ARRAY['Common fallback', 'Uncommon core drop', 'Rare+ floor: 12%']
    WHEN 'rare' THEN ARRAY['Rare anchor drop', 'Epic chance', 'Legendary reduced']
    WHEN 'epic' THEN ARRAY['Epic anchor drop', 'Legendary chance', 'Mythic reduced']
    WHEN 'legendary' THEN ARRAY['Legendary anchor drop', 'Mythic chance', 'Celestial reduced']
    WHEN 'mythic' THEN ARRAY['Mythic anchor drop', 'Celestial chance', 'Quantum reduced']
    WHEN 'celestial' THEN ARRAY['Celestial anchor drop', 'Quantum chase', 'Sharper variance']
    WHEN 'quantum' THEN ARRAY['Quantum anchor drop', 'Celestial fallback', 'Flatter top-end roll']
    ELSE rewards_description
  END,
  possible_stats = CASE id
    WHEN 'common' THEN '[{"label":"Best Drop","value":"Rare"},{"label":"Win Chance","value":"~5%"}]'::jsonb
    WHEN 'uncommon' THEN '[{"label":"Best Drop","value":"Epic"},{"label":"Rare+ Floor","value":"12%"}]'::jsonb
    WHEN 'rare' THEN '[{"label":"Best Drop","value":"Legendary"},{"label":"Win Chance","value":"~3%"}]'::jsonb
    WHEN 'epic' THEN '[{"label":"Best Drop","value":"Mythic"},{"label":"Win Chance","value":"~2%"}]'::jsonb
    WHEN 'legendary' THEN '[{"label":"Best Drop","value":"Celestial"},{"label":"Win Chance","value":"~1.2%"}]'::jsonb
    WHEN 'mythic' THEN '[{"label":"Best Drop","value":"Quantum"},{"label":"Win Chance","value":"~0.8%"}]'::jsonb
    WHEN 'celestial' THEN '[{"label":"Best Drop","value":"Quantum"},{"label":"Win Chance","value":"~6%"}]'::jsonb
    WHEN 'quantum' THEN '[{"label":"Best Drop","value":"Quantum"},{"label":"Hold Rate","value":"~66%"}]'::jsonb
    ELSE possible_stats
  END
WHERE id IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'celestial', 'quantum');

CREATE OR REPLACE FUNCTION public.open_mystery_box(
  p_wallet_address text,
  p_box_tier_id text,
  p_whitelist_bonus_amount numeric DEFAULT 0,
  p_client_timestamp timestamptz DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_balance public.wallet_flux_balances;
  v_box public.box_tiers;
  v_price_rarity public.rarity_tiers;
  v_drop_rarity public.rarity_tiers;
  v_price numeric(38, 18);
  v_new_balance numeric(38, 18);
  v_section public.rocket_sections;
  v_variant public.part_variants;
  v_attr1 smallint;
  v_attr2 smallint;
  v_attr3 smallint;
  v_total_power integer;
  v_part_value numeric(10, 2);
  v_part_id uuid;
  v_ledger_id bigint;
  v_existing_entry public.flux_ledger_entries;
  v_existing_part public.inventory_parts;
  v_serial_number bigint;
  v_serial_trait text;
  v_is_shiny boolean;
  v_condition_pct smallint := 100;
  v_part_payload jsonb;
  v_force_uncommon_rare boolean := false;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT *
    INTO v_existing_entry
    FROM public.flux_ledger_entries
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      SELECT *
      INTO v_balance
      FROM public.wallet_flux_balances
      WHERE wallet_address = v_existing_entry.wallet_address;

      SELECT *
      INTO v_existing_part
      FROM public.inventory_parts
      WHERE source_ref = v_existing_entry.id::text
        AND source = 'mystery_box'
      ORDER BY created_at DESC, id DESC
      LIMIT 1;

      IF FOUND THEN
        SELECT jsonb_build_object(
          'id', ip.id,
          'variant_id', pv.id,
          'name', pv.name,
          'section_key', rs.key,
          'section_name', rs.display_name,
          'rarity', rt.name,
          'rarity_tier_id', rt.id,
          'attr1', ip.attr1,
          'attr2', ip.attr2,
          'attr3', ip.attr3,
          'attr1_name', rs.attr1_name,
          'attr2_name', rs.attr2_name,
          'attr3_name', rs.attr3_name,
          'total_power', ip.total_power,
          'part_value', ip.part_value,
          'serial_number', ip.serial_number,
          'serial_trait', ip.serial_trait,
          'is_shiny', ip.is_shiny,
          'condition_pct', ip.condition_pct,
          'is_locked', ip.is_locked,
          'is_equipped', ip.is_equipped,
          'source', ip.source,
          'created_at', ip.created_at,
          'illustration_key', pv.illustration_key,
          'illustration_url', pv.illustration_url,
          'illustration_alt', pv.illustration_alt
        )
        INTO v_part_payload
        FROM public.inventory_parts ip
        JOIN public.part_variants pv
          ON pv.id = ip.variant_id
        JOIN public.rocket_sections rs
          ON rs.id = pv.section_id
        JOIN public.rarity_tiers rt
          ON rt.id = ip.rarity_tier_id
        WHERE ip.id = v_existing_part.id;

        RETURN jsonb_build_object(
          'part', v_part_payload,
          'balance', to_jsonb(v_balance),
          'ledger_entry_id', v_existing_entry.id
        );
      END IF;

      RETURN jsonb_build_object(
        'balance', to_jsonb(v_balance),
        'ledger_entry_id', v_existing_entry.id
      );
    END IF;
  END IF;

  IF p_box_tier_id IS NULL OR btrim(p_box_tier_id) = '' THEN
    RAISE EXCEPTION 'p_box_tier_id is required';
  END IF;

  SELECT *
  INTO v_box
  FROM public.box_tiers
  WHERE id = lower(btrim(p_box_tier_id));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid box tier: %', p_box_tier_id;
  END IF;

  SELECT *
  INTO v_price_rarity
  FROM public.rarity_tiers
  WHERE id = v_box.rarity_tier_id;

  v_price := v_price_rarity.base_box_price_flux;

  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet,
    v_user_id,
    p_whitelist_bonus_amount,
    p_client_timestamp,
    p_user_agent
  );

  v_new_balance := v_balance.available_balance - v_price;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient flux balance';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.box_drop_weights
    WHERE box_tier_id = v_box.id
  ) THEN
    RAISE EXCEPTION 'drop table is not configured for box tier: %', v_box.id;
  END IF;

  IF v_box.id = 'uncommon' THEN
    -- Guarantee an uncommon-box Rare+ floor without reopening the full roll budget.
    v_force_uncommon_rare := random() < 0.12;
  END IF;

  SELECT rt.*
  INTO v_drop_rarity
  FROM (
    WITH weighted AS (
      SELECT
        dw.id,
        dw.rarity_tier_id,
        GREATEST(
          0.0001::numeric,
          power(dw.weight::numeric, 1 / GREATEST(v_price_rarity.drop_curve_exponent, 0.1))
          * power(0.88::numeric, GREATEST(0, v_box.rarity_tier_id - dw.rarity_tier_id))
          * power(0.35::numeric, GREATEST(0, dw.rarity_tier_id - v_box.rarity_tier_id))
          * (0.94 + (random() * 0.12))
        ) AS effective_weight
      FROM public.box_drop_weights dw
      WHERE dw.box_tier_id = v_box.id
        AND (
          v_box.id <> 'uncommon'
          OR (
            v_force_uncommon_rare = true
            AND dw.rarity_tier_id >= 3
          )
          OR (
            v_force_uncommon_rare = false
            AND dw.rarity_tier_id < 3
          )
        )
    ),
    ranked AS (
      SELECT
        weighted.id,
        weighted.rarity_tier_id,
        weighted.effective_weight,
        SUM(weighted.effective_weight) OVER (ORDER BY weighted.rarity_tier_id, weighted.id) AS cumulative_weight,
        SUM(weighted.effective_weight) OVER () AS total_effective_weight
      FROM weighted
    ),
    rolled AS (
      SELECT random() * COALESCE(MAX(total_effective_weight), 0) AS pick
      FROM ranked
    )
    SELECT ranked.rarity_tier_id
    FROM ranked
    CROSS JOIN rolled
    WHERE rolled.pick <= ranked.cumulative_weight
    ORDER BY ranked.cumulative_weight
    LIMIT 1
  ) chosen
  JOIN public.rarity_tiers rt
    ON rt.id = chosen.rarity_tier_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'failed to resolve drop rarity for box tier: %', v_box.id;
  END IF;

  SELECT *
  INTO v_section
  FROM public.rocket_sections
  ORDER BY random()
  LIMIT 1;

  SELECT *
  INTO v_variant
  FROM public.part_variants
  WHERE section_id = v_section.id
  ORDER BY random()
  LIMIT 1;

  v_attr1 := public.star_vault_roll_attribute(v_drop_rarity.attr_floor, v_drop_rarity.attr_cap, v_drop_rarity.attr_bias);
  v_attr2 := public.star_vault_roll_attribute(v_drop_rarity.attr_floor, v_drop_rarity.attr_cap, v_drop_rarity.attr_bias);
  v_attr3 := public.star_vault_roll_attribute(v_drop_rarity.attr_floor, v_drop_rarity.attr_cap, v_drop_rarity.attr_bias);
  v_total_power := v_attr1 + v_attr2 + v_attr3;
  v_part_value := round((v_total_power::numeric * v_drop_rarity.multiplier)::numeric, 2);
  v_serial_number := nextval('public.inventory_part_serial_number_seq');
  v_serial_trait := public.star_vault_serial_trait(v_serial_number);
  v_is_shiny := public.star_vault_serial_is_shiny(v_serial_number);

  INSERT INTO public.flux_ledger_entries (
    wallet_address,
    auth_user_id,
    entry_type,
    amount_flux,
    settlement_kind,
    settlement_status,
    payload,
    client_timestamp,
    user_agent,
    idempotency_key
  )
  VALUES (
    v_wallet,
    v_user_id,
    'adjustment',
    -v_price,
    'offchain_message',
    'confirmed',
    jsonb_build_object(
      'reason', 'mystery_box_open',
      'context', jsonb_build_object(
        'box_tier_id', v_box.id,
        'price_flux', v_price
      )
    ),
    COALESCE(p_client_timestamp, now()),
    p_user_agent,
    p_idempotency_key
  )
  RETURNING id INTO v_ledger_id;

  UPDATE public.wallet_flux_balances
  SET
    available_balance = v_new_balance,
    lifetime_spent = lifetime_spent + v_price,
    updated_at = now()
  WHERE wallet_address = v_wallet
  RETURNING * INTO v_balance;

  INSERT INTO public.inventory_parts (
    wallet_address,
    auth_user_id,
    variant_id,
    rarity_tier_id,
    attr1,
    attr2,
    attr3,
    part_value,
    serial_number,
    serial_trait,
    is_shiny,
    total_power,
    condition_pct,
    source,
    source_ref
  )
  VALUES (
    v_wallet,
    v_user_id,
    v_variant.id,
    v_drop_rarity.id,
    v_attr1,
    v_attr2,
    v_attr3,
    v_part_value,
    v_serial_number,
    v_serial_trait,
    v_is_shiny,
    v_total_power,
    v_condition_pct,
    'mystery_box',
    v_ledger_id::text
  )
  RETURNING id INTO v_part_id;

  SELECT jsonb_build_object(
    'id', ip.id,
    'variant_id', pv.id,
    'name', pv.name,
    'section_key', rs.key,
    'section_name', rs.display_name,
    'rarity', rt.name,
    'rarity_tier_id', rt.id,
    'attr1', ip.attr1,
    'attr2', ip.attr2,
    'attr3', ip.attr3,
    'attr1_name', rs.attr1_name,
    'attr2_name', rs.attr2_name,
    'attr3_name', rs.attr3_name,
    'total_power', ip.total_power,
    'part_value', ip.part_value,
    'serial_number', ip.serial_number,
    'serial_trait', ip.serial_trait,
    'is_shiny', ip.is_shiny,
    'condition_pct', ip.condition_pct,
    'is_locked', ip.is_locked,
    'is_equipped', ip.is_equipped,
    'source', ip.source,
    'created_at', ip.created_at,
    'illustration_key', pv.illustration_key,
    'illustration_url', pv.illustration_url,
    'illustration_alt', pv.illustration_alt
  )
  INTO v_part_payload
  FROM public.inventory_parts ip
  JOIN public.part_variants pv
    ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs
    ON rs.id = pv.section_id
  JOIN public.rarity_tiers rt
    ON rt.id = ip.rarity_tier_id
  WHERE ip.id = v_part_id;

  RETURN jsonb_build_object(
    'part', v_part_payload,
    'balance', to_jsonb(v_balance),
    'ledger_entry_id', v_ledger_id
  );
END;
$$;

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

  SELECT COALESCE(jsonb_agg(row_to_json(q)::jsonb ORDER BY q.created_at DESC, q.id DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT
      ip.id,
      pv.id AS variant_id,
      pv.name AS name,
      rs.key AS section_key,
      rs.display_name AS section_name,
      rt.name AS rarity,
      rt.id AS rarity_tier_id,
      ip.attr1,
      ip.attr2,
      ip.attr3,
      rs.attr1_name,
      rs.attr2_name,
      rs.attr3_name,
      ip.total_power,
      ip.part_value,
      ip.serial_number,
      ip.serial_trait,
      ip.is_shiny,
      ip.condition_pct,
      ip.is_equipped,
      ip.equipped_section_id,
      ip.is_locked,
      ip.source,
      ip.created_at,
      pv.illustration_key,
      pv.illustration_url,
      pv.illustration_alt
    FROM public.inventory_parts ip
    JOIN public.part_variants pv
      ON pv.id = ip.variant_id
    JOIN public.rocket_sections rs
      ON rs.id = pv.section_id
    JOIN public.rarity_tiers rt
      ON rt.id = ip.rarity_tier_id
    WHERE ip.wallet_address = v_wallet
      AND ip.auth_user_id = v_user_id
  ) q;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.open_mystery_box(text, text, numeric, timestamptz, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.open_mystery_box(text, text, numeric, timestamptz, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.open_mystery_box(text, text, numeric, timestamptz, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_inventory(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_inventory(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_inventory(text) TO authenticated;

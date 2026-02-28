/*
  # Sync inventory part metadata contract

  ## Summary
  - Adds inventory serial/power metadata columns when missing
  - Backfills existing rows without overwriting live values
  - Fixes open_mystery_box() to insert the required metadata fields
  - Aligns get_user_inventory() with the shared inventory payload contract
*/

ALTER TABLE public.inventory_parts
  ADD COLUMN IF NOT EXISTS serial_number bigint,
  ADD COLUMN IF NOT EXISTS serial_trait text,
  ADD COLUMN IF NOT EXISTS is_shiny boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_power integer,
  ADD COLUMN IF NOT EXISTS condition_pct smallint NOT NULL DEFAULT 100;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_parts_total_power_check'
  ) THEN
    ALTER TABLE public.inventory_parts
      ADD CONSTRAINT inventory_parts_total_power_check
      CHECK (total_power IS NULL OR (total_power >= 3 AND total_power <= 300));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_parts_condition_pct_check'
  ) THEN
    ALTER TABLE public.inventory_parts
      ADD CONSTRAINT inventory_parts_condition_pct_check
      CHECK (condition_pct >= 0 AND condition_pct <= 100);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_inventory_part_shiny(
  p_serial_number bigint
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_serial_number IS NULL OR p_serial_number <= 0 THEN false
    WHEN mod(p_serial_number, 100) = 0 THEN true
    WHEN mod(p_serial_number, 11) = 0 THEN true
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.compute_inventory_serial_trait(
  p_serial_number bigint
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_serial_number IS NULL OR p_serial_number <= 0 THEN 'Vanguard Frame'
    WHEN p_serial_number = 101 THEN 'Mirror Drift'
    WHEN public.is_inventory_part_shiny(p_serial_number) THEN 'Twin Pulse'
    ELSE (
      ARRAY[
        'Vanguard Frame',
        'Vector Coil',
        'Nova Lattice',
        'Relay Spine',
        'Pioneer Shell',
        'Prism Relay',
        'Frontier Grade',
        'Zenith Run'
      ]
    )[1 + mod(p_serial_number - 1, 8)]
  END;
$$;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (ORDER BY created_at ASC, id ASC) AS seq
  FROM public.inventory_parts
  WHERE serial_number IS NULL
)
UPDATE public.inventory_parts ip
SET serial_number = ranked.seq
FROM ranked
WHERE ip.id = ranked.id;

UPDATE public.inventory_parts
SET
  total_power = attr1 + attr2 + attr3
WHERE total_power IS NULL;

UPDATE public.inventory_parts
SET
  is_shiny = public.is_inventory_part_shiny(serial_number)
WHERE serial_number IS NOT NULL
  AND (
    is_shiny IS DISTINCT FROM public.is_inventory_part_shiny(serial_number)
    OR serial_trait IS NULL
  );

UPDATE public.inventory_parts
SET
  serial_trait = public.compute_inventory_serial_trait(serial_number)
WHERE serial_number IS NOT NULL
  AND (serial_trait IS NULL OR btrim(serial_trait) = '');

ALTER TABLE public.inventory_parts
  ALTER COLUMN serial_number SET NOT NULL,
  ALTER COLUMN serial_trait SET NOT NULL,
  ALTER COLUMN total_power SET NOT NULL;

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
  v_total_weight integer;
  v_roll numeric;
  v_serial_number bigint;
  v_serial_trait text;
  v_is_shiny boolean;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

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

  SELECT COALESCE(SUM(weight), 0)
  INTO v_total_weight
  FROM public.box_drop_weights
  WHERE box_tier_id = v_box.id;

  IF v_total_weight <= 0 THEN
    RAISE EXCEPTION 'drop table is not configured for box tier: %', v_box.id;
  END IF;

  v_roll := random() * v_total_weight;

  SELECT rt.*
  INTO v_drop_rarity
  FROM (
    SELECT
      dw.id,
      dw.rarity_tier_id,
      SUM(dw.weight) OVER (ORDER BY dw.rarity_tier_id, dw.id) AS cumulative_weight
    FROM public.box_drop_weights dw
    WHERE dw.box_tier_id = v_box.id
  ) weighted
  JOIN public.rarity_tiers rt
    ON rt.id = weighted.rarity_tier_id
  WHERE v_roll < weighted.cumulative_weight
  ORDER BY weighted.cumulative_weight
  LIMIT 1;

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

  v_attr1 := 1 + floor(random() * 100)::smallint;
  v_attr2 := 1 + floor(random() * 100)::smallint;
  v_attr3 := 1 + floor(random() * 100)::smallint;
  v_total_power := v_attr1 + v_attr2 + v_attr3;
  v_part_value := round((v_total_power::numeric * v_drop_rarity.multiplier)::numeric, 2);

  PERFORM pg_advisory_xact_lock(628314, 1100);

  SELECT COALESCE(MAX(serial_number), 0) + 1
  INTO v_serial_number
  FROM public.inventory_parts;

  v_is_shiny := public.is_inventory_part_shiny(v_serial_number);
  v_serial_trait := public.compute_inventory_serial_trait(v_serial_number);

  INSERT INTO public.flux_ledger_entries (
    wallet_address,
    auth_user_id,
    entry_type,
    amount_flux,
    settlement_kind,
    settlement_status,
    payload,
    client_timestamp,
    user_agent
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
    p_user_agent
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
    total_power,
    part_value,
    serial_number,
    serial_trait,
    is_shiny,
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
    v_total_power,
    v_part_value,
    v_serial_number,
    v_serial_trait,
    v_is_shiny,
    100,
    'mystery_box',
    v_ledger_id::text
  )
  RETURNING id INTO v_part_id;

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
      'total_power', v_total_power,
      'part_value', v_part_value,
      'serial_number', v_serial_number,
      'serial_trait', v_serial_trait,
      'is_shiny', v_is_shiny,
      'condition_pct', 100,
      'multiplier', v_drop_rarity.multiplier,
      'is_locked', false,
      'is_equipped', false,
      'source', 'mystery_box',
      'created_at', now()
    ),
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

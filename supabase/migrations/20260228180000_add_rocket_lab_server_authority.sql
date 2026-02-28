/*
  # Add Rocket Lab server-authoritative equip, launch, and repair flows

  ## Summary
  - Upgrades `rocket_launches` for the authoritative Rocket Lab flow
  - Replaces local Rocket Lab mutations with authoritative RPCs:
    - `equip_inventory_part`
    - `unequip_inventory_part`
    - `launch_rocket`
    - `repair_inventory_part`
    - `get_launch_history`
  - Extends `get_user_inventory()` to surface the stub-1 enriched inventory contract

  ## Dependency
  This migration assumes the shared inventory branch already added:
  - `inventory_parts.condition_pct`
  - `inventory_parts.serial_number`
  - `inventory_parts.serial_trait`
  - `inventory_parts.is_shiny`
*/

CREATE TABLE IF NOT EXISTS public.rocket_launches (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address text NOT NULL REFERENCES public.wallet_registry(wallet_address) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key text,
  slot_core_engine uuid REFERENCES public.inventory_parts(id),
  slot_wing_plate uuid REFERENCES public.inventory_parts(id),
  slot_fuel_cell uuid REFERENCES public.inventory_parts(id),
  slot_navigation_module uuid REFERENCES public.inventory_parts(id),
  slot_payload_bay uuid REFERENCES public.inventory_parts(id),
  slot_thruster_array uuid REFERENCES public.inventory_parts(id),
  slot_propulsion_cables uuid REFERENCES public.inventory_parts(id),
  slot_shielding uuid REFERENCES public.inventory_parts(id),
  stability smallint NOT NULL DEFAULT 0,
  fuel_efficiency smallint NOT NULL DEFAULT 0,
  launch_power smallint NOT NULL DEFAULT 0,
  grav_score_base integer NOT NULL DEFAULT 0,
  win_probability smallint NOT NULL DEFAULT 0,
  base_multiplier numeric(8, 4) NOT NULL DEFAULT 1,
  final_multiplier numeric(8, 4) NOT NULL DEFAULT 1,
  grav_score integer NOT NULL DEFAULT 0,
  power_result smallint NOT NULL DEFAULT 0,
  random_seed double precision NOT NULL DEFAULT 0,
  event_index smallint NOT NULL DEFAULT 0,
  event_bonus text NOT NULL DEFAULT 'Rocket Lab launch',
  launch_fee_flux numeric(18, 2) NOT NULL DEFAULT 0,
  chain_status text NOT NULL DEFAULT 'offchain',
  chain_tx_hash text,
  chain_block_number bigint,
  reconciled_at timestamptz,
  total_power integer,
  base_score integer,
  luck_score integer,
  randomness_score integer,
  total_score integer,
  fuel_cost_flux numeric(18, 2),
  meteorite_damage_pct smallint,
  loadout_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  damage_report jsonb NOT NULL DEFAULT '[]'::jsonb,
  ledger_entry_id bigint REFERENCES public.flux_ledger_entries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rocket_launches
  ADD COLUMN IF NOT EXISTS total_power integer,
  ADD COLUMN IF NOT EXISTS base_score integer,
  ADD COLUMN IF NOT EXISTS luck_score integer,
  ADD COLUMN IF NOT EXISTS randomness_score integer,
  ADD COLUMN IF NOT EXISTS total_score integer,
  ADD COLUMN IF NOT EXISTS fuel_cost_flux numeric(18, 2),
  ADD COLUMN IF NOT EXISTS meteorite_damage_pct smallint,
  ADD COLUMN IF NOT EXISTS loadout_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS damage_report jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ledger_entry_id bigint REFERENCES public.flux_ledger_entries(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS rocket_launches_idempotency_key_idx
  ON public.rocket_launches (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS rocket_launches_wallet_address_idx
  ON public.rocket_launches (wallet_address, created_at DESC);

ALTER TABLE public.rocket_launches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own launches" ON public.rocket_launches;
CREATE POLICY "Users can view own launches"
  ON public.rocket_launches
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

REVOKE INSERT, UPDATE, DELETE ON public.rocket_launches FROM anon, authenticated;
GRANT SELECT ON public.rocket_launches TO authenticated;

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
      pv.id AS variant_id,
      pv.variant_index,
      pv.name AS name,
      rs.key AS section_key,
      rs.display_name AS section_name,
      rs_eq.key AS equipped_section_key,
      rt.name AS rarity,
      rt.id AS rarity_tier_id,
      rt.multiplier,
      ip.attr1,
      ip.attr2,
      ip.attr3,
      rs.attr1_name,
      rs.attr2_name,
      rs.attr3_name,
      ip.part_value,
      ip.condition_pct,
      ip.serial_number,
      ip.serial_trait,
      ip.is_shiny,
      ip.is_equipped,
      ip.equipped_section_id,
      ip.is_locked,
      ip.source,
      ip.created_at
    FROM public.inventory_parts ip
    JOIN public.part_variants pv
      ON pv.id = ip.variant_id
    JOIN public.rocket_sections rs
      ON rs.id = pv.section_id
    JOIN public.rarity_tiers rt
      ON rt.id = ip.rarity_tier_id
    LEFT JOIN public.rocket_sections rs_eq
      ON rs_eq.id = ip.equipped_section_id
    WHERE ip.wallet_address = v_wallet
      AND ip.auth_user_id = v_user_id
  ) q;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.equip_inventory_part(
  p_wallet_address text,
  p_part_id uuid,
  p_section_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_part public.inventory_parts;
  v_part_section public.rocket_sections;
  v_target_section public.rocket_sections;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  IF p_part_id IS NULL THEN
    RAISE EXCEPTION 'p_part_id is required';
  END IF;

  IF p_section_key IS NULL OR btrim(p_section_key) = '' THEN
    RAISE EXCEPTION 'p_section_key is required';
  END IF;

  SELECT *
  INTO v_target_section
  FROM public.rocket_sections
  WHERE key = btrim(p_section_key);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid section: %', p_section_key;
  END IF;

  SELECT ip.*
  INTO v_part
  FROM public.inventory_parts ip
  WHERE ip.id = p_part_id
    AND ip.wallet_address = v_wallet
    AND ip.auth_user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'part does not belong to the authenticated wallet';
  END IF;

  IF v_part.is_locked THEN
    RAISE EXCEPTION 'auction-locked parts cannot be equipped';
  END IF;

  IF v_part.condition_pct <= 0 THEN
    RAISE EXCEPTION 'repair the part before equipping it';
  END IF;

  SELECT rs.*
  INTO v_part_section
  FROM public.part_variants pv
  JOIN public.rocket_sections rs
    ON rs.id = pv.section_id
  WHERE pv.id = v_part.variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'part variant is missing its rocket section';
  END IF;

  IF v_part_section.id <> v_target_section.id THEN
    RAISE EXCEPTION 'part cannot be equipped to section: %', v_target_section.key;
  END IF;

  UPDATE public.inventory_parts
  SET
    is_equipped = false,
    equipped_section_id = NULL,
    updated_at = now()
  WHERE wallet_address = v_wallet
    AND auth_user_id = v_user_id
    AND is_equipped = true
    AND equipped_section_id = v_target_section.id
    AND id <> v_part.id;

  UPDATE public.inventory_parts
  SET
    is_equipped = true,
    equipped_section_id = v_target_section.id,
    updated_at = now()
  WHERE id = v_part.id;

  RETURN jsonb_build_object(
    'inventory', public.get_user_inventory(v_wallet)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unequip_inventory_part(
  p_wallet_address text,
  p_section_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_target_section public.rocket_sections;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  IF p_section_key IS NULL OR btrim(p_section_key) = '' THEN
    RAISE EXCEPTION 'p_section_key is required';
  END IF;

  SELECT *
  INTO v_target_section
  FROM public.rocket_sections
  WHERE key = btrim(p_section_key);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid section: %', p_section_key;
  END IF;

  UPDATE public.inventory_parts
  SET
    is_equipped = false,
    equipped_section_id = NULL,
    updated_at = now()
  WHERE wallet_address = v_wallet
    AND auth_user_id = v_user_id
    AND is_equipped = true
    AND equipped_section_id = v_target_section.id;

  RETURN jsonb_build_object(
    'inventory', public.get_user_inventory(v_wallet)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.repair_inventory_part(
  p_wallet_address text,
  p_part_id uuid,
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
  v_part public.inventory_parts;
  v_balance public.wallet_flux_balances;
  v_repair_cost numeric(18, 2);
  v_missing_pct numeric;
  v_new_balance numeric(38, 18);
  v_ledger_id bigint;
  v_existing_entry public.flux_ledger_entries;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  IF p_part_id IS NULL THEN
    RAISE EXCEPTION 'p_part_id is required';
  END IF;

  SELECT *
  INTO v_part
  FROM public.inventory_parts
  WHERE id = p_part_id
    AND wallet_address = v_wallet
    AND auth_user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'part does not belong to the authenticated wallet';
  END IF;

  IF v_part.is_locked THEN
    RAISE EXCEPTION 'auction-locked parts cannot be repaired';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT *
    INTO v_existing_entry
    FROM public.flux_ledger_entries
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      SELECT *
      INTO v_balance
      FROM public.wallet_flux_balances
      WHERE wallet_address = v_wallet;

      RETURN jsonb_build_object(
        'repair_cost_flux', COALESCE((v_existing_entry.payload -> 'context' ->> 'repair_cost_flux')::numeric, 0),
        'balance', to_jsonb(v_balance),
        'inventory', public.get_user_inventory(v_wallet)
      );
    END IF;
  END IF;

  v_missing_pct := GREATEST(0, LEAST(100, 100 - v_part.condition_pct));
  v_repair_cost := round((v_part.part_value * (v_missing_pct / 100) * 0.20)::numeric, 2);

  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet,
    v_user_id,
    0,
    NULL,
    NULL
  );

  IF v_repair_cost > 0 THEN
    v_new_balance := v_balance.available_balance - v_repair_cost;
    IF v_new_balance < 0 THEN
      RAISE EXCEPTION 'insufficient flux balance';
    END IF;

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
      -v_repair_cost,
      'offchain_message',
      'confirmed',
      jsonb_build_object(
        'reason', 'rocket_part_repair',
        'context', jsonb_build_object(
          'part_id', v_part.id,
          'repair_cost_flux', v_repair_cost,
          'missing_condition_pct', v_missing_pct
        )
      ),
      now(),
      NULL,
      p_idempotency_key
    )
    RETURNING id INTO v_ledger_id;

    UPDATE public.wallet_flux_balances
    SET
      available_balance = v_new_balance,
      lifetime_spent = lifetime_spent + v_repair_cost,
      updated_at = now()
    WHERE wallet_address = v_wallet
    RETURNING * INTO v_balance;
  END IF;

  UPDATE public.inventory_parts
  SET
    condition_pct = 100,
    updated_at = now()
  WHERE id = v_part.id;

  RETURN jsonb_build_object(
    'repair_cost_flux', v_repair_cost,
    'ledger_entry_id', v_ledger_id,
    'balance', to_jsonb(v_balance),
    'inventory', public.get_user_inventory(v_wallet)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.launch_rocket(
  p_wallet_address text,
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
  v_existing_launch public.rocket_launches;
  v_slot record;
  v_required_section text;
  v_sections_seen text[] := ARRAY[]::text[];
  v_equipped_count integer := 0;
  v_total_power integer := 0;
  v_total_value numeric(18, 2) := 0;
  v_total_rarity integer := 0;
  v_total_condition numeric(10, 2) := 0;
  v_shielding_power integer := 0;
  v_average_rarity numeric(10, 2);
  v_average_condition numeric(10, 2);
  v_base_score integer;
  v_luck_score integer;
  v_randomness_score integer;
  v_total_score integer;
  v_stability smallint;
  v_fuel_efficiency smallint;
  v_launch_power smallint;
  v_win_probability smallint;
  v_base_multiplier numeric(8, 4);
  v_final_multiplier numeric(8, 4);
  v_random_seed double precision;
  v_fuel_cost numeric(18, 2);
  v_new_balance numeric(38, 18);
  v_meteorite_damage_pct smallint;
  v_event_index smallint;
  v_event_bonus text;
  v_loadout_snapshot jsonb := '[]'::jsonb;
  v_damage_report jsonb := '[]'::jsonb;
  v_damage numeric(10, 2);
  v_new_condition numeric(10, 2);
  v_ledger_id bigint;
  v_launch_id bigint;
  v_created_at timestamptz := now();
  v_slot_core_engine uuid;
  v_slot_wing_plate uuid;
  v_slot_fuel_cell uuid;
  v_slot_navigation_module uuid;
  v_slot_payload_bay uuid;
  v_slot_thruster_array uuid;
  v_slot_propulsion_cables uuid;
  v_slot_shielding uuid;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT *
    INTO v_existing_launch
    FROM public.rocket_launches
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      SELECT *
      INTO v_balance
      FROM public.wallet_flux_balances
      WHERE wallet_address = v_wallet;

      RETURN jsonb_build_object(
        'launch_id', v_existing_launch.id,
        'total_power', COALESCE(v_existing_launch.total_power, v_existing_launch.launch_power * 8, 0),
        'fuel_cost_flux', COALESCE(v_existing_launch.fuel_cost_flux, v_existing_launch.launch_fee_flux, 0),
        'score_breakdown', jsonb_build_object(
          'base', COALESCE(v_existing_launch.base_score, v_existing_launch.grav_score_base, 0),
          'luck', COALESCE(v_existing_launch.luck_score, 0),
          'randomness', COALESCE(v_existing_launch.randomness_score, 0),
          'total', COALESCE(v_existing_launch.total_score, v_existing_launch.grav_score, 0)
        ),
        'meteorite_damage_pct', COALESCE(v_existing_launch.meteorite_damage_pct, 0),
        'damage_report', COALESCE(v_existing_launch.damage_report, '[]'::jsonb),
        'created_at', v_existing_launch.created_at,
        'balance', to_jsonb(v_balance),
        'inventory', public.get_user_inventory(v_wallet)
      );
    END IF;
  END IF;

  FOR v_slot IN
    SELECT
      ip.id,
      pv.id AS variant_id,
      pv.variant_index,
      pv.name,
      rs.key AS section_key,
      rs.display_name AS section_name,
      rs_eq.key AS equipped_section_key,
      rt.name AS rarity,
      rt.id AS rarity_tier_id,
      ip.part_value,
      ip.condition_pct,
      ip.is_locked,
      round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3) AS nominal_power,
      round(
        round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3)
        * GREATEST(0, LEAST(100, ip.condition_pct))
        / 100
      )::integer AS effective_power
    FROM public.inventory_parts ip
    JOIN public.part_variants pv
      ON pv.id = ip.variant_id
    JOIN public.rocket_sections rs
      ON rs.id = pv.section_id
    JOIN public.rocket_sections rs_eq
      ON rs_eq.id = ip.equipped_section_id
    JOIN public.rarity_tiers rt
      ON rt.id = ip.rarity_tier_id
    WHERE ip.wallet_address = v_wallet
      AND ip.auth_user_id = v_user_id
      AND ip.is_equipped = true
    ORDER BY rs_eq.id
  LOOP
    IF v_slot.section_key <> v_slot.equipped_section_key THEN
      RAISE EXCEPTION 'equipped part is assigned to the wrong section: %', v_slot.id;
    END IF;

    IF v_slot.section_key = ANY(v_sections_seen) THEN
      RAISE EXCEPTION 'launch requires exactly one equipped part per slot';
    END IF;

    IF v_slot.is_locked THEN
      RAISE EXCEPTION 'unequip auction-locked parts before launching';
    END IF;

    IF v_slot.condition_pct <= 0 THEN
      RAISE EXCEPTION 'repair all broken equipped parts before launching';
    END IF;

    v_sections_seen := array_append(v_sections_seen, v_slot.section_key);
    v_equipped_count := v_equipped_count + 1;
    v_total_power := v_total_power + v_slot.effective_power;
    v_total_value := v_total_value + v_slot.part_value;
    v_total_rarity := v_total_rarity + v_slot.rarity_tier_id;
    v_total_condition := v_total_condition + v_slot.condition_pct;

    CASE v_slot.section_key
      WHEN 'coreEngine' THEN v_slot_core_engine := v_slot.id;
      WHEN 'wingPlate' THEN v_slot_wing_plate := v_slot.id;
      WHEN 'fuelCell' THEN v_slot_fuel_cell := v_slot.id;
      WHEN 'navigationModule' THEN v_slot_navigation_module := v_slot.id;
      WHEN 'payloadBay' THEN v_slot_payload_bay := v_slot.id;
      WHEN 'thrusterArray' THEN v_slot_thruster_array := v_slot.id;
      WHEN 'propulsionCables' THEN v_slot_propulsion_cables := v_slot.id;
      WHEN 'shielding' THEN
        v_slot_shielding := v_slot.id;
        v_shielding_power := v_slot.effective_power;
      ELSE
        NULL;
    END CASE;

    v_loadout_snapshot := v_loadout_snapshot || jsonb_build_array(
      jsonb_build_object(
        'part_id', v_slot.id,
        'variant_id', v_slot.variant_id,
        'variant_index', v_slot.variant_index,
        'section_key', v_slot.section_key,
        'section_name', v_slot.section_name,
        'name', v_slot.name,
        'rarity', v_slot.rarity,
        'condition_pct', v_slot.condition_pct,
        'effective_power', v_slot.effective_power,
        'part_value', v_slot.part_value
      )
    );
  END LOOP;

  IF v_equipped_count <> 8 THEN
    RAISE EXCEPTION 'launch requires exactly 8 equipped parts';
  END IF;

  FOREACH v_required_section IN ARRAY ARRAY[
    'coreEngine',
    'wingPlate',
    'fuelCell',
    'navigationModule',
    'payloadBay',
    'thrusterArray',
    'propulsionCables',
    'shielding'
  ]
  LOOP
    IF NOT (v_required_section = ANY(v_sections_seen)) THEN
      RAISE EXCEPTION 'missing equipped part for slot: %', v_required_section;
    END IF;
  END LOOP;

  v_average_rarity := v_total_rarity::numeric / v_equipped_count;
  v_average_condition := v_total_condition / v_equipped_count;
  v_random_seed := random();

  v_base_score := GREATEST(0, round((v_total_power * 4.0) + (v_total_value * 0.15)))::integer;
  v_luck_score := GREATEST(0, round((v_average_rarity * 18.0) + (v_average_condition * 0.60)))::integer;
  v_randomness_score := round((((v_random_seed * 2) - 1) * 40.0))::integer;
  v_total_score := GREATEST(0, v_base_score + v_luck_score + v_randomness_score);
  v_fuel_cost := round((v_total_value * 0.10)::numeric, 2);
  v_meteorite_damage_pct := LEAST(
    18,
    GREATEST(
      2,
      round(
        4
        + ((100 - LEAST(100, v_shielding_power)) * 0.06)
        + ((100 - LEAST(100, v_average_condition)) * 0.03)
        + (v_random_seed * 4)
      )
    )
  )::smallint;

  v_launch_power := LEAST(100, GREATEST(0, round(v_total_power / 8.0)))::smallint;
  v_stability := LEAST(100, GREATEST(0, round((v_average_condition * 0.65) + (v_shielding_power * 0.35))))::smallint;
  v_fuel_efficiency := LEAST(100, GREATEST(0, round((v_average_condition * 0.55) + (v_launch_power * 0.45))))::smallint;
  v_win_probability := LEAST(96, GREATEST(0, round((v_launch_power * 0.55) + (v_average_condition * 0.25) + (v_average_rarity * 2))))::smallint;
  v_base_multiplier := round((1 + (v_luck_score / 1000.0))::numeric, 4);
  v_final_multiplier := round((v_base_multiplier + (v_randomness_score / 1000.0))::numeric, 4);
  v_event_index := LEAST(4, GREATEST(0, floor(v_random_seed * 5)))::smallint;
  v_event_bonus := CASE v_event_index
    WHEN 0 THEN 'Meteorite drift avoided'
    WHEN 1 THEN 'Clean burn corridor'
    WHEN 2 THEN 'Solar gust interference'
    WHEN 3 THEN 'Dust field crosswinds'
    ELSE 'Shielding absorbed debris'
  END;

  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet,
    v_user_id,
    0,
    NULL,
    NULL
  );

  v_new_balance := v_balance.available_balance - v_fuel_cost;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient flux balance';
  END IF;

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
    -v_fuel_cost,
    'offchain_message',
    'confirmed',
    jsonb_build_object(
      'reason', 'rocket_launch_fuel',
      'context', jsonb_build_object(
        'fuel_cost_flux', v_fuel_cost
      )
    ),
    v_created_at,
    NULL,
    CASE
      WHEN p_idempotency_key IS NULL THEN NULL
      ELSE 'launch_fee:' || p_idempotency_key
    END
  )
  RETURNING id INTO v_ledger_id;

  UPDATE public.wallet_flux_balances
  SET
    available_balance = v_new_balance,
    lifetime_spent = lifetime_spent + v_fuel_cost,
    updated_at = now()
  WHERE wallet_address = v_wallet
  RETURNING * INTO v_balance;

  FOR v_slot IN
    SELECT
      ip.id,
      rs_eq.key AS section_key
    FROM public.inventory_parts ip
    JOIN public.rocket_sections rs_eq
      ON rs_eq.id = ip.equipped_section_id
    WHERE ip.wallet_address = v_wallet
      AND ip.auth_user_id = v_user_id
      AND ip.is_equipped = true
    ORDER BY rs_eq.id
  LOOP
    v_damage := CASE
      WHEN v_slot.section_key = 'shielding' THEN round((v_meteorite_damage_pct * 0.6)::numeric, 2)
      ELSE v_meteorite_damage_pct
    END;

    UPDATE public.inventory_parts
    SET
      condition_pct = GREATEST(0, LEAST(100, condition_pct - v_damage)),
      updated_at = now()
    WHERE id = v_slot.id
    RETURNING condition_pct INTO v_new_condition;

    v_damage_report := v_damage_report || jsonb_build_array(
      jsonb_build_object(
        'part_id', v_slot.id,
        'section_key', v_slot.section_key,
        'damage_pct', v_damage,
        'condition_pct', v_new_condition
      )
    );
  END LOOP;

  INSERT INTO public.rocket_launches (
    wallet_address,
    auth_user_id,
    idempotency_key,
    slot_core_engine,
    slot_wing_plate,
    slot_fuel_cell,
    slot_navigation_module,
    slot_payload_bay,
    slot_thruster_array,
    slot_propulsion_cables,
    slot_shielding,
    stability,
    fuel_efficiency,
    launch_power,
    grav_score_base,
    win_probability,
    base_multiplier,
    final_multiplier,
    grav_score,
    power_result,
    random_seed,
    event_index,
    event_bonus,
    launch_fee_flux,
    total_power,
    base_score,
    luck_score,
    randomness_score,
    total_score,
    fuel_cost_flux,
    meteorite_damage_pct,
    loadout_snapshot,
    damage_report,
    ledger_entry_id,
    created_at
  )
  VALUES (
    v_wallet,
    v_user_id,
    p_idempotency_key,
    v_slot_core_engine,
    v_slot_wing_plate,
    v_slot_fuel_cell,
    v_slot_navigation_module,
    v_slot_payload_bay,
    v_slot_thruster_array,
    v_slot_propulsion_cables,
    v_slot_shielding,
    v_stability,
    v_fuel_efficiency,
    v_launch_power,
    v_base_score,
    v_win_probability,
    v_base_multiplier,
    v_final_multiplier,
    v_total_score,
    v_launch_power,
    v_random_seed,
    v_event_index,
    v_event_bonus,
    v_fuel_cost,
    v_total_power,
    v_base_score,
    v_luck_score,
    v_randomness_score,
    v_total_score,
    v_fuel_cost,
    v_meteorite_damage_pct,
    v_loadout_snapshot,
    v_damage_report,
    v_ledger_id,
    v_created_at
  )
  RETURNING id INTO v_launch_id;

  RETURN jsonb_build_object(
    'launch_id', v_launch_id,
    'total_power', v_total_power,
    'fuel_cost_flux', v_fuel_cost,
    'score_breakdown', jsonb_build_object(
      'base', v_base_score,
      'luck', v_luck_score,
      'randomness', v_randomness_score,
      'total', v_total_score
    ),
    'meteorite_damage_pct', v_meteorite_damage_pct,
    'damage_report', v_damage_report,
    'created_at', v_created_at,
    'balance', to_jsonb(v_balance),
    'inventory', public.get_user_inventory(v_wallet)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_launch_history(
  p_wallet_address text,
  p_limit integer DEFAULT 20
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
      rl.id AS launch_id,
      COALESCE(rl.total_power, rl.launch_power * 8, 0) AS total_power,
      COALESCE(rl.base_score, rl.grav_score_base, 0) AS base_score,
      COALESCE(rl.luck_score, 0) AS luck_score,
      COALESCE(rl.randomness_score, 0) AS randomness_score,
      COALESCE(rl.total_score, rl.grav_score, 0) AS total_score,
      COALESCE(rl.fuel_cost_flux, rl.launch_fee_flux, 0) AS fuel_cost_flux,
      COALESCE(rl.meteorite_damage_pct, 0) AS meteorite_damage_pct,
      COALESCE(rl.damage_report, '[]'::jsonb) AS damage_report,
      rl.created_at
    FROM public.rocket_launches rl
    WHERE rl.wallet_address = v_wallet
      AND rl.auth_user_id = v_user_id
    ORDER BY rl.created_at DESC
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100))
  ) q;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_inventory(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_inventory(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_inventory(text) TO authenticated;

REVOKE ALL ON FUNCTION public.equip_inventory_part(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.equip_inventory_part(text, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.equip_inventory_part(text, uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.unequip_inventory_part(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unequip_inventory_part(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.unequip_inventory_part(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.repair_inventory_part(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.repair_inventory_part(text, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.repair_inventory_part(text, uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.launch_rocket(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.launch_rocket(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.launch_rocket(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_launch_history(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_launch_history(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_launch_history(text, integer) TO authenticated;

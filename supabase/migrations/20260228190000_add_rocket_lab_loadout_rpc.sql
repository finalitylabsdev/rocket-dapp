/*
  # Add Rocket Lab loadout equip RPC and launch from equipped slots

  ## Summary
  - Adds `set_rocket_loadout_part()` so authenticated users can equip or clear one slot
  - Adds `get_equipped_rocket_part()` helper for server-side launch validation
  - Updates `launch_rocket()` to read only persisted equipped parts
*/

CREATE OR REPLACE FUNCTION public.get_equipped_rocket_part(
  p_wallet_address text,
  p_auth_user_id uuid,
  p_section_key text
)
RETURNS SETOF public.inventory_parts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ip.*
  FROM public.inventory_parts ip
  JOIN public.part_variants pv
    ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs
    ON rs.id = pv.section_id
  WHERE ip.wallet_address = p_wallet_address
    AND ip.auth_user_id = p_auth_user_id
    AND rs.key = p_section_key
    AND ip.is_equipped = true
    AND ip.is_locked = false
    AND (
      ip.equipped_section_id = rs.id
      OR ip.equipped_section_id IS NULL
    )
  ORDER BY ip.updated_at DESC, ip.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.set_rocket_loadout_part(
  p_wallet_address text,
  p_section_key text,
  p_part_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_section public.rocket_sections;
  v_part public.inventory_parts;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  IF p_section_key IS NULL OR btrim(p_section_key) = '' THEN
    RAISE EXCEPTION 'p_section_key is required';
  END IF;

  SELECT *
  INTO v_section
  FROM public.rocket_sections
  WHERE key = btrim(p_section_key);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid rocket section: %', p_section_key;
  END IF;

  IF p_part_id IS NOT NULL THEN
    SELECT ip.*
    INTO v_part
    FROM public.inventory_parts ip
    JOIN public.part_variants pv
      ON pv.id = ip.variant_id
    WHERE ip.id = p_part_id
      AND ip.wallet_address = v_wallet
      AND ip.auth_user_id = v_user_id
      AND pv.section_id = v_section.id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'invalid part selection for slot: %', v_section.key;
    END IF;

    IF v_part.is_locked THEN
      RAISE EXCEPTION 'cannot equip locked part';
    END IF;
  END IF;

  UPDATE public.inventory_parts ip
  SET
    is_equipped = false,
    equipped_section_id = NULL,
    updated_at = now()
  FROM public.part_variants pv
  WHERE ip.variant_id = pv.id
    AND ip.wallet_address = v_wallet
    AND ip.auth_user_id = v_user_id
    AND ip.is_equipped = true
    AND (
      ip.equipped_section_id = v_section.id
      OR (ip.equipped_section_id IS NULL AND pv.section_id = v_section.id)
    );

  IF p_part_id IS NULL THEN
    RETURN public.get_user_inventory(v_wallet);
  END IF;

  UPDATE public.inventory_parts
  SET
    is_equipped = true,
    equipped_section_id = v_section.id,
    updated_at = now()
  WHERE id = v_part.id;

  RETURN public.get_user_inventory(v_wallet);
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
  v_part_core_engine public.inventory_parts;
  v_part_wing_plate public.inventory_parts;
  v_part_fuel_cell public.inventory_parts;
  v_part_navigation_module public.inventory_parts;
  v_part_payload_bay public.inventory_parts;
  v_part_thruster_array public.inventory_parts;
  v_part_propulsion_cables public.inventory_parts;
  v_part_shielding public.inventory_parts;
  v_power_core_engine numeric;
  v_power_wing_plate numeric;
  v_power_fuel_cell numeric;
  v_power_navigation_module numeric;
  v_power_payload_bay numeric;
  v_power_thruster_array numeric;
  v_power_propulsion_cables numeric;
  v_power_shielding numeric;
  v_value_payload_bay numeric;
  v_total_power numeric;
  v_total_value numeric;
  v_total_rarity numeric;
  v_average_power numeric;
  v_average_rarity numeric;
  v_completion_ratio numeric := 1.0;
  v_stability smallint;
  v_fuel_efficiency smallint;
  v_launch_power smallint;
  v_grav_score_base integer;
  v_win_probability smallint;
  v_base_multiplier numeric(8, 4);
  v_final_multiplier numeric(8, 4);
  v_grav_score integer;
  v_power_result smallint;
  v_random_seed double precision;
  v_event_index smallint;
  v_event_bonus text;
  v_score_modifier numeric;
  v_power_modifier integer;
  v_launch_fee numeric(18, 2);
  v_new_balance numeric(38, 18);
  v_ledger_id bigint;
  v_launch_id bigint;
  v_existing_launch public.rocket_launches;
  v_stability_bonus integer := 0;
  v_fuel_bonus integer := 0;
  v_power_bonus integer := 0;
  v_win_bonus integer := 0;
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
      WHERE wallet_address = v_existing_launch.wallet_address;

      RETURN jsonb_build_object(
        'launch_id', v_existing_launch.id,
        'grav_score', v_existing_launch.grav_score,
        'event_bonus', v_existing_launch.event_bonus,
        'final_multiplier', v_existing_launch.final_multiplier,
        'power', v_existing_launch.power_result,
        'launch_fee_flux', v_existing_launch.launch_fee_flux,
        'balance', to_jsonb(v_balance)
      );
    END IF;
  END IF;

  SELECT *
  INTO v_part_core_engine
  FROM public.get_equipped_rocket_part(v_wallet, v_user_id, 'coreEngine');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: coreEngine';
  END IF;

  SELECT *
  INTO v_part_wing_plate
  FROM public.get_equipped_rocket_part(v_wallet, v_user_id, 'wingPlate');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: wingPlate';
  END IF;

  SELECT *
  INTO v_part_fuel_cell
  FROM public.get_equipped_rocket_part(v_wallet, v_user_id, 'fuelCell');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: fuelCell';
  END IF;

  SELECT *
  INTO v_part_navigation_module
  FROM public.get_equipped_rocket_part(v_wallet, v_user_id, 'navigationModule');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: navigationModule';
  END IF;

  SELECT *
  INTO v_part_payload_bay
  FROM public.get_equipped_rocket_part(v_wallet, v_user_id, 'payloadBay');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: payloadBay';
  END IF;

  SELECT *
  INTO v_part_thruster_array
  FROM public.get_equipped_rocket_part(v_wallet, v_user_id, 'thrusterArray');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: thrusterArray';
  END IF;

  SELECT *
  INTO v_part_propulsion_cables
  FROM public.get_equipped_rocket_part(v_wallet, v_user_id, 'propulsionCables');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: propulsionCables';
  END IF;

  SELECT *
  INTO v_part_shielding
  FROM public.get_equipped_rocket_part(v_wallet, v_user_id, 'shielding');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: shielding';
  END IF;

  v_power_core_engine := round((v_part_core_engine.attr1 + v_part_core_engine.attr2 + v_part_core_engine.attr3)::numeric / 3);
  v_power_wing_plate := round((v_part_wing_plate.attr1 + v_part_wing_plate.attr2 + v_part_wing_plate.attr3)::numeric / 3);
  v_power_fuel_cell := round((v_part_fuel_cell.attr1 + v_part_fuel_cell.attr2 + v_part_fuel_cell.attr3)::numeric / 3);
  v_power_navigation_module := round((v_part_navigation_module.attr1 + v_part_navigation_module.attr2 + v_part_navigation_module.attr3)::numeric / 3);
  v_power_payload_bay := round((v_part_payload_bay.attr1 + v_part_payload_bay.attr2 + v_part_payload_bay.attr3)::numeric / 3);
  v_power_thruster_array := round((v_part_thruster_array.attr1 + v_part_thruster_array.attr2 + v_part_thruster_array.attr3)::numeric / 3);
  v_power_propulsion_cables := round((v_part_propulsion_cables.attr1 + v_part_propulsion_cables.attr2 + v_part_propulsion_cables.attr3)::numeric / 3);
  v_power_shielding := round((v_part_shielding.attr1 + v_part_shielding.attr2 + v_part_shielding.attr3)::numeric / 3);

  v_value_payload_bay := v_part_payload_bay.part_value;

  v_total_power := v_power_core_engine + v_power_wing_plate + v_power_fuel_cell
    + v_power_navigation_module + v_power_payload_bay + v_power_thruster_array
    + v_power_propulsion_cables + v_power_shielding;

  v_total_value := v_part_core_engine.part_value + v_part_wing_plate.part_value
    + v_part_fuel_cell.part_value + v_part_navigation_module.part_value
    + v_part_payload_bay.part_value + v_part_thruster_array.part_value
    + v_part_propulsion_cables.part_value + v_part_shielding.part_value;

  v_total_rarity := v_part_core_engine.rarity_tier_id + v_part_wing_plate.rarity_tier_id
    + v_part_fuel_cell.rarity_tier_id + v_part_navigation_module.rarity_tier_id
    + v_part_payload_bay.rarity_tier_id + v_part_thruster_array.rarity_tier_id
    + v_part_propulsion_cables.rarity_tier_id + v_part_shielding.rarity_tier_id;

  v_average_power := v_total_power / 8.0;
  v_average_rarity := v_total_rarity / 8.0;

  v_stability := LEAST(100, GREATEST(0, round(
    ((v_power_wing_plate + v_power_navigation_module + v_power_shielding + v_power_propulsion_cables) / 4.0) * 0.72
    + v_completion_ratio * 28
    + v_stability_bonus
  )))::smallint;

  v_fuel_efficiency := LEAST(100, GREATEST(0, round(
    ((v_power_fuel_cell + v_power_payload_bay + v_power_propulsion_cables + v_power_core_engine) / 4.0) * 0.7
    + v_completion_ratio * 24
    + v_fuel_bonus
  )))::smallint;

  v_launch_power := LEAST(100, GREATEST(0, round(
    v_power_core_engine * 0.34
    + v_power_thruster_array * 0.28
    + v_power_fuel_cell * 0.18
    + v_power_payload_bay * 0.1
    + v_power_propulsion_cables * 0.1
    + v_power_bonus
  )))::smallint;

  v_grav_score_base := round(
    v_total_power * (1 + v_completion_ratio)
    + v_total_value * 0.18
    + v_average_rarity * 45
    + v_value_payload_bay * 0.2
  )::integer;

  v_win_probability := LEAST(96, GREATEST(0, round(
    v_completion_ratio * 48
    + v_average_power * 0.3
    + v_average_rarity * 3
    + v_stability * 0.12
    + v_fuel_efficiency * 0.08
    + 8
    + v_win_bonus
  )))::smallint;

  v_random_seed := random();
  v_event_index := floor(v_random_seed * 5)::smallint;

  CASE v_event_index
    WHEN 0 THEN
      v_event_bonus := 'Clear corridor: no turbulence penalties';
      v_score_modifier := 0.10;
      v_power_modifier := 6;
    WHEN 1 THEN
      v_event_bonus := 'Solar crosswind: minor stability drag';
      v_score_modifier := -0.08;
      v_power_modifier := -4;
    WHEN 2 THEN
      v_event_bonus := 'Micrometeor scrape: shielding absorbs the hit';
      v_score_modifier := -0.12;
      v_power_modifier := -7;
    WHEN 3 THEN
      v_event_bonus := 'Gravity sling: efficient burn window detected';
      v_score_modifier := 0.15;
      v_power_modifier := 8;
    WHEN 4 THEN
      v_event_bonus := 'Telemetry echo: navigation recalibration delay';
      v_score_modifier := -0.05;
      v_power_modifier := -3;
    ELSE
      v_event_bonus := 'Clear corridor: no turbulence penalties';
      v_score_modifier := 0.10;
      v_power_modifier := 6;
  END CASE;

  v_base_multiplier := round(
    (1.0 + (v_win_probability::numeric / 140.0) + (v_launch_power::numeric / 220.0))::numeric,
    4
  );

  v_final_multiplier := round(
    (v_base_multiplier * (1.0 + v_score_modifier))::numeric,
    4
  );

  v_grav_score := GREATEST(0, round(
    v_grav_score_base * v_base_multiplier * (1.0 + v_score_modifier)
  ))::integer;

  v_power_result := LEAST(100, GREATEST(0, v_launch_power + v_power_modifier))::smallint;

  v_launch_fee := round((v_total_value * 0.1)::numeric, 2);

  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet,
    v_user_id,
    0,
    NULL,
    NULL
  );

  v_new_balance := v_balance.available_balance - v_launch_fee;
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
    idempotency_key
  )
  VALUES (
    v_wallet,
    v_user_id,
    'adjustment',
    -v_launch_fee,
    'offchain_message',
    'confirmed',
    jsonb_build_object(
      'reason', 'rocket_launch_fee',
      'context', jsonb_build_object(
        'total_part_value', v_total_value,
        'fee_rate', 0.1,
        'grav_score', v_grav_score
      )
    ),
    p_idempotency_key
  )
  RETURNING id INTO v_ledger_id;

  UPDATE public.wallet_flux_balances
  SET
    available_balance = v_new_balance,
    lifetime_spent = lifetime_spent + v_launch_fee,
    updated_at = now()
  WHERE wallet_address = v_wallet
  RETURNING * INTO v_balance;

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
    ledger_entry_id
  )
  VALUES (
    v_wallet,
    v_user_id,
    p_idempotency_key,
    v_part_core_engine.id,
    v_part_wing_plate.id,
    v_part_fuel_cell.id,
    v_part_navigation_module.id,
    v_part_payload_bay.id,
    v_part_thruster_array.id,
    v_part_propulsion_cables.id,
    v_part_shielding.id,
    v_stability,
    v_fuel_efficiency,
    v_launch_power,
    v_grav_score_base,
    v_win_probability,
    v_base_multiplier,
    v_final_multiplier,
    v_grav_score,
    v_power_result,
    v_random_seed,
    v_event_index,
    v_event_bonus,
    v_launch_fee,
    v_ledger_id
  )
  RETURNING id INTO v_launch_id;

  RETURN jsonb_build_object(
    'launch_id', v_launch_id,
    'grav_score', v_grav_score,
    'event_bonus', v_event_bonus,
    'final_multiplier', v_final_multiplier,
    'power', v_power_result,
    'launch_fee_flux', v_launch_fee,
    'balance', to_jsonb(v_balance)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_equipped_rocket_part(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_equipped_rocket_part(text, uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.get_equipped_rocket_part(text, uuid, text) FROM authenticated;

REVOKE ALL ON FUNCTION public.set_rocket_loadout_part(text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_rocket_loadout_part(text, text, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_rocket_loadout_part(text, text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.launch_rocket(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.launch_rocket(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.launch_rocket(text, text) TO authenticated;

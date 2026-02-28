/*
  # Add server-authoritative rocket launches

  ## Summary
  - Creates `rocket_launches` table to store every launch with full scoring snapshot
  - Creates `launch_rocket()` RPC — atomic operation: select best parts, compute
    metrics, pick random event, compute score, debit Flux, insert launch row
  - Creates `get_launch_history()` RPC for fetching recent launches
  - Adds heartbeat trigger on rocket_launches → touch_cosmic_jackpot_updates()
  - Updates `get_cosmic_jackpot_snapshot()` to rank by cumulative GravScore

  ## Security
  - RLS on rocket_launches: authenticated users can SELECT own rows only
  - RPCs are SECURITY DEFINER, authenticated only
*/

-- 1. rocket_launches table
CREATE TABLE IF NOT EXISTS public.rocket_launches (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address text NOT NULL REFERENCES public.wallet_registry(wallet_address),
  auth_user_id uuid NOT NULL REFERENCES auth.users(id),
  idempotency_key text,

  -- equipped part references (one per canonical slot)
  slot_core_engine uuid REFERENCES public.inventory_parts(id),
  slot_wing_plate uuid REFERENCES public.inventory_parts(id),
  slot_fuel_cell uuid REFERENCES public.inventory_parts(id),
  slot_navigation_module uuid REFERENCES public.inventory_parts(id),
  slot_payload_bay uuid REFERENCES public.inventory_parts(id),
  slot_thruster_array uuid REFERENCES public.inventory_parts(id),
  slot_propulsion_cables uuid REFERENCES public.inventory_parts(id),
  slot_shielding uuid REFERENCES public.inventory_parts(id),

  -- scoring snapshot
  stability smallint NOT NULL,
  fuel_efficiency smallint NOT NULL,
  launch_power smallint NOT NULL,
  grav_score_base integer NOT NULL,
  win_probability smallint NOT NULL,
  base_multiplier numeric(8, 4) NOT NULL,
  final_multiplier numeric(8, 4) NOT NULL,
  grav_score integer NOT NULL,
  power_result smallint NOT NULL,

  -- RNG
  random_seed double precision NOT NULL,
  event_index smallint NOT NULL,
  event_bonus text NOT NULL,

  -- fee
  launch_fee_flux numeric(18, 2) NOT NULL,
  ledger_entry_id bigint REFERENCES public.flux_ledger_entries(id),

  -- chain cutover columns
  chain_status text NOT NULL DEFAULT 'offchain',
  chain_tx_hash text,
  chain_block_number bigint,
  reconciled_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now()
);

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


-- 2. launch_rocket() RPC
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

  -- per-slot part records
  v_part_core_engine public.inventory_parts;
  v_part_wing_plate public.inventory_parts;
  v_part_fuel_cell public.inventory_parts;
  v_part_navigation_module public.inventory_parts;
  v_part_payload_bay public.inventory_parts;
  v_part_thruster_array public.inventory_parts;
  v_part_propulsion_cables public.inventory_parts;
  v_part_shielding public.inventory_parts;

  -- per-slot power (average of 3 attrs)
  v_power_core_engine numeric;
  v_power_wing_plate numeric;
  v_power_fuel_cell numeric;
  v_power_navigation_module numeric;
  v_power_payload_bay numeric;
  v_power_thruster_array numeric;
  v_power_propulsion_cables numeric;
  v_power_shielding numeric;

  -- per-slot part_value
  v_value_payload_bay numeric;

  -- aggregates
  v_total_power numeric;
  v_total_value numeric;
  v_total_rarity numeric;
  v_average_power numeric;
  v_average_rarity numeric;
  v_completion_ratio numeric := 1.0;  -- always 8/8

  -- metrics
  v_stability smallint;
  v_fuel_efficiency smallint;
  v_launch_power smallint;
  v_grav_score_base integer;
  v_win_probability smallint;
  v_base_multiplier numeric(8, 4);
  v_final_multiplier numeric(8, 4);
  v_grav_score integer;
  v_power_result smallint;

  -- RNG / event
  v_random_seed double precision;
  v_event_index smallint;
  v_event_bonus text;
  v_score_modifier numeric;
  v_power_modifier integer;

  -- fee
  v_launch_fee numeric(18, 2);
  v_new_balance numeric(38, 18);
  v_ledger_id bigint;
  v_launch_id bigint;

  -- idempotency
  v_existing_launch public.rocket_launches;

  -- model bonuses (standard model = all zeros)
  v_stability_bonus integer := 0;
  v_fuel_bonus integer := 0;
  v_power_bonus integer := 0;
  v_win_bonus integer := 0;
BEGIN
  -- Resolve wallet
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  -- Idempotency check
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

  /*
    Select best unlocked part per slot.
    getPartRank formula: (power * 100) + (partValue * 3) + (rarityTierId * 120) + createdAtScore
    where power = round((attr1 + attr2 + attr3) / 3)
    and createdAtScore = extract(epoch from created_at) / 1000000000
  */

  -- coreEngine
  SELECT ip.*
  INTO v_part_core_engine
  FROM public.inventory_parts ip
  JOIN public.part_variants pv ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs ON rs.id = pv.section_id
  WHERE ip.wallet_address = v_wallet
    AND rs.key = 'coreEngine'
    AND ip.is_locked = false
  ORDER BY (
    round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3) * 100
    + ip.part_value * 3
    + ip.rarity_tier_id * 120
    + extract(epoch from ip.created_at) / 1000000000.0
  ) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: coreEngine';
  END IF;

  -- wingPlate
  SELECT ip.*
  INTO v_part_wing_plate
  FROM public.inventory_parts ip
  JOIN public.part_variants pv ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs ON rs.id = pv.section_id
  WHERE ip.wallet_address = v_wallet
    AND rs.key = 'wingPlate'
    AND ip.is_locked = false
  ORDER BY (
    round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3) * 100
    + ip.part_value * 3
    + ip.rarity_tier_id * 120
    + extract(epoch from ip.created_at) / 1000000000.0
  ) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: wingPlate';
  END IF;

  -- fuelCell
  SELECT ip.*
  INTO v_part_fuel_cell
  FROM public.inventory_parts ip
  JOIN public.part_variants pv ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs ON rs.id = pv.section_id
  WHERE ip.wallet_address = v_wallet
    AND rs.key = 'fuelCell'
    AND ip.is_locked = false
  ORDER BY (
    round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3) * 100
    + ip.part_value * 3
    + ip.rarity_tier_id * 120
    + extract(epoch from ip.created_at) / 1000000000.0
  ) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: fuelCell';
  END IF;

  -- navigationModule
  SELECT ip.*
  INTO v_part_navigation_module
  FROM public.inventory_parts ip
  JOIN public.part_variants pv ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs ON rs.id = pv.section_id
  WHERE ip.wallet_address = v_wallet
    AND rs.key = 'navigationModule'
    AND ip.is_locked = false
  ORDER BY (
    round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3) * 100
    + ip.part_value * 3
    + ip.rarity_tier_id * 120
    + extract(epoch from ip.created_at) / 1000000000.0
  ) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: navigationModule';
  END IF;

  -- payloadBay
  SELECT ip.*
  INTO v_part_payload_bay
  FROM public.inventory_parts ip
  JOIN public.part_variants pv ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs ON rs.id = pv.section_id
  WHERE ip.wallet_address = v_wallet
    AND rs.key = 'payloadBay'
    AND ip.is_locked = false
  ORDER BY (
    round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3) * 100
    + ip.part_value * 3
    + ip.rarity_tier_id * 120
    + extract(epoch from ip.created_at) / 1000000000.0
  ) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: payloadBay';
  END IF;

  -- thrusterArray
  SELECT ip.*
  INTO v_part_thruster_array
  FROM public.inventory_parts ip
  JOIN public.part_variants pv ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs ON rs.id = pv.section_id
  WHERE ip.wallet_address = v_wallet
    AND rs.key = 'thrusterArray'
    AND ip.is_locked = false
  ORDER BY (
    round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3) * 100
    + ip.part_value * 3
    + ip.rarity_tier_id * 120
    + extract(epoch from ip.created_at) / 1000000000.0
  ) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: thrusterArray';
  END IF;

  -- propulsionCables
  SELECT ip.*
  INTO v_part_propulsion_cables
  FROM public.inventory_parts ip
  JOIN public.part_variants pv ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs ON rs.id = pv.section_id
  WHERE ip.wallet_address = v_wallet
    AND rs.key = 'propulsionCables'
    AND ip.is_locked = false
  ORDER BY (
    round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3) * 100
    + ip.part_value * 3
    + ip.rarity_tier_id * 120
    + extract(epoch from ip.created_at) / 1000000000.0
  ) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: propulsionCables';
  END IF;

  -- shielding
  SELECT ip.*
  INTO v_part_shielding
  FROM public.inventory_parts ip
  JOIN public.part_variants pv ON pv.id = ip.variant_id
  JOIN public.rocket_sections rs ON rs.id = pv.section_id
  WHERE ip.wallet_address = v_wallet
    AND rs.key = 'shielding'
    AND ip.is_locked = false
  ORDER BY (
    round((ip.attr1 + ip.attr2 + ip.attr3)::numeric / 3) * 100
    + ip.part_value * 3
    + ip.rarity_tier_id * 120
    + extract(epoch from ip.created_at) / 1000000000.0
  ) DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'missing part for slot: shielding';
  END IF;

  /*
    Compute per-slot power = round((attr1 + attr2 + attr3) / 3)
    This matches the TypeScript: Math.round((attr1 + attr2 + attr3) / 3)
  */
  v_power_core_engine := round((v_part_core_engine.attr1 + v_part_core_engine.attr2 + v_part_core_engine.attr3)::numeric / 3);
  v_power_wing_plate := round((v_part_wing_plate.attr1 + v_part_wing_plate.attr2 + v_part_wing_plate.attr3)::numeric / 3);
  v_power_fuel_cell := round((v_part_fuel_cell.attr1 + v_part_fuel_cell.attr2 + v_part_fuel_cell.attr3)::numeric / 3);
  v_power_navigation_module := round((v_part_navigation_module.attr1 + v_part_navigation_module.attr2 + v_part_navigation_module.attr3)::numeric / 3);
  v_power_payload_bay := round((v_part_payload_bay.attr1 + v_part_payload_bay.attr2 + v_part_payload_bay.attr3)::numeric / 3);
  v_power_thruster_array := round((v_part_thruster_array.attr1 + v_part_thruster_array.attr2 + v_part_thruster_array.attr3)::numeric / 3);
  v_power_propulsion_cables := round((v_part_propulsion_cables.attr1 + v_part_propulsion_cables.attr2 + v_part_propulsion_cables.attr3)::numeric / 3);
  v_power_shielding := round((v_part_shielding.attr1 + v_part_shielding.attr2 + v_part_shielding.attr3)::numeric / 3);

  v_value_payload_bay := v_part_payload_bay.part_value;

  -- Aggregates across all 8 ready parts
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

  /*
    Compute metrics — direct port of computeRocketLabMetrics()
    completion_ratio is always 1.0 (all 8 slots filled)
    Model is always 'standard' (all bonuses = 0)
  */

  -- stability = clamp(round(
  --   avgPower(['wingPlate','navigationModule','shielding','propulsionCables']) * 0.72
  --   + completionRatio * 28
  --   + stabilityBonus
  -- ), 0, 100)
  v_stability := LEAST(100, GREATEST(0, round(
    ((v_power_wing_plate + v_power_navigation_module + v_power_shielding + v_power_propulsion_cables) / 4.0) * 0.72
    + v_completion_ratio * 28
    + v_stability_bonus
  )))::smallint;

  -- fuelEfficiency = clamp(round(
  --   avgPower(['fuelCell','payloadBay','propulsionCables','coreEngine']) * 0.7
  --   + completionRatio * 24
  --   + fuelBonus
  -- ), 0, 100)
  v_fuel_efficiency := LEAST(100, GREATEST(0, round(
    ((v_power_fuel_cell + v_power_payload_bay + v_power_propulsion_cables + v_power_core_engine) / 4.0) * 0.7
    + v_completion_ratio * 24
    + v_fuel_bonus
  )))::smallint;

  -- launchPower = clamp(round(
  --   coreEngine.power * 0.34 + thrusterArray.power * 0.28
  --   + fuelCell.power * 0.18 + payloadBay.power * 0.1
  --   + propulsionCables.power * 0.1 + powerBonus
  -- ), 0, 100)
  v_launch_power := LEAST(100, GREATEST(0, round(
    v_power_core_engine * 0.34
    + v_power_thruster_array * 0.28
    + v_power_fuel_cell * 0.18
    + v_power_payload_bay * 0.1
    + v_power_propulsion_cables * 0.1
    + v_power_bonus
  )))::smallint;

  -- gravScoreBase = round(
  --   totalPower * (1 + completionRatio)
  --   + totalValue * 0.18
  --   + averageRarity * 45
  --   + payloadBay.partValue * 0.2
  -- )
  v_grav_score_base := round(
    v_total_power * (1 + v_completion_ratio)
    + v_total_value * 0.18
    + v_average_rarity * 45
    + v_value_payload_bay * 0.2
  )::integer;

  -- winProbability = clamp(round(
  --   completionRatio * 48 + averagePower * 0.3 + averageRarity * 3
  --   + stability * 0.12 + fuelEfficiency * 0.08
  --   + (readySlots === totalSlots ? 8 : 0) + winBonus
  -- ), 0, 96)
  v_win_probability := LEAST(96, GREATEST(0, round(
    v_completion_ratio * 48
    + v_average_power * 0.3
    + v_average_rarity * 3
    + v_stability * 0.12
    + v_fuel_efficiency * 0.08
    + 8  -- readySlots === totalSlots is always true
    + v_win_bonus
  )))::smallint;

  /*
    Simulate launch — direct port of simulateRocketLabLaunch()
  */

  -- Pick random event
  v_random_seed := random();
  v_event_index := floor(v_random_seed * 5)::smallint;

  -- Map event_index to event data
  -- Events array (matching SIMULATION_EVENTS in rocketLabAdapter.ts):
  --   0: { bonus: 'Clear corridor: no turbulence penalties',    scoreModifier:  0.10, powerModifier:  6 }
  --   1: { bonus: 'Solar crosswind: minor stability drag',      scoreModifier: -0.08, powerModifier: -4 }
  --   2: { bonus: 'Micrometeor scrape: shielding absorbs hit',  scoreModifier: -0.12, powerModifier: -7 }
  --   3: { bonus: 'Gravity sling: efficient burn window',       scoreModifier:  0.15, powerModifier:  8 }
  --   4: { bonus: 'Telemetry echo: navigation recalibration',   scoreModifier: -0.05, powerModifier: -3 }
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
      -- Fallback (should never happen since floor(random()*5) ∈ {0..4})
      v_event_bonus := 'Clear corridor: no turbulence penalties';
      v_score_modifier := 0.10;
      v_power_modifier := 6;
  END CASE;

  -- baseMultiplier = 1 + (winProbability / 140) + (launchPower / 220)
  v_base_multiplier := round(
    (1.0 + (v_win_probability::numeric / 140.0) + (v_launch_power::numeric / 220.0))::numeric
  , 4);

  -- finalMultiplier = baseMultiplier * (1 + scoreModifier)
  v_final_multiplier := round(
    (v_base_multiplier * (1.0 + v_score_modifier))::numeric
  , 4);

  -- grav_score = max(0, round(gravScoreBase * baseMultiplier * (1 + scoreModifier)))
  v_grav_score := GREATEST(0, round(
    v_grav_score_base * v_base_multiplier * (1.0 + v_score_modifier)
  ))::integer;

  -- power_result = clamp(launchPower + powerModifier, 0, 100)
  v_power_result := LEAST(100, GREATEST(0, v_launch_power + v_power_modifier))::smallint;

  /*
    Compute fee and debit Flux
  */
  v_launch_fee := round((v_total_value * 0.1)::numeric, 2);

  -- Ensure balance row exists
  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet,
    v_user_id,
    0,    -- no whitelist bonus from launch
    NULL, -- no client timestamp needed
    NULL  -- no user agent needed
  );

  v_new_balance := v_balance.available_balance - v_launch_fee;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient flux balance';
  END IF;

  -- Debit Flux via ledger entry
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

  -- Update wallet balance
  UPDATE public.wallet_flux_balances
  SET
    available_balance = v_new_balance,
    lifetime_spent = lifetime_spent + v_launch_fee,
    updated_at = now()
  WHERE wallet_address = v_wallet
  RETURNING * INTO v_balance;

  -- Insert launch record
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


-- 3. get_launch_history() RPC
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
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(row_data)
      FROM (
        SELECT jsonb_build_object(
          'launch_id', rl.id,
          'grav_score', rl.grav_score,
          'event_bonus', rl.event_bonus,
          'final_multiplier', rl.final_multiplier,
          'power', rl.power_result,
          'launch_fee_flux', rl.launch_fee_flux,
          'created_at', rl.created_at
        ) AS row_data
        FROM public.rocket_launches rl
        WHERE rl.wallet_address = v_wallet
        ORDER BY rl.created_at DESC
        LIMIT LEAST(p_limit, 50)
      ) sub
    ),
    '[]'::jsonb
  );
END;
$$;


-- 4. Heartbeat trigger on rocket_launches
DROP TRIGGER IF EXISTS touch_cosmic_jackpot_updates_from_rocket_launches ON public.rocket_launches;
CREATE TRIGGER touch_cosmic_jackpot_updates_from_rocket_launches
AFTER INSERT OR UPDATE OR DELETE ON public.rocket_launches
FOR EACH ROW
EXECUTE FUNCTION public.touch_cosmic_jackpot_updates();


-- 5. Update get_cosmic_jackpot_snapshot() to rank by cumulative GravScore
CREATE OR REPLACE FUNCTION public.get_cosmic_jackpot_snapshot()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH wallets AS (
  SELECT wallet_address
  FROM public.wallet_registry
),
app_log_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS app_events,
    MAX(created_at) AS last_app_event_at
  FROM public.app_logs
  WHERE wallet_address IS NOT NULL
  GROUP BY wallet_address
),
flux_event_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS flux_events,
    MAX(created_at) AS last_flux_event_at
  FROM public.flux_ledger_entries
  GROUP BY wallet_address
),
lock_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS lock_events,
    COALESCE(SUM(CASE WHEN is_lock_active THEN amount_eth ELSE 0 END), 0)::numeric(18, 6) AS eth_locked,
    MAX(GREATEST(COALESCE(updated_at, created_at), created_at)) AS last_lock_event_at
  FROM public.eth_lock_submissions
  GROUP BY wallet_address
),
wallet_balances AS (
  SELECT
    wallet_address,
    COALESCE(lifetime_spent, 0)::numeric(18, 2) AS flux_burned,
    updated_at AS last_balance_event_at
  FROM public.wallet_flux_balances
),
auction_submission_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS submission_events,
    MAX(created_at) AS last_submission_event_at
  FROM public.auction_submissions
  GROUP BY wallet_address
),
auction_bid_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS bid_events,
    MAX(created_at) AS last_bid_event_at
  FROM public.auction_bids
  GROUP BY wallet_address
),
launch_scores AS (
  SELECT
    wallet_address,
    COALESCE(SUM(grav_score), 0)::bigint AS cumulative_grav_score,
    COUNT(*)::int AS launch_count,
    MAX(created_at) AS last_launch_at
  FROM public.rocket_launches
  GROUP BY wallet_address
),
scored_wallets AS (
  SELECT
    w.wallet_address,
    (
      COALESCE(a.app_events, 0)
      + COALESCE(f.flux_events, 0)
      + COALESCE(l.lock_events, 0)
      + COALESCE(s.submission_events, 0)
      + COALESCE(b.bid_events, 0)
    )::int AS activity_events,
    COALESCE(bal.flux_burned, 0)::numeric(18, 2) AS flux_burned,
    COALESCE(l.eth_locked, 0)::numeric(18, 6) AS eth_locked,
    COALESCE(ls.cumulative_grav_score, 0)::bigint AS cumulative_grav_score,
    COALESCE(ls.launch_count, 0)::int AS launch_count,
    GREATEST(
      COALESCE(a.last_app_event_at, '-infinity'::timestamptz),
      COALESCE(f.last_flux_event_at, '-infinity'::timestamptz),
      COALESCE(l.last_lock_event_at, '-infinity'::timestamptz),
      COALESCE(bal.last_balance_event_at, '-infinity'::timestamptz),
      COALESCE(s.last_submission_event_at, '-infinity'::timestamptz),
      COALESCE(b.last_bid_event_at, '-infinity'::timestamptz),
      COALESCE(ls.last_launch_at, '-infinity'::timestamptz)
    ) AS last_activity_at
  FROM wallets w
  LEFT JOIN app_log_counts a
    ON a.wallet_address = w.wallet_address
  LEFT JOIN flux_event_counts f
    ON f.wallet_address = w.wallet_address
  LEFT JOIN lock_counts l
    ON l.wallet_address = w.wallet_address
  LEFT JOIN wallet_balances bal
    ON bal.wallet_address = w.wallet_address
  LEFT JOIN auction_submission_counts s
    ON s.wallet_address = w.wallet_address
  LEFT JOIN auction_bid_counts b
    ON b.wallet_address = w.wallet_address
  LEFT JOIN launch_scores ls
    ON ls.wallet_address = w.wallet_address
),
active_wallets AS (
  SELECT *
  FROM scored_wallets
  WHERE activity_events > 0
     OR flux_burned > 0
     OR eth_locked > 0
     OR cumulative_grav_score > 0
),
ranked_wallets AS (
  SELECT
    wallet_address,
    activity_events,
    flux_burned,
    eth_locked,
    cumulative_grav_score,
    launch_count,
    ROW_NUMBER() OVER (
      ORDER BY cumulative_grav_score DESC, flux_burned DESC, eth_locked DESC, wallet_address ASC
    )::int AS rank,
    last_activity_at
  FROM active_wallets
),
top_entries AS (
  SELECT
    wallet_address,
    activity_events,
    flux_burned,
    eth_locked,
    cumulative_grav_score,
    launch_count,
    rank,
    rank AS prev_rank,
    last_activity_at
  FROM ranked_wallets
  ORDER BY rank
  LIMIT 20
),
summary AS (
  SELECT
    (SELECT COUNT(*)::int FROM wallets) AS known_wallets,
    (SELECT COUNT(*)::int FROM active_wallets) AS active_players,
    COALESCE((SELECT SUM(activity_events) FROM active_wallets), 0)::int AS activity_events,
    COALESCE((SELECT SUM(flux_burned) FROM active_wallets), 0)::numeric(18, 2) AS flux_burned,
    COALESCE((SELECT SUM(eth_locked) FROM active_wallets), 0)::numeric(18, 6) AS locked_pool_eth,
    COALESCE((SELECT SUM(cumulative_grav_score) FROM active_wallets), 0)::bigint AS total_grav_score,
    COALESCE((SELECT SUM(launch_count) FROM active_wallets), 0)::int AS total_launches,
    COALESCE(
      (SELECT MAX(last_activity_at) FROM active_wallets),
      (SELECT updated_at FROM public.cosmic_jackpot_updates WHERE id = true),
      now()
    ) AS generated_at
)
SELECT jsonb_build_object(
  'source', 'activity_proxy',
  'generated_at', summary.generated_at,
  'summary', jsonb_build_object(
    'known_wallets', summary.known_wallets,
    'active_players', summary.active_players,
    'activity_events', summary.activity_events,
    'flux_burned', summary.flux_burned,
    'locked_pool_eth', summary.locked_pool_eth,
    'daily_eth_prize', ROUND((summary.locked_pool_eth * 0.5)::numeric, 6),
    'total_grav_score', summary.total_grav_score,
    'total_launches', summary.total_launches
  ),
  'entries', COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', wallet_address,
          'wallet_address', wallet_address,
          'activity_events', activity_events,
          'flux_burned', flux_burned,
          'eth_locked', eth_locked,
          'cumulative_grav_score', cumulative_grav_score,
          'launch_count', launch_count,
          'rank', rank,
          'prev_rank', prev_rank,
          'last_activity_at', last_activity_at
        )
        ORDER BY rank
      )
      FROM top_entries
    ),
    '[]'::jsonb
  )
)
FROM summary;
$$;

REVOKE ALL ON FUNCTION public.get_cosmic_jackpot_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_cosmic_jackpot_snapshot() FROM anon;
REVOKE ALL ON FUNCTION public.get_cosmic_jackpot_snapshot() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_cosmic_jackpot_snapshot() TO anon, authenticated;


-- 6. Grant permissions for new RPCs
REVOKE ALL ON FUNCTION public.launch_rocket(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.launch_rocket(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.launch_rocket(text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.get_launch_history(text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_launch_history(text, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_launch_history(text, integer) TO authenticated;

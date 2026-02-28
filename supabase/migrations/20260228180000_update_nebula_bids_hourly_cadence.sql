/*
  # Update Nebula Bids for hourly rounds and inventory power metadata

  ## Summary
  - Preserves migration safety for already-initialized databases
  - Moves auctions to 1-hour rounds with a 15-minute submission window
  - Selects the auction part by total power, then rarity, then submission age
  - Exposes total_power, serial_number, and is_shiny in auction RPC payloads

  ## Dependency
  This migration assumes the shared inventory contract already added:
  - inventory_parts.total_power
  - inventory_parts.serial_number
  - inventory_parts.is_shiny
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory_parts'
      AND column_name = 'total_power'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory_parts'
      AND column_name = 'serial_number'
  ) OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'inventory_parts'
      AND column_name = 'is_shiny'
  ) THEN
    RAISE EXCEPTION 'shared inventory fields (total_power, serial_number, is_shiny) must be present before applying the Nebula hourly auction update';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_auction_round()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_round_id bigint;
  v_starts_at timestamptz;
  v_submission_ends_at timestamptz;
  v_ends_at timestamptz;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.auction_rounds
    WHERE status IN ('accepting_submissions', 'bidding')
      AND ends_at > now()
  ) THEN
    RETURN jsonb_build_object('status', 'round_already_active');
  END IF;

  v_starts_at := now();
  v_submission_ends_at := v_starts_at + interval '15 minutes';
  v_ends_at := v_starts_at + interval '1 hour';

  INSERT INTO public.auction_rounds (
    status,
    starts_at,
    submission_ends_at,
    ends_at
  )
  VALUES (
    'accepting_submissions',
    v_starts_at,
    v_submission_ends_at,
    v_ends_at
  )
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

CREATE OR REPLACE FUNCTION public.transition_auction_to_bidding(
  p_round_id bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round public.auction_rounds;
  v_best_submission public.auction_submissions;
BEGIN
  IF p_round_id IS NULL THEN
    RAISE EXCEPTION 'p_round_id is required';
  END IF;

  SELECT *
  INTO v_round
  FROM public.auction_rounds
  WHERE id = p_round_id
    AND status = 'accepting_submissions'
    AND submission_ends_at <= now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'round_not_ready_for_transition');
  END IF;

  SELECT s.*
  INTO v_best_submission
  FROM public.auction_submissions s
  JOIN public.inventory_parts ip
    ON ip.id = s.part_id
  WHERE s.round_id = p_round_id
  ORDER BY ip.total_power DESC, s.rarity_tier_id DESC, s.created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    UPDATE public.auction_rounds
    SET
      status = 'no_submissions',
      updated_at = now()
    WHERE id = p_round_id;

    RETURN jsonb_build_object(
      'status', 'no_submissions',
      'round_id', p_round_id
    );
  END IF;

  UPDATE public.auction_submissions
  SET is_selected = true
  WHERE id = v_best_submission.id;

  UPDATE public.inventory_parts
  SET
    is_locked = false,
    updated_at = now()
  WHERE id IN (
    SELECT part_id
    FROM public.auction_submissions
    WHERE round_id = p_round_id
      AND id <> v_best_submission.id
  );

  UPDATE public.auction_rounds
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

CREATE OR REPLACE FUNCTION public.get_active_auction()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_round public.auction_rounds;
  v_bids jsonb;
  v_part_info jsonb;
BEGIN
  SELECT *
  INTO v_round
  FROM public.auction_rounds
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
      'attr1', ip.attr1,
      'attr2', ip.attr2,
      'attr3', ip.attr3,
      'attr1_name', rs.attr1_name,
      'attr2_name', rs.attr2_name,
      'attr3_name', rs.attr3_name,
      'part_value', ip.part_value,
      'total_power', ip.total_power,
      'serial_number', ip.serial_number,
      'is_shiny', COALESCE(ip.is_shiny, false),
      'submitted_by', v_round.selected_by_wallet
    )
    INTO v_part_info
    FROM public.inventory_parts ip
    JOIN public.part_variants pv
      ON pv.id = ip.variant_id
    JOIN public.rocket_sections rs
      ON rs.id = pv.section_id
    JOIN public.rarity_tiers rt
      ON rt.id = ip.rarity_tier_id
    WHERE ip.id = v_round.selected_part_id;
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ab.id,
        'wallet', ab.wallet_address,
        'amount', ab.amount,
        'created_at', ab.created_at
      )
      ORDER BY ab.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO v_bids
  FROM public.auction_bids ab
  WHERE ab.round_id = v_round.id
    AND NOT ab.is_refunded;

  RETURN jsonb_build_object(
    'round_id', v_round.id,
    'status', v_round.status,
    'starts_at', v_round.starts_at,
    'submission_ends_at', v_round.submission_ends_at,
    'ends_at', v_round.ends_at,
    'bidding_opens_at', v_round.bidding_opens_at,
    'part', v_part_info,
    'bids', v_bids,
    'current_highest_bid', (
      SELECT COALESCE(MAX(amount), 0)
      FROM public.auction_bids
      WHERE round_id = v_round.id
        AND NOT is_refunded
    ),
    'bid_count', (
      SELECT COUNT(*)
      FROM public.auction_bids
      WHERE round_id = v_round.id
        AND NOT is_refunded
    )
  );
END;
$$;

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
        ip.total_power,
        ip.serial_number,
        COALESCE(ip.is_shiny, false) AS is_shiny,
        rs.display_name AS section_name,
        ar.selected_by_wallet AS seller_wallet
      FROM public.auction_rounds ar
      LEFT JOIN public.inventory_parts ip
        ON ip.id = ar.selected_part_id
      LEFT JOIN public.part_variants pv
        ON pv.id = ip.variant_id
      LEFT JOIN public.rocket_sections rs
        ON rs.id = pv.section_id
      LEFT JOIN public.rarity_tiers rt
        ON rt.id = ip.rarity_tier_id
      WHERE ar.status IN ('completed', 'no_submissions')
      ORDER BY ar.ends_at DESC
      LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100))
      OFFSET GREATEST(0, COALESCE(p_offset, 0))
    ) q
  );
END;
$$;

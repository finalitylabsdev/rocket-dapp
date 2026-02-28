/*
  # Add Nebula Bids auction tables and RPCs

  ## Summary
  - Adds round, submission, and bid tables for server-backed auctions
  - Locks inventory parts during auction submission
  - Escrows bid Flux in the existing ledger
  - Adds lifecycle RPCs for round start, transition, and finalization
*/

CREATE TABLE IF NOT EXISTS auction_rounds (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status text NOT NULL DEFAULT 'accepting_submissions'
    CHECK (status IN ('accepting_submissions', 'bidding', 'finalizing', 'completed', 'no_submissions')),
  starts_at timestamptz NOT NULL,
  submission_ends_at timestamptz NOT NULL,
  bidding_opens_at timestamptz,
  ends_at timestamptz NOT NULL,
  selected_part_id uuid REFERENCES inventory_parts(id),
  selected_by_wallet text REFERENCES wallet_registry(wallet_address),
  winning_bid_id bigint,
  final_price numeric(38, 18),
  winner_wallet text REFERENCES wallet_registry(wallet_address),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auction_rounds_status_idx
  ON auction_rounds (status, ends_at);

CREATE INDEX IF NOT EXISTS auction_rounds_ends_at_idx
  ON auction_rounds (ends_at DESC);

CREATE TABLE IF NOT EXISTS auction_submissions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  round_id bigint NOT NULL REFERENCES auction_rounds(id) ON DELETE CASCADE,
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES inventory_parts(id) ON DELETE RESTRICT,
  rarity_tier_id smallint NOT NULL REFERENCES rarity_tiers(id),
  part_value numeric(10, 2) NOT NULL,
  is_selected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round_id, wallet_address),
  UNIQUE (round_id, part_id)
);

CREATE INDEX IF NOT EXISTS auction_submissions_round_idx
  ON auction_submissions (round_id, is_selected);

CREATE TABLE IF NOT EXISTS auction_bids (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  round_id bigint NOT NULL REFERENCES auction_rounds(id) ON DELETE CASCADE,
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(38, 18) NOT NULL CHECK (amount > 0),
  is_winning boolean NOT NULL DEFAULT false,
  is_refunded boolean NOT NULL DEFAULT false,
  escrow_ledger_id bigint REFERENCES flux_ledger_entries(id) ON DELETE RESTRICT,
  refund_ledger_id bigint REFERENCES flux_ledger_entries(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auction_bids_round_idx
  ON auction_bids (round_id, amount DESC);

CREATE INDEX IF NOT EXISTS auction_bids_wallet_idx
  ON auction_bids (wallet_address, round_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'auction_rounds_winning_bid_fk'
  ) THEN
    ALTER TABLE public.auction_rounds
      ADD CONSTRAINT auction_rounds_winning_bid_fk
      FOREIGN KEY (winning_bid_id) REFERENCES public.auction_bids(id);
  END IF;
END;
$$;

ALTER TABLE auction_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read auction rounds" ON auction_rounds;
CREATE POLICY "Read auction rounds"
  ON auction_rounds
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Read auction submissions" ON auction_submissions;
CREATE POLICY "Read auction submissions"
  ON auction_submissions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Read auction bids" ON auction_bids;
CREATE POLICY "Read auction bids"
  ON auction_bids
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE ON auction_rounds FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON auction_submissions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON auction_bids FROM anon, authenticated;

GRANT SELECT ON auction_rounds TO authenticated;
GRANT SELECT ON auction_submissions TO authenticated;
GRANT SELECT ON auction_bids TO authenticated;

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
  v_part public.inventory_parts;
  v_round public.auction_rounds;
  v_submission_id bigint;
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

  IF v_part.rarity_tier_id < 3 THEN
    RAISE EXCEPTION 'part rarity must be Rare (tier 3) or above to auction';
  END IF;

  SELECT *
  INTO v_round
  FROM public.auction_rounds
  WHERE status = 'accepting_submissions'
    AND starts_at <= now()
    AND submission_ends_at > now()
  ORDER BY starts_at DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no active auction round accepting submissions';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.auction_submissions
    WHERE round_id = v_round.id
      AND wallet_address = v_wallet
  ) THEN
    RAISE EXCEPTION 'already submitted a part for this auction round';
  END IF;

  UPDATE public.inventory_parts
  SET
    is_locked = true,
    updated_at = now()
  WHERE id = v_part.id;

  INSERT INTO public.auction_submissions (
    round_id,
    wallet_address,
    auth_user_id,
    part_id,
    rarity_tier_id,
    part_value
  )
  VALUES (
    v_round.id,
    v_wallet,
    v_user_id,
    v_part.id,
    v_part.rarity_tier_id,
    v_part.part_value
  )
  RETURNING id INTO v_submission_id;

  RETURN jsonb_build_object(
    'submission_id', v_submission_id,
    'round_id', v_round.id,
    'part_id', v_part.id,
    'status', 'submitted'
  );
END;
$$;

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
  v_round public.auction_rounds;
  v_current_highest numeric(38, 18);
  v_min_bid numeric(38, 18);
  v_balance public.wallet_flux_balances;
  v_new_balance numeric(38, 18);
  v_previous_bid_id bigint;
  v_previous_bid_amount numeric(38, 18) := 0;
  v_escrow_ledger_id bigint;
  v_bid_id bigint;
  v_effective_deduction numeric(38, 18);
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  IF p_round_id IS NULL THEN
    RAISE EXCEPTION 'p_round_id is required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be greater than zero';
  END IF;

  SELECT *
  INTO v_round
  FROM public.auction_rounds
  WHERE id = p_round_id
    AND status = 'bidding'
    AND ends_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'auction round is not currently accepting bids';
  END IF;

  IF v_round.selected_by_wallet = v_wallet THEN
    RAISE EXCEPTION 'cannot bid on your own submitted item';
  END IF;

  SELECT COALESCE(MAX(amount), 0)
  INTO v_current_highest
  FROM public.auction_bids
  WHERE round_id = p_round_id
    AND NOT is_refunded;

  IF v_current_highest > 0 THEN
    v_min_bid := v_current_highest + round(v_current_highest * 0.05, 2);
  ELSE
    v_min_bid := 1;
  END IF;

  IF p_amount < v_min_bid THEN
    RAISE EXCEPTION 'bid must be at least % Flux (current highest + 5%%)', v_min_bid;
  END IF;

  SELECT id, amount
  INTO v_previous_bid_id, v_previous_bid_amount
  FROM public.auction_bids
  WHERE round_id = p_round_id
    AND wallet_address = v_wallet
    AND NOT is_refunded
  ORDER BY amount DESC
  LIMIT 1
  FOR UPDATE;

  IF v_previous_bid_id IS NOT NULL THEN
    v_effective_deduction := p_amount - v_previous_bid_amount;
  ELSE
    v_effective_deduction := p_amount;
  END IF;

  IF v_effective_deduction <= 0 THEN
    RAISE EXCEPTION 'new bid must exceed your previous bid';
  END IF;

  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet,
    v_user_id,
    p_whitelist_bonus_amount,
    p_client_timestamp,
    p_user_agent
  );

  v_new_balance := v_balance.available_balance - v_effective_deduction;
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient flux balance';
  END IF;

  IF v_previous_bid_id IS NOT NULL THEN
    UPDATE public.auction_bids
    SET is_refunded = true
    WHERE id = v_previous_bid_id;
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
    user_agent
  )
  VALUES (
    v_wallet,
    v_user_id,
    'adjustment',
    -v_effective_deduction,
    'offchain_message',
    'confirmed',
    jsonb_build_object(
      'reason', 'auction_bid_escrow',
      'context', jsonb_build_object(
        'round_id', p_round_id,
        'bid_amount', p_amount,
        'previous_bid', v_previous_bid_amount,
        'effective_deduction', v_effective_deduction
      )
    ),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  RETURNING id INTO v_escrow_ledger_id;

  UPDATE public.wallet_flux_balances
  SET
    available_balance = v_new_balance,
    lifetime_spent = lifetime_spent + v_effective_deduction,
    updated_at = now()
  WHERE wallet_address = v_wallet
  RETURNING * INTO v_balance;

  INSERT INTO public.auction_bids (
    round_id,
    wallet_address,
    auth_user_id,
    amount,
    escrow_ledger_id
  )
  VALUES (
    p_round_id,
    v_wallet,
    v_user_id,
    p_amount,
    v_escrow_ledger_id
  )
  RETURNING id INTO v_bid_id;

  RETURN jsonb_build_object(
    'bid_id', v_bid_id,
    'round_id', p_round_id,
    'amount', p_amount,
    'min_next_bid', p_amount + round(p_amount * 0.05, 2),
    'balance', to_jsonb(v_balance)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_auction(
  p_round_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round public.auction_rounds;
  v_winning_bid public.auction_bids;
  v_selected_submission public.auction_submissions;
  v_refund_bid RECORD;
  v_refund_ledger_id bigint;
BEGIN
  IF p_round_id IS NOT NULL THEN
    SELECT *
    INTO v_round
    FROM public.auction_rounds
    WHERE id = p_round_id
      AND status = 'bidding'
      AND ends_at <= now()
    FOR UPDATE;
  ELSE
    SELECT *
    INTO v_round
    FROM public.auction_rounds
    WHERE status = 'bidding'
      AND ends_at <= now()
    ORDER BY ends_at ASC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_round_to_finalize');
  END IF;

  SELECT *
  INTO v_selected_submission
  FROM public.auction_submissions
  WHERE round_id = v_round.id
    AND is_selected = true
  LIMIT 1;

  IF NOT FOUND OR v_round.selected_part_id IS NULL OR v_round.selected_by_wallet IS NULL THEN
    RAISE EXCEPTION 'auction round % is missing its selected submission', v_round.id;
  END IF;

  UPDATE public.auction_rounds
  SET
    status = 'finalizing',
    updated_at = now()
  WHERE id = v_round.id;

  SELECT *
  INTO v_winning_bid
  FROM public.auction_bids
  WHERE round_id = v_round.id
    AND NOT is_refunded
  ORDER BY amount DESC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    UPDATE public.inventory_parts
    SET
      is_locked = false,
      updated_at = now()
    WHERE id = v_round.selected_part_id;

    UPDATE public.inventory_parts
    SET
      is_locked = false,
      updated_at = now()
    WHERE id IN (
      SELECT part_id
      FROM public.auction_submissions
      WHERE round_id = v_round.id
        AND NOT is_selected
    );

    UPDATE public.auction_rounds
    SET
      status = 'completed',
      updated_at = now()
    WHERE id = v_round.id;

    RETURN jsonb_build_object(
      'status', 'completed_no_bids',
      'round_id', v_round.id
    );
  END IF;

  UPDATE public.auction_bids
  SET is_winning = true
  WHERE id = v_winning_bid.id;

  FOR v_refund_bid IN
    SELECT id, wallet_address, auth_user_id, amount
    FROM public.auction_bids
    WHERE round_id = v_round.id
      AND id <> v_winning_bid.id
      AND NOT is_refunded
  LOOP
    INSERT INTO public.flux_ledger_entries (
      wallet_address,
      auth_user_id,
      entry_type,
      amount_flux,
      settlement_kind,
      settlement_status,
      payload
    )
    VALUES (
      v_refund_bid.wallet_address,
      v_refund_bid.auth_user_id,
      'adjustment',
      v_refund_bid.amount,
      'offchain_message',
      'confirmed',
      jsonb_build_object(
        'reason', 'auction_bid_refund',
        'context', jsonb_build_object(
          'round_id', v_round.id,
          'bid_id', v_refund_bid.id
        )
      )
    )
    RETURNING id INTO v_refund_ledger_id;

    UPDATE public.wallet_flux_balances
    SET
      available_balance = available_balance + v_refund_bid.amount,
      updated_at = now()
    WHERE wallet_address = v_refund_bid.wallet_address;

    UPDATE public.auction_bids
    SET
      is_refunded = true,
      refund_ledger_id = v_refund_ledger_id
    WHERE id = v_refund_bid.id;
  END LOOP;

  UPDATE public.inventory_parts
  SET
    wallet_address = v_winning_bid.wallet_address,
    auth_user_id = v_winning_bid.auth_user_id,
    is_locked = false,
    source = 'auction_win',
    source_ref = v_round.id::text,
    updated_at = now()
  WHERE id = v_round.selected_part_id;

  PERFORM public.ensure_wallet_flux_balance_row(
    v_round.selected_by_wallet,
    v_selected_submission.auth_user_id,
    0,
    NULL,
    'auction-finalize'
  );

  INSERT INTO public.flux_ledger_entries (
    wallet_address,
    auth_user_id,
    entry_type,
    amount_flux,
    settlement_kind,
    settlement_status,
    payload
  )
  VALUES (
    v_round.selected_by_wallet,
    v_selected_submission.auth_user_id,
    'adjustment',
    v_winning_bid.amount,
    'offchain_message',
    'confirmed',
    jsonb_build_object(
      'reason', 'auction_sale_proceeds',
      'context', jsonb_build_object(
        'round_id', v_round.id,
        'winning_bid_id', v_winning_bid.id,
        'buyer_wallet', v_winning_bid.wallet_address
      )
    )
  );

  UPDATE public.wallet_flux_balances
  SET
    available_balance = available_balance + v_winning_bid.amount,
    updated_at = now()
  WHERE wallet_address = v_round.selected_by_wallet;

  UPDATE public.inventory_parts
  SET
    is_locked = false,
    updated_at = now()
  WHERE id IN (
    SELECT part_id
    FROM public.auction_submissions
    WHERE round_id = v_round.id
      AND NOT is_selected
  );

  UPDATE public.auction_rounds
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'auction_rounds'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_rounds;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'auction_submissions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_submissions;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'auction_bids'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_auction_item(text, uuid, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_auction_item(text, uuid, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_auction_item(text, uuid, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.place_auction_bid(text, bigint, numeric, numeric, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.place_auction_bid(text, bigint, numeric, numeric, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.place_auction_bid(text, bigint, numeric, numeric, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.finalize_auction(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_auction(bigint) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_auction(bigint) TO service_role;

REVOKE ALL ON FUNCTION public.start_auction_round() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_auction_round() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_auction_round() TO service_role;

REVOKE ALL ON FUNCTION public.transition_auction_to_bidding(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transition_auction_to_bidding(bigint) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_auction_to_bidding(bigint) TO service_role;

REVOKE ALL ON FUNCTION public.get_active_auction() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_active_auction() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_active_auction() TO authenticated;

REVOKE ALL ON FUNCTION public.get_auction_history(integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_auction_history(integer, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_auction_history(integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.place_auction_bid(
  p_wallet_address text,
  p_round_id bigint,
  p_amount numeric,
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
  v_existing_entry public.flux_ledger_entries;
  v_existing_bid public.auction_bids;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  -- Idempotency check: return existing bid result
  IF p_idempotency_key IS NOT NULL THEN
    SELECT *
    INTO v_existing_entry
    FROM flux_ledger_entries
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      SELECT *
      INTO v_balance
      FROM wallet_flux_balances
      WHERE wallet_address = v_existing_entry.wallet_address;

      SELECT *
      INTO v_existing_bid
      FROM auction_bids
      WHERE escrow_ledger_id = v_existing_entry.id;

      RETURN jsonb_build_object(
        'bid_id', COALESCE(v_existing_bid.id, 0),
        'round_id', p_round_id,
        'amount', p_amount,
        'min_next_bid', p_amount + round(p_amount * 0.05, 2),
        'balance', to_jsonb(v_balance)
      );
    END IF;
  END IF;

  IF p_round_id IS NULL THEN
    RAISE EXCEPTION 'p_round_id is required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be greater than zero';
  END IF;

  IF p_amount <> round(p_amount, 2) THEN
    RAISE EXCEPTION 'bid must use at most 2 decimal places';
  END IF;

  IF p_amount > 100000 THEN
    RAISE EXCEPTION 'bid must be less than or equal to 100000 Flux';
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
    user_agent,
    idempotency_key
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
    p_user_agent,
    p_idempotency_key
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

/*
  # Add idempotency keys to FLUX ledger mutations

  ## Summary
  - Adds idempotency_key column to flux_ledger_entries with a unique constraint
  - Updates record_flux_faucet_claim to accept and enforce idempotency keys
  - Updates adjust_wallet_flux_balance to accept and enforce idempotency keys
  - Updates open_mystery_box to accept and enforce idempotency keys
  - Updates place_auction_bid to accept and enforce idempotency keys
  - Updates finalize_auction to generate idempotency keys for refund/payout entries

  When a duplicate key is detected, each RPC returns the existing ledger entry
  result instead of inserting a new row. This prevents double-credit/debit from
  retried client calls or scheduler re-runs.
*/

-- 1. Add idempotency_key column
ALTER TABLE flux_ledger_entries
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS flux_ledger_entries_idempotency_key_idx
  ON flux_ledger_entries (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 2. Update record_flux_faucet_claim with idempotency support
CREATE OR REPLACE FUNCTION public.record_flux_faucet_claim(
  p_wallet_address text,
  p_claim_amount numeric,
  p_claim_window_seconds integer,
  p_settlement_kind text DEFAULT 'offchain_message',
  p_settlement_status text DEFAULT 'confirmed',
  p_signed_message text DEFAULT NULL,
  p_signature text DEFAULT NULL,
  p_message_nonce text DEFAULT NULL,
  p_tx_hash text DEFAULT NULL,
  p_chain_id bigint DEFAULT NULL,
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
  v_claimed_at timestamptz;
  v_entry_id bigint;
  v_recent_claims integer;
  v_existing_entry public.flux_ledger_entries;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  -- Idempotency check: return existing result if key already used
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

      RETURN to_jsonb(v_balance) || jsonb_build_object('ledger_entry_id', v_existing_entry.id);
    END IF;
  END IF;

  IF p_claim_amount IS NULL OR p_claim_amount <= 0 OR p_claim_amount > 1000000 THEN
    RAISE EXCEPTION 'p_claim_amount is out of range';
  END IF;

  IF p_claim_window_seconds IS NULL OR p_claim_window_seconds < 0 OR p_claim_window_seconds > 604800 THEN
    RAISE EXCEPTION 'p_claim_window_seconds is out of range';
  END IF;

  IF p_settlement_kind IS NULL OR btrim(p_settlement_kind) = '' THEN
    RAISE EXCEPTION 'p_settlement_kind is required';
  END IF;

  IF p_settlement_kind NOT IN ('offchain_message', 'onchain_transaction') THEN
    RAISE EXCEPTION 'invalid p_settlement_kind: %', p_settlement_kind;
  END IF;

  IF p_settlement_status IS NULL OR btrim(p_settlement_status) = '' THEN
    RAISE EXCEPTION 'p_settlement_status is required';
  END IF;

  IF p_settlement_status NOT IN ('pending', 'confirmed', 'failed') THEN
    RAISE EXCEPTION 'invalid p_settlement_status: %', p_settlement_status;
  END IF;

  IF p_settlement_kind = 'offchain_message' THEN
    IF p_settlement_status <> 'confirmed' THEN
      RAISE EXCEPTION 'offchain_message claims must use confirmed settlement status';
    END IF;

    IF p_signed_message IS NULL OR btrim(p_signed_message) = '' THEN
      RAISE EXCEPTION 'p_signed_message is required';
    END IF;

    IF p_signature IS NULL OR btrim(p_signature) = '' THEN
      RAISE EXCEPTION 'p_signature is required';
    END IF;

    IF lower(btrim(p_signature)) !~ '^0x[0-9a-f]+$' THEN
      RAISE EXCEPTION 'p_signature must be a hex string';
    END IF;

    IF p_message_nonce IS NULL OR btrim(p_message_nonce) = '' THEN
      RAISE EXCEPTION 'p_message_nonce is required';
    END IF;
  END IF;

  IF p_settlement_kind = 'onchain_transaction' THEN
    IF p_tx_hash IS NULL OR btrim(p_tx_hash) = '' THEN
      RAISE EXCEPTION 'p_tx_hash is required';
    END IF;

    IF lower(btrim(p_tx_hash)) !~ '^0x[0-9a-f]{64}$' THEN
      RAISE EXCEPTION 'p_tx_hash must be a 32-byte transaction hash';
    END IF;
  END IF;

  SELECT count(*)
  INTO v_recent_claims
  FROM flux_ledger_entries
  WHERE auth_user_id = v_user_id
    AND entry_type = 'faucet_claim'
    AND created_at >= now() - interval '15 minutes';

  IF v_recent_claims >= 30 THEN
    RAISE EXCEPTION 'rate limit exceeded for flux faucet claims';
  END IF;

  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet,
    v_user_id,
    p_whitelist_bonus_amount,
    p_client_timestamp,
    p_user_agent
  );

  IF v_balance.last_faucet_claimed_at IS NOT NULL
     AND v_balance.last_faucet_claimed_at + make_interval(secs => p_claim_window_seconds) > now() THEN
    RAISE EXCEPTION 'flux faucet claim is still on cooldown';
  END IF;

  v_claimed_at := now();

  INSERT INTO flux_ledger_entries (
    wallet_address,
    auth_user_id,
    entry_type,
    amount_flux,
    settlement_kind,
    settlement_status,
    signed_message,
    signature,
    message_nonce,
    tx_hash,
    payload,
    client_timestamp,
    user_agent,
    idempotency_key
  )
  VALUES (
    v_wallet,
    v_user_id,
    'faucet_claim',
    p_claim_amount,
    p_settlement_kind,
    p_settlement_status,
    CASE WHEN p_settlement_kind = 'offchain_message' THEN p_signed_message ELSE NULL END,
    CASE WHEN p_settlement_kind = 'offchain_message' THEN lower(btrim(p_signature)) ELSE NULL END,
    CASE WHEN p_settlement_kind = 'offchain_message' THEN btrim(p_message_nonce) ELSE NULL END,
    CASE WHEN p_settlement_kind = 'onchain_transaction' THEN lower(btrim(p_tx_hash)) ELSE NULL END,
    jsonb_build_object(
      'claim_window_seconds', p_claim_window_seconds,
      'chain_id', p_chain_id
    ),
    COALESCE(p_client_timestamp, v_claimed_at),
    p_user_agent,
    p_idempotency_key
  )
  RETURNING id INTO v_entry_id;

  IF p_settlement_status = 'confirmed' THEN
    UPDATE wallet_flux_balances
    SET
      available_balance = available_balance + p_claim_amount,
      lifetime_claimed = lifetime_claimed + p_claim_amount,
      last_faucet_claimed_at = v_claimed_at,
      updated_at = now()
    WHERE wallet_address = v_wallet
    RETURNING * INTO v_balance;
  END IF;

  RETURN to_jsonb(v_balance) || jsonb_build_object('ledger_entry_id', v_entry_id);
END;
$$;

-- 3. Update adjust_wallet_flux_balance with idempotency support
CREATE OR REPLACE FUNCTION public.adjust_wallet_flux_balance(
  p_wallet_address text,
  p_delta_flux numeric,
  p_reason text,
  p_payload jsonb DEFAULT '{}'::jsonb,
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
  v_reason text;
  v_entry_id bigint;
  v_new_balance numeric(38, 18);
  v_existing_entry public.flux_ledger_entries;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  -- Idempotency check
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

      RETURN to_jsonb(v_balance) || jsonb_build_object('ledger_entry_id', v_existing_entry.id);
    END IF;
  END IF;

  IF p_delta_flux IS NULL OR p_delta_flux = 0 OR p_delta_flux < -1000000 OR p_delta_flux > 1000000 THEN
    RAISE EXCEPTION 'p_delta_flux is out of range';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'p_reason is required';
  END IF;

  v_reason := lower(btrim(p_reason));
  IF v_reason !~ '^[a-z0-9_:-]{2,64}$' THEN
    RAISE EXCEPTION 'invalid flux adjustment reason: %', p_reason;
  END IF;

  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet,
    v_user_id,
    p_whitelist_bonus_amount,
    p_client_timestamp,
    p_user_agent
  );

  v_new_balance := v_balance.available_balance + p_delta_flux;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'insufficient flux balance';
  END IF;

  INSERT INTO flux_ledger_entries (
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
    p_delta_flux,
    'offchain_message',
    'confirmed',
    jsonb_build_object(
      'reason', v_reason,
      'context', COALESCE(p_payload, '{}'::jsonb)
    ),
    COALESCE(p_client_timestamp, now()),
    p_user_agent,
    p_idempotency_key
  )
  RETURNING id INTO v_entry_id;

  UPDATE wallet_flux_balances
  SET
    available_balance = v_new_balance,
    lifetime_spent = lifetime_spent + CASE WHEN p_delta_flux < 0 THEN abs(p_delta_flux) ELSE 0 END,
    updated_at = now()
  WHERE wallet_address = v_wallet
  RETURNING * INTO v_balance;

  RETURN to_jsonb(v_balance) || jsonb_build_object('ledger_entry_id', v_entry_id);
END;
$$;

-- 4. Update open_mystery_box with idempotency support
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
  v_part_value numeric(10, 2);
  v_part_id uuid;
  v_ledger_id bigint;
  v_total_weight integer;
  v_roll numeric;
  v_existing_entry public.flux_ledger_entries;
  v_existing_part public.inventory_parts;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  -- Idempotency check: return existing box open result
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

      -- Find the part created by this box open via source_ref
      SELECT *
      INTO v_existing_part
      FROM inventory_parts
      WHERE source_ref = v_existing_entry.id::text
        AND source = 'mystery_box';

      IF FOUND THEN
        RETURN jsonb_build_object(
          'part', jsonb_build_object(
            'id', v_existing_part.id,
            'name', (SELECT pv.name FROM part_variants pv WHERE pv.id = v_existing_part.variant_id),
            'section_key', (SELECT rs.key FROM rocket_sections rs JOIN part_variants pv ON pv.section_id = rs.id WHERE pv.id = v_existing_part.variant_id),
            'section_name', (SELECT rs.display_name FROM rocket_sections rs JOIN part_variants pv ON pv.section_id = rs.id WHERE pv.id = v_existing_part.variant_id),
            'rarity', (SELECT rt.name FROM rarity_tiers rt WHERE rt.id = v_existing_part.rarity_tier_id),
            'rarity_tier_id', v_existing_part.rarity_tier_id,
            'attr1', v_existing_part.attr1,
            'attr2', v_existing_part.attr2,
            'attr3', v_existing_part.attr3,
            'attr1_name', (SELECT rs.attr1_name FROM rocket_sections rs JOIN part_variants pv ON pv.section_id = rs.id WHERE pv.id = v_existing_part.variant_id),
            'attr2_name', (SELECT rs.attr2_name FROM rocket_sections rs JOIN part_variants pv ON pv.section_id = rs.id WHERE pv.id = v_existing_part.variant_id),
            'attr3_name', (SELECT rs.attr3_name FROM rocket_sections rs JOIN part_variants pv ON pv.section_id = rs.id WHERE pv.id = v_existing_part.variant_id),
            'part_value', v_existing_part.part_value,
            'is_locked', v_existing_part.is_locked,
            'is_equipped', v_existing_part.is_equipped,
            'source', v_existing_part.source,
            'created_at', v_existing_part.created_at
          ),
          'balance', to_jsonb(v_balance),
          'ledger_entry_id', v_existing_entry.id
        );
      END IF;

      -- Fallback if part not found (shouldn't happen)
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
  v_part_value := round(((v_attr1 + v_attr2 + v_attr3)::numeric * v_drop_rarity.multiplier)::numeric, 2);

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
      'part_value', v_part_value,
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

-- 5. Update place_auction_bid with idempotency support
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

-- 6. Update finalize_auction with idempotency keys for refund/payout entries
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
      payload,
      idempotency_key
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
      ),
      'finalize_refund:' || v_round.id || ':' || v_refund_bid.id
    )
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
    RETURNING id INTO v_refund_ledger_id;

    -- Only update balance if we actually inserted (not a duplicate)
    IF v_refund_ledger_id IS NOT NULL THEN
      UPDATE public.wallet_flux_balances
      SET
        available_balance = available_balance + v_refund_bid.amount,
        updated_at = now()
      WHERE wallet_address = v_refund_bid.wallet_address;
    ELSE
      SELECT id INTO v_refund_ledger_id
      FROM flux_ledger_entries
      WHERE idempotency_key = 'finalize_refund:' || v_round.id || ':' || v_refund_bid.id;
    END IF;

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
    payload,
    idempotency_key
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
    ),
    'finalize_payout:' || v_round.id || ':' || v_winning_bid.id
  )
  ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

  -- Only credit seller if we actually inserted
  IF FOUND THEN
    UPDATE public.wallet_flux_balances
    SET
      available_balance = available_balance + v_winning_bid.amount,
      updated_at = now()
    WHERE wallet_address = v_round.selected_by_wallet;
  END IF;

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

-- 7. Re-grant permissions for updated function signatures

REVOKE ALL ON FUNCTION public.record_flux_faucet_claim(text, numeric, integer, text, text, text, text, text, text, bigint, numeric, timestamptz, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_flux_faucet_claim(text, numeric, integer, text, text, text, text, text, text, bigint, numeric, timestamptz, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_flux_faucet_claim(text, numeric, integer, text, text, text, text, text, text, bigint, numeric, timestamptz, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.adjust_wallet_flux_balance(text, numeric, text, jsonb, numeric, timestamptz, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.adjust_wallet_flux_balance(text, numeric, text, jsonb, numeric, timestamptz, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.adjust_wallet_flux_balance(text, numeric, text, jsonb, numeric, timestamptz, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.open_mystery_box(text, text, numeric, timestamptz, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.open_mystery_box(text, text, numeric, timestamptz, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.open_mystery_box(text, text, numeric, timestamptz, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.place_auction_bid(text, bigint, numeric, numeric, timestamptz, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.place_auction_bid(text, bigint, numeric, numeric, timestamptz, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.place_auction_bid(text, bigint, numeric, numeric, timestamptz, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.finalize_auction(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_auction(bigint) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_auction(bigint) TO service_role;

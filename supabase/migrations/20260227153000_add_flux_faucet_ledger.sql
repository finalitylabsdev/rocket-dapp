/*
  # Add FLUX faucet ledger and server-backed holdings

  ## Summary
  - Adds a server-owned FLUX balance table for each authenticated wallet
  - Adds an append-only ledger for faucet claims and other balance adjustments
  - Persists signed faucet claim messages so the flow can later swap to on-chain txs
  - Applies the ETH lock whitelist bonus once, on first FLUX balance sync
*/

CREATE TABLE IF NOT EXISTS wallet_flux_balances (
  wallet_address text PRIMARY KEY REFERENCES wallet_registry(wallet_address) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  available_balance numeric(38, 18) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  lifetime_claimed numeric(38, 18) NOT NULL DEFAULT 0 CHECK (lifetime_claimed >= 0),
  lifetime_spent numeric(38, 18) NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
  last_faucet_claimed_at timestamptz,
  whitelist_bonus_granted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_flux_balances_auth_user_updated_idx
  ON wallet_flux_balances (auth_user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS flux_ledger_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('whitelist_bonus', 'faucet_claim', 'adjustment')),
  amount_flux numeric(38, 18) NOT NULL CHECK (amount_flux <> 0),
  settlement_kind text NOT NULL DEFAULT 'offchain_message'
    CHECK (settlement_kind IN ('offchain_message', 'onchain_transaction')),
  settlement_status text NOT NULL DEFAULT 'confirmed'
    CHECK (settlement_status IN ('pending', 'confirmed', 'failed')),
  signed_message text,
  signature text CHECK (signature IS NULL OR signature ~ '^0x[0-9a-fA-F]+$'),
  message_nonce text,
  tx_hash text CHECK (tx_hash IS NULL OR tx_hash ~ '^0x[0-9a-f]{64}$'),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_timestamp timestamptz,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flux_ledger_entries_wallet_created_idx
  ON flux_ledger_entries (wallet_address, created_at DESC);

CREATE INDEX IF NOT EXISTS flux_ledger_entries_auth_user_created_idx
  ON flux_ledger_entries (auth_user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS flux_ledger_entries_message_nonce_idx
  ON flux_ledger_entries (message_nonce)
  WHERE message_nonce IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS flux_ledger_entries_tx_hash_idx
  ON flux_ledger_entries (tx_hash)
  WHERE tx_hash IS NOT NULL;

ALTER TABLE wallet_flux_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE flux_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct client access" ON wallet_flux_balances;
CREATE POLICY "Deny direct client access"
  ON wallet_flux_balances
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny direct client access" ON flux_ledger_entries;
CREATE POLICY "Deny direct client access"
  ON flux_ledger_entries
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON TABLE wallet_flux_balances FROM anon, authenticated;
REVOKE ALL ON TABLE flux_ledger_entries FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.resolve_authenticated_wallet(
  p_wallet_address text
)
RETURNS TABLE (
  auth_user_id uuid,
  wallet_address text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authenticated session required';
  END IF;

  IF p_wallet_address IS NULL OR btrim(p_wallet_address) = '' THEN
    RAISE EXCEPTION 'p_wallet_address is required';
  END IF;

  v_wallet := lower(btrim(p_wallet_address));

  IF v_wallet !~ '^0x[0-9a-f]{40}$' THEN
    RAISE EXCEPTION 'invalid wallet address format: %', p_wallet_address;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = v_user_id
      AND (
        lower(COALESCE(i.provider_id, '')) = v_wallet
        OR lower(COALESCE(i.provider_id, '')) = ('web3:ethereum:' || v_wallet)
        OR lower(COALESCE(i.identity_data ->> 'wallet_address', '')) = v_wallet
        OR lower(COALESCE(i.identity_data ->> 'address', '')) = v_wallet
        OR lower(COALESCE(i.identity_data ->> 'sub', '')) = v_wallet
        OR lower(COALESCE(i.identity_data ->> 'sub', '')) = ('web3:ethereum:' || v_wallet)
        OR lower(COALESCE(i.identity_data -> 'custom_claims' ->> 'address', '')) = v_wallet
      )
  ) THEN
    RAISE EXCEPTION 'wallet does not belong to authenticated user';
  END IF;

  RETURN QUERY SELECT v_user_id, v_wallet;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_wallet_flux_balance_row(
  p_wallet_address text,
  p_auth_user_id uuid,
  p_whitelist_bonus_amount numeric DEFAULT 0,
  p_client_timestamp timestamptz DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS public.wallet_flux_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance public.wallet_flux_balances;
  v_bonus_amount numeric(38, 18);
  v_bonus_applied_at timestamptz;
BEGIN
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'p_auth_user_id is required';
  END IF;

  IF p_whitelist_bonus_amount IS NULL THEN
    v_bonus_amount := 0;
  ELSE
    v_bonus_amount := p_whitelist_bonus_amount;
  END IF;

  IF v_bonus_amount < 0 OR v_bonus_amount > 1000000 THEN
    RAISE EXCEPTION 'p_whitelist_bonus_amount is out of range';
  END IF;

  INSERT INTO wallet_registry (wallet_address, first_seen_at, last_seen_at)
  VALUES (p_wallet_address, now(), now())
  ON CONFLICT (wallet_address) DO UPDATE
  SET last_seen_at = EXCLUDED.last_seen_at;

  INSERT INTO wallet_flux_balances (
    wallet_address,
    auth_user_id
  )
  VALUES (
    p_wallet_address,
    p_auth_user_id
  )
  ON CONFLICT (wallet_address) DO UPDATE
  SET
    auth_user_id = EXCLUDED.auth_user_id,
    updated_at = wallet_flux_balances.updated_at;

  SELECT *
  INTO v_balance
  FROM wallet_flux_balances
  WHERE wallet_address = p_wallet_address
  FOR UPDATE;

  IF v_balance.whitelist_bonus_granted_at IS NULL
     AND v_bonus_amount > 0
     AND EXISTS (
       SELECT 1
       FROM eth_lock_submissions s
       WHERE s.wallet_address = p_wallet_address
         AND s.status = 'confirmed'
         AND s.is_lock_active = true
     ) THEN
    v_bonus_applied_at := now();

    INSERT INTO flux_ledger_entries (
      wallet_address,
      auth_user_id,
      entry_type,
      amount_flux,
      payload,
      client_timestamp,
      user_agent
    )
    VALUES (
      p_wallet_address,
      p_auth_user_id,
      'whitelist_bonus',
      v_bonus_amount,
      jsonb_build_object(
        'source', 'eth_lock_whitelist_bonus'
      ),
      COALESCE(p_client_timestamp, v_bonus_applied_at),
      p_user_agent
    );

    UPDATE wallet_flux_balances
    SET
      available_balance = available_balance + v_bonus_amount,
      whitelist_bonus_granted_at = v_bonus_applied_at,
      updated_at = now()
    WHERE wallet_address = p_wallet_address
    RETURNING * INTO v_balance;
  END IF;

  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_wallet_flux_balance(
  p_wallet_address text,
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
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

  v_balance := public.ensure_wallet_flux_balance_row(
    v_wallet,
    v_user_id,
    p_whitelist_bonus_amount,
    p_client_timestamp,
    p_user_agent
  );

  RETURN to_jsonb(v_balance);
END;
$$;

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
  v_claimed_at timestamptz;
  v_entry_id bigint;
  v_recent_claims integer;
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

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
    user_agent
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
    p_user_agent
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

CREATE OR REPLACE FUNCTION public.adjust_wallet_flux_balance(
  p_wallet_address text,
  p_delta_flux numeric,
  p_reason text,
  p_payload jsonb DEFAULT '{}'::jsonb,
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
  v_reason text;
  v_entry_id bigint;
  v_new_balance numeric(38, 18);
BEGIN
  SELECT rw.auth_user_id, rw.wallet_address
  INTO v_user_id, v_wallet
  FROM public.resolve_authenticated_wallet(p_wallet_address) rw;

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
    user_agent
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
    p_user_agent
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

REVOKE ALL ON FUNCTION public.resolve_authenticated_wallet(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_authenticated_wallet(text) FROM anon;
REVOKE ALL ON FUNCTION public.resolve_authenticated_wallet(text) FROM authenticated;

REVOKE ALL ON FUNCTION public.ensure_wallet_flux_balance_row(text, uuid, numeric, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_wallet_flux_balance_row(text, uuid, numeric, timestamptz, text) FROM anon;
REVOKE ALL ON FUNCTION public.ensure_wallet_flux_balance_row(text, uuid, numeric, timestamptz, text) FROM authenticated;

REVOKE ALL ON FUNCTION public.sync_wallet_flux_balance(text, numeric, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_wallet_flux_balance(text, numeric, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_wallet_flux_balance(text, numeric, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.record_flux_faucet_claim(text, numeric, integer, text, text, text, text, text, text, bigint, numeric, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_flux_faucet_claim(text, numeric, integer, text, text, text, text, text, text, bigint, numeric, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_flux_faucet_claim(text, numeric, integer, text, text, text, text, text, text, bigint, numeric, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.adjust_wallet_flux_balance(text, numeric, text, jsonb, numeric, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.adjust_wallet_flux_balance(text, numeric, text, jsonb, numeric, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.adjust_wallet_flux_balance(text, numeric, text, jsonb, numeric, timestamptz, text) TO authenticated;

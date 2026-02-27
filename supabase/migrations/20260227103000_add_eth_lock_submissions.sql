/*
  # Add ETH lock submissions + secure write RPC

  ## Summary
  - Adds a canonical `eth_lock_submissions` table keyed by wallet + tx hash
  - Adds authenticated RPC `record_eth_lock_submission(...)`
  - Verifies wallet ownership against the active Supabase auth identity
  - Stores validated transaction metadata and app log audit event
*/

CREATE TABLE IF NOT EXISTS eth_lock_submissions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_hash text NOT NULL CHECK (tx_hash ~ '^0x[0-9a-f]{64}$'),
  chain_id bigint NOT NULL CHECK (chain_id > 0),
  block_number bigint NOT NULL CHECK (block_number >= 0),
  from_address text NOT NULL CHECK (from_address ~ '^0x[0-9a-f]{40}$'),
  to_address text NOT NULL CHECK (to_address ~ '^0x[0-9a-f]{40}$'),
  amount_wei numeric(78, 0) NOT NULL CHECK (amount_wei > 0),
  amount_eth numeric(38, 18)
    GENERATED ALWAYS AS ((amount_wei / 1000000000000000000::numeric)) STORED,
  receipt jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_timestamp timestamptz,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_address),
  UNIQUE (tx_hash)
);

CREATE INDEX IF NOT EXISTS eth_lock_submissions_auth_user_created_idx
  ON eth_lock_submissions (auth_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS eth_lock_submissions_wallet_created_idx
  ON eth_lock_submissions (wallet_address, created_at DESC);

ALTER TABLE eth_lock_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eth lock submissions are user readable" ON eth_lock_submissions;
CREATE POLICY "Eth lock submissions are user readable"
  ON eth_lock_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

REVOKE ALL ON TABLE eth_lock_submissions FROM anon;
GRANT SELECT ON TABLE eth_lock_submissions TO authenticated;

CREATE OR REPLACE FUNCTION public.record_eth_lock_submission(
  p_wallet_address text,
  p_tx_hash text,
  p_chain_id bigint,
  p_block_number bigint,
  p_from_address text,
  p_to_address text,
  p_amount_wei numeric,
  p_receipt jsonb DEFAULT '{}'::jsonb,
  p_client_timestamp timestamptz DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_wallet text;
  v_tx_hash text;
  v_from text;
  v_to text;
  v_submission_id bigint;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authenticated session required';
  END IF;

  IF p_wallet_address IS NULL OR btrim(p_wallet_address) = '' THEN
    RAISE EXCEPTION 'p_wallet_address is required';
  END IF;

  IF p_tx_hash IS NULL OR btrim(p_tx_hash) = '' THEN
    RAISE EXCEPTION 'p_tx_hash is required';
  END IF;

  IF p_from_address IS NULL OR btrim(p_from_address) = '' THEN
    RAISE EXCEPTION 'p_from_address is required';
  END IF;

  IF p_to_address IS NULL OR btrim(p_to_address) = '' THEN
    RAISE EXCEPTION 'p_to_address is required';
  END IF;

  IF p_chain_id IS NULL OR p_chain_id <= 0 THEN
    RAISE EXCEPTION 'p_chain_id must be a positive integer';
  END IF;

  IF p_block_number IS NULL OR p_block_number < 0 THEN
    RAISE EXCEPTION 'p_block_number must be a non-negative integer';
  END IF;

  IF p_amount_wei IS NULL OR p_amount_wei <= 0 OR p_amount_wei != trunc(p_amount_wei) THEN
    RAISE EXCEPTION 'p_amount_wei must be a positive integer value in wei';
  END IF;

  v_wallet := lower(btrim(p_wallet_address));
  v_tx_hash := lower(btrim(p_tx_hash));
  v_from := lower(btrim(p_from_address));
  v_to := lower(btrim(p_to_address));

  IF v_wallet !~ '^0x[0-9a-f]{40}$' THEN
    RAISE EXCEPTION 'invalid wallet address format: %', p_wallet_address;
  END IF;

  IF v_tx_hash !~ '^0x[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'invalid transaction hash format: %', p_tx_hash;
  END IF;

  IF v_from !~ '^0x[0-9a-f]{40}$' THEN
    RAISE EXCEPTION 'invalid from address format: %', p_from_address;
  END IF;

  IF v_to !~ '^0x[0-9a-f]{40}$' THEN
    RAISE EXCEPTION 'invalid to address format: %', p_to_address;
  END IF;

  IF v_from <> v_wallet THEN
    RAISE EXCEPTION 'from address must match wallet address';
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

  INSERT INTO wallet_registry (wallet_address, first_seen_at, last_seen_at)
  VALUES (v_wallet, now(), now())
  ON CONFLICT (wallet_address) DO UPDATE
  SET last_seen_at = EXCLUDED.last_seen_at;

  INSERT INTO eth_lock_submissions (
    wallet_address,
    auth_user_id,
    tx_hash,
    chain_id,
    block_number,
    from_address,
    to_address,
    amount_wei,
    receipt,
    client_timestamp,
    user_agent
  )
  VALUES (
    v_wallet,
    v_user_id,
    v_tx_hash,
    p_chain_id,
    p_block_number,
    v_from,
    v_to,
    p_amount_wei,
    COALESCE(p_receipt, '{}'::jsonb),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  ON CONFLICT (wallet_address) DO UPDATE
    SET tx_hash = eth_lock_submissions.tx_hash
    WHERE eth_lock_submissions.tx_hash = EXCLUDED.tx_hash
  RETURNING id INTO v_submission_id;

  IF v_submission_id IS NULL THEN
    RAISE EXCEPTION 'wallet already has a confirmed eth lock submission';
  END IF;

  INSERT INTO app_logs (
    event_name,
    wallet_address,
    auth_user_id,
    payload,
    client_timestamp,
    user_agent
  )
  VALUES (
    'eth_lock_confirmed',
    v_wallet,
    v_user_id,
    jsonb_build_object(
      'submission_id', v_submission_id,
      'tx_hash', v_tx_hash,
      'chain_id', p_chain_id,
      'block_number', p_block_number,
      'to', v_to,
      'amount_wei', p_amount_wei
    ),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  );

  RETURN v_submission_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_eth_lock_submission(text, text, bigint, bigint, text, text, numeric, jsonb, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_eth_lock_submission(text, text, bigint, bigint, text, text, numeric, jsonb, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_eth_lock_submission(text, text, bigint, bigint, text, text, numeric, jsonb, timestamptz, text) TO authenticated;

/*
  # Add ETH lock active override for repeatable testing

  ## Summary
  - Adds `is_lock_active` flag to `eth_lock_submissions`
  - Allows a confirmed wallet to re-submit when `is_lock_active = false`
  - Keeps new submissions inactive until they are confirmed again
*/

ALTER TABLE eth_lock_submissions
  ADD COLUMN IF NOT EXISTS is_lock_active boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.record_eth_lock_sent(
  p_wallet_address text,
  p_tx_hash text,
  p_chain_id bigint,
  p_from_address text,
  p_to_address text,
  p_amount_wei numeric,
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
    status,
    is_lock_active,
    last_error,
    tx_submitted_at,
    verifying_started_at,
    confirmed_at,
    verification_attempts,
    client_timestamp,
    user_agent
  )
  VALUES (
    v_wallet,
    v_user_id,
    v_tx_hash,
    p_chain_id,
    NULL,
    v_from,
    v_to,
    p_amount_wei,
    '{}'::jsonb,
    'sent',
    false,
    NULL,
    COALESCE(p_client_timestamp, now()),
    NULL,
    NULL,
    0,
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  ON CONFLICT (wallet_address) DO UPDATE
    SET
      tx_hash = EXCLUDED.tx_hash,
      chain_id = EXCLUDED.chain_id,
      block_number = NULL,
      from_address = EXCLUDED.from_address,
      to_address = EXCLUDED.to_address,
      amount_wei = EXCLUDED.amount_wei,
      receipt = '{}'::jsonb,
      status = 'sent',
      is_lock_active = false,
      last_error = NULL,
      tx_submitted_at = EXCLUDED.tx_submitted_at,
      verifying_started_at = NULL,
      confirmed_at = NULL,
      verification_attempts = 0,
      client_timestamp = EXCLUDED.client_timestamp,
      user_agent = EXCLUDED.user_agent
    WHERE
      eth_lock_submissions.auth_user_id = v_user_id
      AND (
        eth_lock_submissions.status <> 'confirmed'
        OR NOT eth_lock_submissions.is_lock_active
      )
  RETURNING id INTO v_submission_id;

  IF v_submission_id IS NULL THEN
    RAISE EXCEPTION 'wallet already has an active confirmed eth lock submission';
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
    'eth_lock_sent',
    v_wallet,
    v_user_id,
    jsonb_build_object(
      'submission_id', v_submission_id,
      'tx_hash', v_tx_hash,
      'chain_id', p_chain_id,
      'to', v_to,
      'amount_wei', p_amount_wei
    ),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  );

  RETURN v_submission_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_eth_lock_sent(text, text, bigint, text, text, numeric, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_eth_lock_sent(text, text, bigint, text, text, numeric, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_eth_lock_sent(text, text, bigint, text, text, numeric, timestamptz, text) TO authenticated;

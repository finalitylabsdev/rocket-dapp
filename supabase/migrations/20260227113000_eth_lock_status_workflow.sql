/*
  # Add ETH lock status lifecycle + client sent-RPC

  ## Summary
  - Expands `eth_lock_submissions` to support status lifecycle states
  - Adds `record_eth_lock_sent(...)` RPC for authenticated clients
  - Keeps one row per wallet and updates status as verification progresses
  - Adds trigger-managed timestamps and realtime publication wiring
*/

ALTER TABLE eth_lock_submissions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed',
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS tx_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verifying_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE eth_lock_submissions
  DROP CONSTRAINT IF EXISTS eth_lock_submissions_status_check;

ALTER TABLE eth_lock_submissions
  ADD CONSTRAINT eth_lock_submissions_status_check
  CHECK (status IN ('pending', 'sent', 'verifying', 'error', 'confirmed'));

ALTER TABLE eth_lock_submissions
  ALTER COLUMN tx_hash DROP NOT NULL,
  ALTER COLUMN chain_id DROP NOT NULL,
  ALTER COLUMN block_number DROP NOT NULL,
  ALTER COLUMN from_address DROP NOT NULL,
  ALTER COLUMN to_address DROP NOT NULL,
  ALTER COLUMN amount_wei DROP NOT NULL;

UPDATE eth_lock_submissions
SET
  status = 'confirmed',
  tx_submitted_at = COALESCE(tx_submitted_at, created_at),
  confirmed_at = COALESCE(confirmed_at, created_at),
  updated_at = COALESCE(updated_at, created_at)
WHERE
  status IS DISTINCT FROM 'confirmed'
  OR tx_submitted_at IS NULL
  OR confirmed_at IS NULL
  OR updated_at IS NULL;

CREATE INDEX IF NOT EXISTS eth_lock_submissions_status_updated_idx
  ON eth_lock_submissions (status, updated_at DESC);

CREATE OR REPLACE FUNCTION public.touch_eth_lock_submission()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();

  IF NEW.status = 'sent' AND NEW.tx_submitted_at IS NULL THEN
    NEW.tx_submitted_at := now();
  END IF;

  IF NEW.status = 'confirmed' AND NEW.confirmed_at IS NULL THEN
    NEW.confirmed_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_eth_lock_submission_trigger ON eth_lock_submissions;

CREATE TRIGGER touch_eth_lock_submission_trigger
BEFORE INSERT OR UPDATE ON eth_lock_submissions
FOR EACH ROW
EXECUTE FUNCTION public.touch_eth_lock_submission();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'eth_lock_submissions'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.eth_lock_submissions;
    END IF;
  END IF;
END;
$$;

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
      last_error = NULL,
      tx_submitted_at = EXCLUDED.tx_submitted_at,
      verifying_started_at = NULL,
      confirmed_at = NULL,
      verification_attempts = 0,
      client_timestamp = EXCLUDED.client_timestamp,
      user_agent = EXCLUDED.user_agent
    WHERE
      eth_lock_submissions.auth_user_id = v_user_id
      AND eth_lock_submissions.status <> 'confirmed'
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

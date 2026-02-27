/*
  # Add app logs table and wallet disconnect RPC

  ## Summary
  Adds a generic `app_logs` table to store auth events (login/logout) and future site actions.
  Extends the wallet ledger RPC layer to record disconnect events.
*/

CREATE TABLE IF NOT EXISTS app_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_name text NOT NULL,
  browser_id uuid REFERENCES browser_profiles(browser_id) ON DELETE SET NULL,
  wallet_address text REFERENCES wallet_registry(wallet_address) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_timestamp timestamptz,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_logs_event_name_created_idx
  ON app_logs (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS app_logs_browser_created_idx
  ON app_logs (browser_id, created_at DESC);

CREATE INDEX IF NOT EXISTS app_logs_wallet_created_idx
  ON app_logs (wallet_address, created_at DESC);

ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE app_state_ledger
  DROP CONSTRAINT IF EXISTS app_state_ledger_event_type_check;

ALTER TABLE app_state_ledger
  ADD CONSTRAINT app_state_ledger_event_type_check
  CHECK (event_type IN ('wallet_connected', 'wallet_disconnected'));

CREATE OR REPLACE FUNCTION public.record_wallet_connect(
  p_browser_id uuid,
  p_wallet_address text,
  p_state jsonb DEFAULT '{}'::jsonb,
  p_client_timestamp timestamptz DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet text;
  v_ledger_event_id bigint;
BEGIN
  IF p_browser_id IS NULL THEN
    RAISE EXCEPTION 'p_browser_id is required';
  END IF;

  IF p_wallet_address IS NULL OR btrim(p_wallet_address) = '' THEN
    RAISE EXCEPTION 'p_wallet_address is required';
  END IF;

  v_wallet := lower(p_wallet_address);

  IF v_wallet !~ '^0x[0-9a-f]{40}$' THEN
    RAISE EXCEPTION 'invalid wallet address format: %', p_wallet_address;
  END IF;

  INSERT INTO browser_profiles (browser_id, first_seen_at, last_seen_at, user_agent)
  VALUES (p_browser_id, now(), now(), p_user_agent)
  ON CONFLICT (browser_id) DO UPDATE
  SET
    last_seen_at = EXCLUDED.last_seen_at,
    user_agent = COALESCE(EXCLUDED.user_agent, browser_profiles.user_agent);

  INSERT INTO wallet_registry (wallet_address, first_seen_at, last_seen_at)
  VALUES (v_wallet, now(), now())
  ON CONFLICT (wallet_address) DO UPDATE
  SET
    last_seen_at = EXCLUDED.last_seen_at;

  INSERT INTO browser_wallets (browser_id, wallet_address, first_seen_at, last_seen_at)
  VALUES (p_browser_id, v_wallet, now(), now())
  ON CONFLICT (browser_id, wallet_address) DO UPDATE
  SET
    last_seen_at = EXCLUDED.last_seen_at;

  INSERT INTO app_state_ledger (
    event_type,
    browser_id,
    wallet_address,
    state,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_connected',
    p_browser_id,
    v_wallet,
    COALESCE(p_state, '{}'::jsonb),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  RETURNING id INTO v_ledger_event_id;

  INSERT INTO app_logs (
    event_name,
    browser_id,
    wallet_address,
    payload,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_login',
    p_browser_id,
    v_wallet,
    jsonb_build_object(
      'state', COALESCE(p_state, '{}'::jsonb),
      'ledger_event_id', v_ledger_event_id
    ),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  );

  RETURN v_ledger_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_wallet_disconnect(
  p_browser_id uuid,
  p_wallet_address text,
  p_state jsonb DEFAULT '{}'::jsonb,
  p_client_timestamp timestamptz DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet text;
  v_ledger_event_id bigint;
BEGIN
  IF p_browser_id IS NULL THEN
    RAISE EXCEPTION 'p_browser_id is required';
  END IF;

  IF p_wallet_address IS NULL OR btrim(p_wallet_address) = '' THEN
    RAISE EXCEPTION 'p_wallet_address is required';
  END IF;

  v_wallet := lower(p_wallet_address);

  IF v_wallet !~ '^0x[0-9a-f]{40}$' THEN
    RAISE EXCEPTION 'invalid wallet address format: %', p_wallet_address;
  END IF;

  INSERT INTO browser_profiles (browser_id, first_seen_at, last_seen_at, user_agent)
  VALUES (p_browser_id, now(), now(), p_user_agent)
  ON CONFLICT (browser_id) DO UPDATE
  SET
    last_seen_at = EXCLUDED.last_seen_at,
    user_agent = COALESCE(EXCLUDED.user_agent, browser_profiles.user_agent);

  INSERT INTO wallet_registry (wallet_address, first_seen_at, last_seen_at)
  VALUES (v_wallet, now(), now())
  ON CONFLICT (wallet_address) DO UPDATE
  SET
    last_seen_at = EXCLUDED.last_seen_at;

  INSERT INTO browser_wallets (browser_id, wallet_address, first_seen_at, last_seen_at)
  VALUES (p_browser_id, v_wallet, now(), now())
  ON CONFLICT (browser_id, wallet_address) DO UPDATE
  SET
    last_seen_at = EXCLUDED.last_seen_at;

  INSERT INTO app_state_ledger (
    event_type,
    browser_id,
    wallet_address,
    state,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_disconnected',
    p_browser_id,
    v_wallet,
    COALESCE(p_state, '{}'::jsonb),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  RETURNING id INTO v_ledger_event_id;

  INSERT INTO app_logs (
    event_name,
    browser_id,
    wallet_address,
    payload,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_logout',
    p_browser_id,
    v_wallet,
    jsonb_build_object(
      'state', COALESCE(p_state, '{}'::jsonb),
      'ledger_event_id', v_ledger_event_id
    ),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  );

  RETURN v_ledger_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_wallet_connect(uuid, text, jsonb, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_wallet_connect(uuid, text, jsonb, timestamptz, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.record_wallet_disconnect(uuid, text, jsonb, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_wallet_disconnect(uuid, text, jsonb, timestamptz, text) TO anon, authenticated;

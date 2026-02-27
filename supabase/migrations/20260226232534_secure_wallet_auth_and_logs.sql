/*
  # Secure wallet auth ledger + harden log writes

  ## Summary
  - Binds connect/disconnect log writes to authenticated Supabase users
  - Verifies the requested wallet belongs to the current Auth identity
  - Adds per-user rate limiting in RPC functions to reduce spam writes
  - Adds `auth_user_id` linkage for `app_state_ledger` and `app_logs`
  - Adds generic `record_app_log` RPC for future product event logging
*/

ALTER TABLE app_state_ledger
  ALTER COLUMN browser_id DROP NOT NULL;

ALTER TABLE app_state_ledger
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE app_logs
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS app_state_ledger_auth_user_created_idx
  ON app_state_ledger (auth_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS app_logs_auth_user_created_idx
  ON app_logs (auth_user_id, created_at DESC);

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
  v_user_id uuid;
  v_recent_auth_events integer;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authenticated session required';
  END IF;

  IF p_wallet_address IS NULL OR btrim(p_wallet_address) = '' THEN
    RAISE EXCEPTION 'p_wallet_address is required';
  END IF;

  v_wallet := lower(p_wallet_address);

  IF v_wallet !~ '^0x[0-9a-f]{40}$' THEN
    RAISE EXCEPTION 'invalid wallet address format: %', p_wallet_address;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = v_user_id
      AND (
        lower(i.provider_id) = v_wallet
        OR lower(COALESCE(i.identity_data ->> 'wallet_address', '')) = v_wallet
        OR lower(COALESCE(i.identity_data ->> 'address', '')) = v_wallet
        OR lower(COALESCE(i.identity_data ->> 'sub', '')) = v_wallet
      )
  ) THEN
    RAISE EXCEPTION 'wallet does not belong to authenticated user';
  END IF;

  SELECT count(*) INTO v_recent_auth_events
  FROM app_logs
  WHERE auth_user_id = v_user_id
    AND event_name IN ('wallet_login', 'wallet_logout')
    AND created_at >= now() - interval '5 minutes';

  IF v_recent_auth_events >= 40 THEN
    RAISE EXCEPTION 'rate limit exceeded for wallet auth events';
  END IF;

  IF p_browser_id IS NOT NULL THEN
    INSERT INTO browser_profiles (browser_id, first_seen_at, last_seen_at, user_agent)
    VALUES (p_browser_id, now(), now(), p_user_agent)
    ON CONFLICT (browser_id) DO UPDATE
    SET
      last_seen_at = EXCLUDED.last_seen_at,
      user_agent = COALESCE(EXCLUDED.user_agent, browser_profiles.user_agent);
  END IF;

  INSERT INTO wallet_registry (wallet_address, first_seen_at, last_seen_at)
  VALUES (v_wallet, now(), now())
  ON CONFLICT (wallet_address) DO UPDATE
  SET
    last_seen_at = EXCLUDED.last_seen_at;

  IF p_browser_id IS NOT NULL THEN
    INSERT INTO browser_wallets (browser_id, wallet_address, first_seen_at, last_seen_at)
    VALUES (p_browser_id, v_wallet, now(), now())
    ON CONFLICT (browser_id, wallet_address) DO UPDATE
    SET
      last_seen_at = EXCLUDED.last_seen_at;
  END IF;

  INSERT INTO app_state_ledger (
    event_type,
    browser_id,
    wallet_address,
    auth_user_id,
    state,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_connected',
    p_browser_id,
    v_wallet,
    v_user_id,
    COALESCE(p_state, '{}'::jsonb),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  RETURNING id INTO v_ledger_event_id;

  INSERT INTO app_logs (
    event_name,
    browser_id,
    wallet_address,
    auth_user_id,
    payload,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_login',
    p_browser_id,
    v_wallet,
    v_user_id,
    jsonb_build_object(
      'state', COALESCE(p_state, '{}'::jsonb),
      'ledger_event_id', v_ledger_event_id,
      'browser_linked', p_browser_id IS NOT NULL
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
  v_user_id uuid;
  v_recent_auth_events integer;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authenticated session required';
  END IF;

  IF p_wallet_address IS NULL OR btrim(p_wallet_address) = '' THEN
    RAISE EXCEPTION 'p_wallet_address is required';
  END IF;

  v_wallet := lower(p_wallet_address);

  IF v_wallet !~ '^0x[0-9a-f]{40}$' THEN
    RAISE EXCEPTION 'invalid wallet address format: %', p_wallet_address;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = v_user_id
      AND (
        lower(i.provider_id) = v_wallet
        OR lower(COALESCE(i.identity_data ->> 'wallet_address', '')) = v_wallet
        OR lower(COALESCE(i.identity_data ->> 'address', '')) = v_wallet
        OR lower(COALESCE(i.identity_data ->> 'sub', '')) = v_wallet
      )
  ) THEN
    RAISE EXCEPTION 'wallet does not belong to authenticated user';
  END IF;

  SELECT count(*) INTO v_recent_auth_events
  FROM app_logs
  WHERE auth_user_id = v_user_id
    AND event_name IN ('wallet_login', 'wallet_logout')
    AND created_at >= now() - interval '5 minutes';

  IF v_recent_auth_events >= 40 THEN
    RAISE EXCEPTION 'rate limit exceeded for wallet auth events';
  END IF;

  IF p_browser_id IS NOT NULL THEN
    INSERT INTO browser_profiles (browser_id, first_seen_at, last_seen_at, user_agent)
    VALUES (p_browser_id, now(), now(), p_user_agent)
    ON CONFLICT (browser_id) DO UPDATE
    SET
      last_seen_at = EXCLUDED.last_seen_at,
      user_agent = COALESCE(EXCLUDED.user_agent, browser_profiles.user_agent);
  END IF;

  INSERT INTO wallet_registry (wallet_address, first_seen_at, last_seen_at)
  VALUES (v_wallet, now(), now())
  ON CONFLICT (wallet_address) DO UPDATE
  SET
    last_seen_at = EXCLUDED.last_seen_at;

  IF p_browser_id IS NOT NULL THEN
    INSERT INTO browser_wallets (browser_id, wallet_address, first_seen_at, last_seen_at)
    VALUES (p_browser_id, v_wallet, now(), now())
    ON CONFLICT (browser_id, wallet_address) DO UPDATE
    SET
      last_seen_at = EXCLUDED.last_seen_at;
  END IF;

  INSERT INTO app_state_ledger (
    event_type,
    browser_id,
    wallet_address,
    auth_user_id,
    state,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_disconnected',
    p_browser_id,
    v_wallet,
    v_user_id,
    COALESCE(p_state, '{}'::jsonb),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  RETURNING id INTO v_ledger_event_id;

  INSERT INTO app_logs (
    event_name,
    browser_id,
    wallet_address,
    auth_user_id,
    payload,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_logout',
    p_browser_id,
    v_wallet,
    v_user_id,
    jsonb_build_object(
      'state', COALESCE(p_state, '{}'::jsonb),
      'ledger_event_id', v_ledger_event_id,
      'browser_linked', p_browser_id IS NOT NULL
    ),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  );

  RETURN v_ledger_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_app_log(
  p_event_name text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_wallet_address text DEFAULT NULL,
  p_browser_id uuid DEFAULT NULL,
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
  v_recent_events integer;
  v_event_name text;
  v_log_id bigint;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authenticated session required';
  END IF;

  IF p_event_name IS NULL OR btrim(p_event_name) = '' THEN
    RAISE EXCEPTION 'p_event_name is required';
  END IF;

  v_event_name := lower(btrim(p_event_name));
  IF v_event_name !~ '^[a-z0-9_:-]{2,64}$' THEN
    RAISE EXCEPTION 'invalid event name: %', p_event_name;
  END IF;

  SELECT count(*) INTO v_recent_events
  FROM app_logs
  WHERE auth_user_id = v_user_id
    AND created_at >= now() - interval '5 minutes';

  IF v_recent_events >= 300 THEN
    RAISE EXCEPTION 'rate limit exceeded for app logs';
  END IF;

  IF p_wallet_address IS NOT NULL AND btrim(p_wallet_address) <> '' THEN
    v_wallet := lower(p_wallet_address);

    IF v_wallet !~ '^0x[0-9a-f]{40}$' THEN
      RAISE EXCEPTION 'invalid wallet address format: %', p_wallet_address;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM auth.identities i
      WHERE i.user_id = v_user_id
        AND (
          lower(i.provider_id) = v_wallet
          OR lower(COALESCE(i.identity_data ->> 'wallet_address', '')) = v_wallet
          OR lower(COALESCE(i.identity_data ->> 'address', '')) = v_wallet
          OR lower(COALESCE(i.identity_data ->> 'sub', '')) = v_wallet
        )
    ) THEN
      RAISE EXCEPTION 'wallet does not belong to authenticated user';
    END IF;

    INSERT INTO wallet_registry (wallet_address, first_seen_at, last_seen_at)
    VALUES (v_wallet, now(), now())
    ON CONFLICT (wallet_address) DO UPDATE
    SET
      last_seen_at = EXCLUDED.last_seen_at;
  ELSE
    v_wallet := NULL;
  END IF;

  IF p_browser_id IS NOT NULL THEN
    INSERT INTO browser_profiles (browser_id, first_seen_at, last_seen_at, user_agent)
    VALUES (p_browser_id, now(), now(), p_user_agent)
    ON CONFLICT (browser_id) DO UPDATE
    SET
      last_seen_at = EXCLUDED.last_seen_at,
      user_agent = COALESCE(EXCLUDED.user_agent, browser_profiles.user_agent);

    IF v_wallet IS NOT NULL THEN
      INSERT INTO browser_wallets (browser_id, wallet_address, first_seen_at, last_seen_at)
      VALUES (p_browser_id, v_wallet, now(), now())
      ON CONFLICT (browser_id, wallet_address) DO UPDATE
      SET
        last_seen_at = EXCLUDED.last_seen_at;
    END IF;
  END IF;

  INSERT INTO app_logs (
    event_name,
    browser_id,
    wallet_address,
    auth_user_id,
    payload,
    client_timestamp,
    user_agent
  )
  VALUES (
    v_event_name,
    p_browser_id,
    v_wallet,
    v_user_id,
    COALESCE(p_payload, '{}'::jsonb),
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_wallet_connect(uuid, text, jsonb, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_wallet_connect(uuid, text, jsonb, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_wallet_connect(uuid, text, jsonb, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.record_wallet_disconnect(uuid, text, jsonb, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_wallet_disconnect(uuid, text, jsonb, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_wallet_disconnect(uuid, text, jsonb, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.record_app_log(text, jsonb, text, uuid, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_app_log(text, jsonb, text, uuid, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_app_log(text, jsonb, text, uuid, timestamptz, text) TO authenticated;

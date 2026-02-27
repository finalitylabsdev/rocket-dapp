/*
  # Consolidate schema: drop browser tables & deduplicate logging

  ## Summary
  Wallet authentication is fully handled via Supabase Auth (auth.identities),
  making browser fingerprinting (browser_profiles, browser_wallets) redundant.
  The app_state_ledger duplicates every event already written to app_logs.

  This migration removes the 3 redundant tables and simplifies the RPCs.

  Before: 6 tables, 3 RPCs that double-log events
  After:  3 tables (leaderboard, wallet_registry, app_logs), 3 simplified RPCs

  ## Execution order (FK-safe)
  1. Drop old RPC functions (old signatures reference dropped tables)
  2. Drop browser_wallets (junction table, no dependents)
  3. Drop app_state_ledger (no dependents)
  4. Drop browser_id column + index from app_logs
  5. Drop browser_profiles (now safe, nothing references it)
  6. Recreate 3 simplified RPC functions
  7. REVOKE/GRANT permissions
*/

-- 1. Drop old RPC functions (must drop before tables they reference)
DROP FUNCTION IF EXISTS public.record_wallet_connect(uuid, text, jsonb, timestamptz, text);
DROP FUNCTION IF EXISTS public.record_wallet_disconnect(uuid, text, jsonb, timestamptz, text);
DROP FUNCTION IF EXISTS public.record_app_log(text, jsonb, text, uuid, timestamptz, text);

-- 2. Drop browser_wallets (junction table, no dependents)
DROP TABLE IF EXISTS browser_wallets;

-- 3. Drop app_state_ledger (no dependents)
DROP TABLE IF EXISTS app_state_ledger;

-- 4. Drop browser_id column + index from app_logs
DROP INDEX IF EXISTS app_logs_browser_created_idx;
ALTER TABLE app_logs DROP COLUMN IF EXISTS browser_id;

-- 5. Drop browser_profiles (now safe, nothing references it)
DROP TABLE IF EXISTS browser_profiles;

-- 6. Recreate simplified RPC functions

CREATE OR REPLACE FUNCTION public.record_wallet_connect(
  p_wallet_address text,
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
  v_user_id uuid;
  v_recent_auth_events integer;
  v_log_id bigint;
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

  SELECT count(*) INTO v_recent_auth_events
  FROM app_logs
  WHERE auth_user_id = v_user_id
    AND event_name IN ('wallet_login', 'wallet_logout')
    AND created_at >= now() - interval '5 minutes';

  IF v_recent_auth_events >= 40 THEN
    RAISE EXCEPTION 'rate limit exceeded for wallet auth events';
  END IF;

  INSERT INTO wallet_registry (wallet_address, first_seen_at, last_seen_at)
  VALUES (v_wallet, now(), now())
  ON CONFLICT (wallet_address) DO UPDATE
  SET last_seen_at = EXCLUDED.last_seen_at;

  INSERT INTO app_logs (
    event_name,
    wallet_address,
    auth_user_id,
    payload,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_login',
    v_wallet,
    v_user_id,
    '{}'::jsonb,
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_wallet_disconnect(
  p_wallet_address text,
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
  v_user_id uuid;
  v_recent_auth_events integer;
  v_log_id bigint;
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

  SELECT count(*) INTO v_recent_auth_events
  FROM app_logs
  WHERE auth_user_id = v_user_id
    AND event_name IN ('wallet_login', 'wallet_logout')
    AND created_at >= now() - interval '5 minutes';

  IF v_recent_auth_events >= 40 THEN
    RAISE EXCEPTION 'rate limit exceeded for wallet auth events';
  END IF;

  INSERT INTO wallet_registry (wallet_address, first_seen_at, last_seen_at)
  VALUES (v_wallet, now(), now())
  ON CONFLICT (wallet_address) DO UPDATE
  SET last_seen_at = EXCLUDED.last_seen_at;

  INSERT INTO app_logs (
    event_name,
    wallet_address,
    auth_user_id,
    payload,
    client_timestamp,
    user_agent
  )
  VALUES (
    'wallet_logout',
    v_wallet,
    v_user_id,
    '{}'::jsonb,
    COALESCE(p_client_timestamp, now()),
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_app_log(
  p_event_name text,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_wallet_address text DEFAULT NULL,
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
  ELSE
    v_wallet := NULL;
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
    v_event_name,
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

-- 7. REVOKE/GRANT permissions (authenticated only)

REVOKE ALL ON FUNCTION public.record_wallet_connect(text, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_wallet_connect(text, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_wallet_connect(text, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.record_wallet_disconnect(text, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_wallet_disconnect(text, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_wallet_disconnect(text, timestamptz, text) TO authenticated;

REVOKE ALL ON FUNCTION public.record_app_log(text, jsonb, text, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_app_log(text, jsonb, text, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_app_log(text, jsonb, text, timestamptz, text) TO authenticated;

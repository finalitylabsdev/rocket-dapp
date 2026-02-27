/*
  # Create wallet/browser ledger schema

  ## Summary
  Adds append-only event logging for browser-local app state with wallet ownership mapping.

  ## New Tables
  - `browser_profiles`
    - Stable browser identity from localStorage (`browser_id`)
  - `wallet_registry`
    - Canonical wallet addresses observed in the app
  - `browser_wallets`
    - Many-to-many ownership/association between browser and wallet
  - `app_state_ledger`
    - Append-only event log (starting with `wallet_connected`)

  ## Security
  - RLS enabled on all tables
  - No direct anon/authenticated table access policies
  - `record_wallet_connect(...)` is exposed for controlled writes
*/

CREATE TABLE IF NOT EXISTS browser_profiles (
  browser_id uuid PRIMARY KEY,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_registry (
  wallet_address text PRIMARY KEY CHECK (wallet_address ~ '^0x[0-9a-f]{40}$'),
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS browser_wallets (
  browser_id uuid NOT NULL REFERENCES browser_profiles(browser_id) ON DELETE CASCADE,
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address) ON DELETE CASCADE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (browser_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS app_state_ledger (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL CHECK (event_type IN ('wallet_connected')),
  browser_id uuid NOT NULL REFERENCES browser_profiles(browser_id) ON DELETE CASCADE,
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address) ON DELETE RESTRICT,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_timestamp timestamptz,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_state_ledger_browser_created_idx
  ON app_state_ledger (browser_id, created_at DESC);

CREATE INDEX IF NOT EXISTS app_state_ledger_wallet_created_idx
  ON app_state_ledger (wallet_address, created_at DESC);

ALTER TABLE browser_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state_ledger ENABLE ROW LEVEL SECURITY;

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
  v_event_id bigint;
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
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_wallet_connect(uuid, text, jsonb, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_wallet_connect(uuid, text, jsonb, timestamptz, text) TO anon, authenticated;

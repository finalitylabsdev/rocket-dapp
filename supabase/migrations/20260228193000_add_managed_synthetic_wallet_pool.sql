/*
  # Add managed synthetic wallet pool for the traffic simulator

  ## Summary
  - Adds `sim_wallet_keys` for encrypted simulator-managed private keys
  - Adds `sim_wallet_profiles` for lightweight behavior metadata
  - Adds `sim_activity_schedule` for future queued simulator actions
  - Restricts all access to `service_role`
*/

CREATE OR REPLACE FUNCTION public.touch_simulator_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.sim_wallet_keys (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address text NOT NULL UNIQUE CHECK (wallet_address ~ '^0x[0-9a-f]{40}$'),
  private_key_ciphertext text NOT NULL CHECK (btrim(private_key_ciphertext) <> ''),
  private_key_iv text NOT NULL CHECK (btrim(private_key_iv) <> ''),
  private_key_auth_tag text NOT NULL CHECK (btrim(private_key_auth_tag) <> ''),
  private_key_kid text NOT NULL CHECK (btrim(private_key_kid) <> ''),
  source text NOT NULL DEFAULT 'simulator_generated'
    CHECK (source IN ('env_import', 'simulator_generated', 'manual')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'retired', 'compromised')),
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sim_wallet_keys_status_created_idx
  ON public.sim_wallet_keys (status, created_at ASC);

DROP TRIGGER IF EXISTS touch_sim_wallet_keys_updated_at ON public.sim_wallet_keys;
CREATE TRIGGER touch_sim_wallet_keys_updated_at
BEFORE UPDATE ON public.sim_wallet_keys
FOR EACH ROW
EXECUTE FUNCTION public.touch_simulator_updated_at();

ALTER TABLE public.sim_wallet_keys ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.sim_wallet_keys FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sim_wallet_keys TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.sim_wallet_keys_id_seq TO service_role;

CREATE TABLE IF NOT EXISTS public.sim_wallet_profiles (
  wallet_address text PRIMARY KEY
    REFERENCES public.sim_wallet_keys(wallet_address) ON DELETE CASCADE,
  persona_name text NOT NULL DEFAULT 'SIM',
  aggression_score integer NOT NULL DEFAULT 50 CHECK (aggression_score BETWEEN 0 AND 100),
  box_open_bias integer NOT NULL DEFAULT 50 CHECK (box_open_bias BETWEEN 0 AND 100),
  auction_bid_bias integer NOT NULL DEFAULT 50 CHECK (auction_bid_bias BETWEEN 0 AND 100),
  launch_bias integer NOT NULL DEFAULT 50 CHECK (launch_bias BETWEEN 0 AND 100),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sim_wallet_profiles_active_idx
  ON public.sim_wallet_profiles (active, wallet_address);

DROP TRIGGER IF EXISTS touch_sim_wallet_profiles_updated_at ON public.sim_wallet_profiles;
CREATE TRIGGER touch_sim_wallet_profiles_updated_at
BEFORE UPDATE ON public.sim_wallet_profiles
FOR EACH ROW
EXECUTE FUNCTION public.touch_simulator_updated_at();

ALTER TABLE public.sim_wallet_profiles ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.sim_wallet_profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sim_wallet_profiles TO service_role;

CREATE TABLE IF NOT EXISTS public.sim_activity_schedule (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  wallet_address text NOT NULL
    REFERENCES public.sim_wallet_keys(wallet_address) ON DELETE CASCADE,
  activity_type text NOT NULL
    CHECK (activity_type IN ('sync_balance', 'claim_faucet', 'open_box', 'submit_auction', 'place_bid', 'launch_rocket', 'seed_eth_lock')),
  scheduled_for timestamptz NOT NULL,
  executed_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sim_activity_schedule_pending_idx
  ON public.sim_activity_schedule (status, scheduled_for ASC);

CREATE INDEX IF NOT EXISTS sim_activity_schedule_wallet_idx
  ON public.sim_activity_schedule (wallet_address, created_at DESC);

DROP TRIGGER IF EXISTS touch_sim_activity_schedule_updated_at ON public.sim_activity_schedule;
CREATE TRIGGER touch_sim_activity_schedule_updated_at
BEFORE UPDATE ON public.sim_activity_schedule
FOR EACH ROW
EXECUTE FUNCTION public.touch_simulator_updated_at();

ALTER TABLE public.sim_activity_schedule ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.sim_activity_schedule FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sim_activity_schedule TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.sim_activity_schedule_id_seq TO service_role;

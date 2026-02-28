/*
  # Add FLUX reconciliation snapshots and RPC

  ## Summary
  - Adds reconciliation_snapshots table for persistent drift tracking
  - Adds run_flux_reconciliation() RPC that compares wallet_flux_balances
    against SUM(flux_ledger_entries.amount_flux) per wallet
  - Records any drift with wallet, expected, actual, and delta
  - Extends the existing flux_ledger_reconciliation view into an actionable log
*/

CREATE TABLE IF NOT EXISTS reconciliation_snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL REFERENCES wallet_registry(wallet_address) ON DELETE RESTRICT,
  expected_balance numeric(38, 18) NOT NULL,
  actual_balance numeric(38, 18) NOT NULL,
  delta numeric(38, 18) NOT NULL,
  ledger_entry_count bigint NOT NULL DEFAULT 0,
  last_ledger_entry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reconciliation_snapshots_run_idx
  ON reconciliation_snapshots (run_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reconciliation_snapshots_wallet_idx
  ON reconciliation_snapshots (wallet_address, created_at DESC);

CREATE INDEX IF NOT EXISTS reconciliation_snapshots_drift_idx
  ON reconciliation_snapshots (created_at DESC)
  WHERE delta <> 0;

ALTER TABLE reconciliation_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct client access" ON reconciliation_snapshots;
CREATE POLICY "Deny direct client access"
  ON reconciliation_snapshots
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

REVOKE ALL ON TABLE reconciliation_snapshots FROM anon, authenticated;
GRANT SELECT ON reconciliation_snapshots TO service_role;

CREATE OR REPLACE FUNCTION public.run_flux_reconciliation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id uuid;
  v_total_wallets integer;
  v_wallets_with_drift integer;
  v_max_drift numeric(38, 18);
BEGIN
  v_run_id := gen_random_uuid();

  INSERT INTO reconciliation_snapshots (
    run_id,
    wallet_address,
    expected_balance,
    actual_balance,
    delta,
    ledger_entry_count,
    last_ledger_entry_at
  )
  SELECT
    v_run_id,
    bal.wallet_address,
    COALESCE(ledger.ledger_sum, 0) AS expected_balance,
    bal.available_balance AS actual_balance,
    bal.available_balance - COALESCE(ledger.ledger_sum, 0) AS delta,
    COALESCE(ledger.entry_count, 0),
    ledger.last_entry_at
  FROM wallet_flux_balances bal
  LEFT JOIN (
    SELECT
      wallet_address,
      SUM(amount_flux) AS ledger_sum,
      COUNT(*) AS entry_count,
      MAX(created_at) AS last_entry_at
    FROM flux_ledger_entries
    GROUP BY wallet_address
  ) ledger ON ledger.wallet_address = bal.wallet_address;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE delta <> 0),
    COALESCE(MAX(ABS(delta)), 0)
  INTO v_total_wallets, v_wallets_with_drift, v_max_drift
  FROM reconciliation_snapshots
  WHERE run_id = v_run_id;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'total_wallets', v_total_wallets,
    'wallets_with_drift', v_wallets_with_drift,
    'max_absolute_drift', v_max_drift,
    'created_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_flux_reconciliation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_flux_reconciliation() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_flux_reconciliation() TO service_role;

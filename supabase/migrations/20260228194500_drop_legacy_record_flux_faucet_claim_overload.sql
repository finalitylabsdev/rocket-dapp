/*
  # Drop the legacy 13-argument record_flux_faucet_claim overload

  ## Summary
  - Removes the pre-idempotency function signature for `record_flux_faucet_claim`
  - Leaves the 14-argument idempotent signature as the only live RPC surface
  - Prevents PostgREST from raising an ambiguous function resolution error
    when callers omit `p_idempotency_key`
*/

DROP FUNCTION IF EXISTS public.record_flux_faucet_claim(
  text,
  numeric,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  bigint,
  numeric,
  timestamptz,
  text
);

/*
  # Drop the legacy 6-argument place_auction_bid overload

  ## Summary
  - Removes the pre-idempotency function signature for `place_auction_bid`
  - Leaves the 7-argument idempotent signature as the only live RPC surface
  - Prevents PostgREST from raising an ambiguous function resolution error
    when callers omit `p_idempotency_key`
*/

DROP FUNCTION IF EXISTS public.place_auction_bid(
  text,
  bigint,
  numeric,
  numeric,
  timestamptz,
  text
);

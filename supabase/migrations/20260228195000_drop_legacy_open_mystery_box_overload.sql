/*
  # Drop the legacy 5-argument open_mystery_box overload

  ## Summary
  - Removes the pre-idempotency function signature for `open_mystery_box`
  - Leaves the 6-argument idempotent signature as the only live RPC surface
  - Prevents PostgREST from raising an ambiguous function resolution error
    when callers omit `p_idempotency_key`
*/

DROP FUNCTION IF EXISTS public.open_mystery_box(
  text,
  text,
  numeric,
  timestamptz,
  text
);

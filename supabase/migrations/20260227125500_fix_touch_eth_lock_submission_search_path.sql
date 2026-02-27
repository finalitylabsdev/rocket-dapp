/*
  # Fix mutable search_path on touch_eth_lock_submission

  ## Summary
  - Recreates the trigger helper with an explicit `search_path`
  - Removes the Security Advisor warning for mutable search_path
*/

CREATE OR REPLACE FUNCTION public.touch_eth_lock_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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

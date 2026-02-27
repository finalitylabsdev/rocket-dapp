CREATE OR REPLACE FUNCTION public.run_auction_tick()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round record;
  v_transitioned jsonb[] := ARRAY[]::jsonb[];
  v_finalized jsonb[] := ARRAY[]::jsonb[];
  v_started jsonb;
BEGIN
  -- Keep the entire tick inside one transaction so concurrent invocations cannot overlap.
  IF NOT pg_try_advisory_xact_lock(628314, 1700) THEN
    RETURN jsonb_build_object(
      'status', 'busy',
      'transitioned', '[]'::jsonb,
      'finalized', '[]'::jsonb,
      'started', NULL
    );
  END IF;

  FOR v_round IN
    SELECT id
    FROM public.auction_rounds
    WHERE status = 'accepting_submissions'
      AND submission_ends_at <= now()
    ORDER BY submission_ends_at ASC
  LOOP
    v_transitioned := array_append(v_transitioned, public.transition_auction_to_bidding(v_round.id));
  END LOOP;

  FOR v_round IN
    SELECT id
    FROM public.auction_rounds
    WHERE status = 'bidding'
      AND ends_at <= now()
    ORDER BY ends_at ASC
  LOOP
    v_finalized := array_append(v_finalized, public.finalize_auction(v_round.id));
  END LOOP;

  v_started := public.start_auction_round();

  RETURN jsonb_build_object(
    'status', 'ok',
    'transitioned', to_jsonb(v_transitioned),
    'finalized', to_jsonb(v_finalized),
    'started', v_started
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_auction_tick() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.run_auction_tick() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_auction_tick() TO service_role;

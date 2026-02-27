/*
  # Add cosmic jackpot snapshot RPC

  ## Summary
  Creates a public RPC that exposes live jackpot aggregates from the tables that
  currently receive real traffic, plus a singleton heartbeat table for Supabase
  Realtime subscriptions.

  ## New objects
  - `public.cosmic_jackpot_updates`
  - `public.touch_cosmic_jackpot_updates()`
  - `public.get_cosmic_jackpot_snapshot()`

  ## Security
  - RLS enabled on `public.cosmic_jackpot_updates`
  - Public SELECT allowed on the heartbeat row
  - RPC is `SECURITY DEFINER` and executable by `anon` and `authenticated`
*/

CREATE TABLE IF NOT EXISTS public.cosmic_jackpot_updates (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'bootstrap'
);

ALTER TABLE public.cosmic_jackpot_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cosmic jackpot heartbeat is publicly readable" ON public.cosmic_jackpot_updates;

CREATE POLICY "Cosmic jackpot heartbeat is publicly readable"
  ON public.cosmic_jackpot_updates
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.cosmic_jackpot_updates (id, updated_at, source)
VALUES (true, now(), 'bootstrap')
ON CONFLICT (id) DO UPDATE
SET
  updated_at = EXCLUDED.updated_at,
  source = EXCLUDED.source;

CREATE OR REPLACE FUNCTION public.touch_cosmic_jackpot_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cosmic_jackpot_updates (id, updated_at, source)
  VALUES (true, now(), TG_TABLE_NAME)
  ON CONFLICT (id) DO UPDATE
  SET
    updated_at = EXCLUDED.updated_at,
    source = EXCLUDED.source;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS touch_cosmic_jackpot_updates_from_app_logs ON public.app_logs;
CREATE TRIGGER touch_cosmic_jackpot_updates_from_app_logs
AFTER INSERT OR UPDATE OR DELETE ON public.app_logs
FOR EACH ROW
EXECUTE FUNCTION public.touch_cosmic_jackpot_updates();

DROP TRIGGER IF EXISTS touch_cosmic_jackpot_updates_from_flux_ledger_entries ON public.flux_ledger_entries;
CREATE TRIGGER touch_cosmic_jackpot_updates_from_flux_ledger_entries
AFTER INSERT OR UPDATE OR DELETE ON public.flux_ledger_entries
FOR EACH ROW
EXECUTE FUNCTION public.touch_cosmic_jackpot_updates();

DROP TRIGGER IF EXISTS touch_cosmic_jackpot_updates_from_wallet_flux_balances ON public.wallet_flux_balances;
CREATE TRIGGER touch_cosmic_jackpot_updates_from_wallet_flux_balances
AFTER INSERT OR UPDATE OR DELETE ON public.wallet_flux_balances
FOR EACH ROW
EXECUTE FUNCTION public.touch_cosmic_jackpot_updates();

DROP TRIGGER IF EXISTS touch_cosmic_jackpot_updates_from_eth_lock_submissions ON public.eth_lock_submissions;
CREATE TRIGGER touch_cosmic_jackpot_updates_from_eth_lock_submissions
AFTER INSERT OR UPDATE OR DELETE ON public.eth_lock_submissions
FOR EACH ROW
EXECUTE FUNCTION public.touch_cosmic_jackpot_updates();

DROP TRIGGER IF EXISTS touch_cosmic_jackpot_updates_from_auction_submissions ON public.auction_submissions;
CREATE TRIGGER touch_cosmic_jackpot_updates_from_auction_submissions
AFTER INSERT OR UPDATE OR DELETE ON public.auction_submissions
FOR EACH ROW
EXECUTE FUNCTION public.touch_cosmic_jackpot_updates();

DROP TRIGGER IF EXISTS touch_cosmic_jackpot_updates_from_auction_bids ON public.auction_bids;
CREATE TRIGGER touch_cosmic_jackpot_updates_from_auction_bids
AFTER INSERT OR UPDATE OR DELETE ON public.auction_bids
FOR EACH ROW
EXECUTE FUNCTION public.touch_cosmic_jackpot_updates();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'cosmic_jackpot_updates'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.cosmic_jackpot_updates;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_cosmic_jackpot_snapshot()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH wallets AS (
  SELECT wallet_address
  FROM public.wallet_registry
),
app_log_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS app_events,
    MAX(created_at) AS last_app_event_at
  FROM public.app_logs
  WHERE wallet_address IS NOT NULL
  GROUP BY wallet_address
),
flux_event_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS flux_events,
    MAX(created_at) AS last_flux_event_at
  FROM public.flux_ledger_entries
  GROUP BY wallet_address
),
lock_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS lock_events,
    COALESCE(SUM(CASE WHEN is_lock_active THEN amount_eth ELSE 0 END), 0)::numeric(18, 6) AS eth_locked,
    MAX(GREATEST(COALESCE(updated_at, created_at), created_at)) AS last_lock_event_at
  FROM public.eth_lock_submissions
  GROUP BY wallet_address
),
wallet_balances AS (
  SELECT
    wallet_address,
    COALESCE(lifetime_spent, 0)::numeric(18, 2) AS flux_burned,
    updated_at AS last_balance_event_at
  FROM public.wallet_flux_balances
),
auction_submission_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS submission_events,
    MAX(created_at) AS last_submission_event_at
  FROM public.auction_submissions
  GROUP BY wallet_address
),
auction_bid_counts AS (
  SELECT
    wallet_address,
    COUNT(*)::int AS bid_events,
    MAX(created_at) AS last_bid_event_at
  FROM public.auction_bids
  GROUP BY wallet_address
),
scored_wallets AS (
  SELECT
    w.wallet_address,
    (
      COALESCE(a.app_events, 0)
      + COALESCE(f.flux_events, 0)
      + COALESCE(l.lock_events, 0)
      + COALESCE(s.submission_events, 0)
      + COALESCE(b.bid_events, 0)
    )::int AS activity_events,
    COALESCE(bal.flux_burned, 0)::numeric(18, 2) AS flux_burned,
    COALESCE(l.eth_locked, 0)::numeric(18, 6) AS eth_locked,
    GREATEST(
      COALESCE(a.last_app_event_at, '-infinity'::timestamptz),
      COALESCE(f.last_flux_event_at, '-infinity'::timestamptz),
      COALESCE(l.last_lock_event_at, '-infinity'::timestamptz),
      COALESCE(bal.last_balance_event_at, '-infinity'::timestamptz),
      COALESCE(s.last_submission_event_at, '-infinity'::timestamptz),
      COALESCE(b.last_bid_event_at, '-infinity'::timestamptz)
    ) AS last_activity_at
  FROM wallets w
  LEFT JOIN app_log_counts a
    ON a.wallet_address = w.wallet_address
  LEFT JOIN flux_event_counts f
    ON f.wallet_address = w.wallet_address
  LEFT JOIN lock_counts l
    ON l.wallet_address = w.wallet_address
  LEFT JOIN wallet_balances bal
    ON bal.wallet_address = w.wallet_address
  LEFT JOIN auction_submission_counts s
    ON s.wallet_address = w.wallet_address
  LEFT JOIN auction_bid_counts b
    ON b.wallet_address = w.wallet_address
),
active_wallets AS (
  SELECT *
  FROM scored_wallets
  WHERE activity_events > 0
     OR flux_burned > 0
     OR eth_locked > 0
),
ranked_wallets AS (
  SELECT
    wallet_address,
    activity_events,
    flux_burned,
    eth_locked,
    ROW_NUMBER() OVER (
      ORDER BY activity_events DESC, flux_burned DESC, eth_locked DESC, wallet_address ASC
    )::int AS rank,
    last_activity_at
  FROM active_wallets
),
top_entries AS (
  SELECT
    wallet_address,
    activity_events,
    flux_burned,
    eth_locked,
    rank,
    rank AS prev_rank,
    last_activity_at
  FROM ranked_wallets
  ORDER BY rank
  LIMIT 20
),
summary AS (
  SELECT
    (SELECT COUNT(*)::int FROM wallets) AS known_wallets,
    (SELECT COUNT(*)::int FROM active_wallets) AS active_players,
    COALESCE((SELECT SUM(activity_events) FROM active_wallets), 0)::int AS activity_events,
    COALESCE((SELECT SUM(flux_burned) FROM active_wallets), 0)::numeric(18, 2) AS flux_burned,
    COALESCE((SELECT SUM(eth_locked) FROM active_wallets), 0)::numeric(18, 6) AS locked_pool_eth,
    COALESCE(
      (SELECT MAX(last_activity_at) FROM active_wallets),
      (SELECT updated_at FROM public.cosmic_jackpot_updates WHERE id = true),
      now()
    ) AS generated_at
)
SELECT jsonb_build_object(
  'source', 'activity_proxy',
  'generated_at', summary.generated_at,
  'summary', jsonb_build_object(
    'known_wallets', summary.known_wallets,
    'active_players', summary.active_players,
    'activity_events', summary.activity_events,
    'flux_burned', summary.flux_burned,
    'locked_pool_eth', summary.locked_pool_eth,
    'daily_eth_prize', ROUND((summary.locked_pool_eth * 0.5)::numeric, 6)
  ),
  'entries', COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', wallet_address,
          'wallet_address', wallet_address,
          'activity_events', activity_events,
          'flux_burned', flux_burned,
          'eth_locked', eth_locked,
          'rank', rank,
          'prev_rank', prev_rank,
          'last_activity_at', last_activity_at
        )
        ORDER BY rank
      )
      FROM top_entries
    ),
    '[]'::jsonb
  )
)
FROM summary;
$$;

REVOKE ALL ON FUNCTION public.get_cosmic_jackpot_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_cosmic_jackpot_snapshot() FROM anon;
REVOKE ALL ON FUNCTION public.get_cosmic_jackpot_snapshot() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_cosmic_jackpot_snapshot() TO anon, authenticated;

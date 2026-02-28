/*
  # Reconcile active legacy-format auction rounds

  ## Summary
  - Shortens untouched active rounds that were created before the hourly cadence migration
  - Only touches accepting-submissions rounds with zero submissions and zero bids
*/

UPDATE public.auction_rounds ar
SET
  submission_ends_at = ar.starts_at + interval '15 minutes',
  ends_at = ar.starts_at + interval '1 hour',
  updated_at = now()
WHERE ar.status = 'accepting_submissions'
  AND ar.ends_at > now()
  AND ar.submission_ends_at = ar.starts_at + interval '30 minutes'
  AND ar.ends_at = ar.starts_at + interval '4 hours'
  AND NOT EXISTS (
    SELECT 1
    FROM public.auction_submissions s
    WHERE s.round_id = ar.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.auction_bids b
    WHERE b.round_id = ar.id
  );

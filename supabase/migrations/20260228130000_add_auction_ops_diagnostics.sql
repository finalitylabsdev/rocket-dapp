/*
  # Add auction operations diagnostics views

  ## Summary
  - Adds operator-facing views for auction round lifecycle visibility
  - Adds FLUX ledger reconciliation view for balance integrity checks
  - Adds auction round summary view for scheduler health monitoring
  - All views are service_role-only (no authenticated/anon access)
*/

-- Auction round diagnostics: full lifecycle state for every round
CREATE OR REPLACE VIEW public.auction_round_diagnostics AS
SELECT
  ar.id AS round_id,
  ar.status,
  ar.starts_at,
  ar.submission_ends_at,
  ar.bidding_opens_at,
  ar.ends_at,
  ar.created_at,
  ar.updated_at,
  ar.selected_part_id,
  ar.selected_by_wallet,
  ar.winning_bid_id,
  ar.final_price,
  ar.winner_wallet,
  -- Timing diagnostics
  CASE
    WHEN ar.status IN ('accepting_submissions', 'bidding') AND ar.ends_at > now()
      THEN 'active'
    WHEN ar.status IN ('accepting_submissions', 'bidding') AND ar.ends_at <= now()
      THEN 'overdue'
    WHEN ar.status = 'finalizing'
      THEN 'settling'
    ELSE ar.status
  END AS health,
  CASE
    WHEN ar.status = 'accepting_submissions' AND ar.submission_ends_at > now()
      THEN EXTRACT(EPOCH FROM (ar.submission_ends_at - now()))::integer
    WHEN ar.status = 'bidding' AND ar.ends_at > now()
      THEN EXTRACT(EPOCH FROM (ar.ends_at - now()))::integer
    ELSE 0
  END AS seconds_remaining,
  -- Submission stats
  (SELECT COUNT(*) FROM auction_submissions sub WHERE sub.round_id = ar.id)
    AS submission_count,
  (SELECT COUNT(*) FROM auction_submissions sub WHERE sub.round_id = ar.id AND sub.is_selected)
    AS selected_count,
  -- Bid stats
  (SELECT COUNT(*) FROM auction_bids bid WHERE bid.round_id = ar.id AND NOT bid.is_refunded)
    AS active_bid_count,
  (SELECT COUNT(*) FROM auction_bids bid WHERE bid.round_id = ar.id AND bid.is_refunded)
    AS refunded_bid_count,
  (SELECT COALESCE(MAX(bid.amount), 0) FROM auction_bids bid WHERE bid.round_id = ar.id AND NOT bid.is_refunded)
    AS highest_active_bid,
  -- Part info (if selected)
  pv.name AS part_name,
  rt.name AS part_rarity,
  ip.part_value
FROM auction_rounds ar
LEFT JOIN inventory_parts ip ON ip.id = ar.selected_part_id
LEFT JOIN part_variants pv ON pv.id = ip.variant_id
LEFT JOIN rarity_tiers rt ON rt.id = ip.rarity_tier_id
ORDER BY ar.id DESC;

-- FLUX ledger reconciliation: balance vs ledger sum per wallet
CREATE OR REPLACE VIEW public.flux_ledger_reconciliation AS
SELECT
  bal.wallet_address,
  bal.available_balance AS recorded_balance,
  COALESCE(ledger.ledger_sum, 0) AS ledger_sum,
  bal.available_balance - COALESCE(ledger.ledger_sum, 0) AS drift,
  ABS(bal.available_balance - COALESCE(ledger.ledger_sum, 0)) > 0.001 AS has_drift,
  bal.lifetime_claimed,
  bal.lifetime_spent,
  bal.updated_at AS balance_updated_at,
  ledger.entry_count,
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
) ledger ON ledger.wallet_address = bal.wallet_address
ORDER BY ABS(bal.available_balance - COALESCE(ledger.ledger_sum, 0)) DESC;

-- Scheduler health: summary of recent round activity
CREATE OR REPLACE VIEW public.auction_scheduler_health AS
SELECT
  (SELECT COUNT(*) FROM auction_rounds WHERE status IN ('accepting_submissions', 'bidding') AND ends_at > now())
    AS active_rounds,
  (SELECT COUNT(*) FROM auction_rounds WHERE status IN ('accepting_submissions', 'bidding') AND ends_at <= now())
    AS overdue_rounds,
  (SELECT COUNT(*) FROM auction_rounds WHERE status = 'finalizing')
    AS stuck_finalizing,
  (SELECT COUNT(*) FROM auction_rounds WHERE status = 'completed')
    AS completed_rounds,
  (SELECT COUNT(*) FROM auction_rounds WHERE status = 'no_submissions')
    AS empty_rounds,
  (SELECT MAX(created_at) FROM auction_rounds)
    AS last_round_created_at,
  (SELECT MAX(updated_at) FROM auction_rounds WHERE status = 'completed')
    AS last_round_completed_at,
  (SELECT COUNT(*) FROM auction_rounds WHERE created_at > now() - interval '24 hours')
    AS rounds_last_24h,
  -- Ledger health
  (SELECT COUNT(*) FROM flux_ledger_reconciliation WHERE has_drift)
    AS wallets_with_drift;

-- Deny all access to diagnostic views for non-service roles
REVOKE ALL ON public.auction_round_diagnostics FROM anon, authenticated;
REVOKE ALL ON public.flux_ledger_reconciliation FROM anon, authenticated;
REVOKE ALL ON public.auction_scheduler_health FROM anon, authenticated;

GRANT SELECT ON public.auction_round_diagnostics TO service_role;
GRANT SELECT ON public.flux_ledger_reconciliation TO service_role;
GRANT SELECT ON public.auction_scheduler_health TO service_role;

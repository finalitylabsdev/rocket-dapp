/*
  # Repair missing flux ledger idempotency key support

  Production currently has the idempotent `place_auction_bid(...)` function body
  without the earlier schema migration that adds `flux_ledger_entries.idempotency_key`.
  This repair makes the schema compatible with the deployed function surface.
*/

ALTER TABLE public.flux_ledger_entries
  ADD COLUMN IF NOT EXISTS idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS flux_ledger_entries_idempotency_key_idx
  ON public.flux_ledger_entries (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

/*
  # Add chain-cutover linkage fields to canonical gameplay records

  ## Summary
  - Adds chain-ready linkage metadata to inventory parts, which are the canonical gameplay assets
  - Adds bid-level reconciliation metadata to auction bids, where the future chain mapping is one-to-one
  - Keeps launch authority unchanged: all new columns default to off-chain state and are metadata-only

  ## Notes
  - `auction_rounds` and `auction_submissions` are intentionally unchanged here because their eventual
    contract/event identifiers are not yet stable enough to reserve without guessing.
*/

ALTER TABLE public.inventory_parts
  ADD COLUMN IF NOT EXISTS chain_status text NOT NULL DEFAULT 'offchain'
    CHECK (chain_status IN ('offchain', 'pending', 'confirmed', 'failed')),
  ADD COLUMN IF NOT EXISTS chain_tx_hash text
    CHECK (chain_tx_hash IS NULL OR chain_tx_hash ~ '^0x[0-9a-f]{64}$'),
  ADD COLUMN IF NOT EXISTS chain_token_id numeric(78, 0)
    CHECK (chain_token_id IS NULL OR chain_token_id >= 0),
  ADD COLUMN IF NOT EXISTS chain_block_number bigint
    CHECK (chain_block_number IS NULL OR chain_block_number >= 0),
  ADD COLUMN IF NOT EXISTS reconciled_at timestamptz;

CREATE INDEX IF NOT EXISTS inventory_parts_chain_status_idx
  ON public.inventory_parts (chain_status, reconciled_at);

CREATE INDEX IF NOT EXISTS inventory_parts_chain_tx_hash_idx
  ON public.inventory_parts (chain_tx_hash)
  WHERE chain_tx_hash IS NOT NULL;

ALTER TABLE public.auction_bids
  ADD COLUMN IF NOT EXISTS chain_status text NOT NULL DEFAULT 'offchain'
    CHECK (chain_status IN ('offchain', 'pending', 'confirmed', 'failed')),
  ADD COLUMN IF NOT EXISTS chain_tx_hash text
    CHECK (chain_tx_hash IS NULL OR chain_tx_hash ~ '^0x[0-9a-f]{64}$'),
  ADD COLUMN IF NOT EXISTS chain_block_number bigint
    CHECK (chain_block_number IS NULL OR chain_block_number >= 0),
  ADD COLUMN IF NOT EXISTS reconciled_at timestamptz;

CREATE INDEX IF NOT EXISTS auction_bids_chain_status_idx
  ON public.auction_bids (chain_status, reconciled_at);

CREATE INDEX IF NOT EXISTS auction_bids_chain_tx_hash_idx
  ON public.auction_bids (chain_tx_hash)
  WHERE chain_tx_hash IS NOT NULL;

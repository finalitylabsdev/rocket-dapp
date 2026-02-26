/*
  # Create leaderboard table

  ## Summary
  Creates the leaderboard table for the Entropy protocol's competitive rankings.

  ## New Tables
  - `leaderboard`
    - `id` (uuid, primary key)
    - `wallet_address` (text, unique) — shortened wallet address display
    - `rockets_launched` (integer) — total rockets launched by the player
    - `et_burned` (numeric) — total ET tokens burned
    - `eth_earned` (numeric) — total ETH earned from prizes
    - `rank` (integer) — current season rank
    - `prev_rank` (integer) — previous rank for movement arrow calculation
    - `season` (integer) — which season this entry belongs to
    - `updated_at` (timestamptz)
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Public SELECT allowed (leaderboard is public data)
  - No INSERT/UPDATE/DELETE from client (managed server-side only)

  ## Seed Data
  Inserts 20 realistic seed entries for Season 1.
*/

CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  rockets_launched integer NOT NULL DEFAULT 0,
  et_burned numeric(18, 4) NOT NULL DEFAULT 0,
  eth_earned numeric(18, 6) NOT NULL DEFAULT 0,
  rank integer NOT NULL DEFAULT 0,
  prev_rank integer NOT NULL DEFAULT 0,
  season integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboard FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO leaderboard (wallet_address, rockets_launched, et_burned, eth_earned, rank, prev_rank, season) VALUES
  ('0x1a2b3c4d…9f8e', 284, 12400.0000, 1.842600, 1,  3, 1),
  ('0x9e0f1a2b…5b4c', 241, 9820.0000,  1.420000, 2,  1, 1),
  ('0x4f5a6b7c…6c7d', 198, 7105.0000,  0.980000, 3,  2, 1),
  ('0xd3e4f5a6…8b9c', 175, 6550.0000,  0.750000, 4,  4, 1),
  ('0x7b8c9d0e…1f2a', 162, 5900.0000,  0.620000, 5,  7, 1),
  ('0x2e3f4a5b…3d4e', 148, 5200.0000,  0.510000, 6,  5, 1),
  ('0xc1d2e3f4…0a1b', 134, 4800.0000,  0.440000, 7,  6, 1),
  ('0x8f9a0b1c…2c3d', 121, 4100.0000,  0.380000, 8,  9, 1),
  ('0x5e6f7a8b…4e5f', 109, 3750.0000,  0.320000, 9,  8, 1),
  ('0xa0b1c2d3…5f6a', 98,  3200.0000,  0.275000, 10, 12, 1),
  ('0x3c4d5e6f…7b8c', 87,  2900.0000,  0.240000, 11, 10, 1),
  ('0xf1a2b3c4…9d0e', 79,  2600.0000,  0.205000, 12, 11, 1),
  ('0x6d7e8f9a…0b1c', 71,  2200.0000,  0.174000, 13, 15, 1),
  ('0xb2c3d4e5…2d3e', 65,  1950.0000,  0.155000, 14, 13, 1),
  ('0x0e1f2a3b…4f5a', 58,  1700.0000,  0.132000, 15, 14, 1),
  ('0x4a5b6c7d…6b7c', 52,  1480.0000,  0.115000, 16, 18, 1),
  ('0xc8d9e0f1…8d9e', 46,  1250.0000,  0.098000, 17, 16, 1),
  ('0x7f8a9b0c…0f1a', 39,  1020.0000,  0.081000, 18, 17, 1),
  ('0xe4f5a6b7…2a3b', 31,  780.0000,   0.062000, 19, 20, 1),
  ('0x1b2c3d4e…4c5d', 24,  540.0000,   0.043000, 20, 19, 1)
ON CONFLICT (wallet_address) DO NOTHING;

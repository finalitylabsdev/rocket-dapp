/*
  # Add Star Vault catalog tables and seed data

  ## Summary
  - Adds database-driven rarity, section, part, and box catalog tables
  - Seeds the 8 rarity tiers, 8 rocket sections, 64 part variants, and 8 box tiers
  - Stores weighted drop tables in SQL for server-side mystery box opens
*/

CREATE TABLE IF NOT EXISTS rarity_tiers (
  id smallint PRIMARY KEY,
  name text NOT NULL UNIQUE,
  multiplier numeric(4, 2) NOT NULL,
  base_box_price_flux numeric(38, 18) NOT NULL,
  approximate_drop_rate numeric(5, 2) NOT NULL,
  color text NOT NULL,
  bg text NOT NULL,
  border text NOT NULL,
  glow text NOT NULL,
  intensity smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rocket_sections (
  id smallint PRIMARY KEY,
  key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  attr1_name text NOT NULL,
  attr2_name text NOT NULL,
  attr3_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS part_variants (
  id smallint PRIMARY KEY,
  section_id smallint NOT NULL REFERENCES rocket_sections(id),
  variant_index smallint NOT NULL CHECK (variant_index BETWEEN 1 AND 8),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, variant_index)
);

CREATE TABLE IF NOT EXISTS box_tiers (
  id text PRIMARY KEY,
  rarity_tier_id smallint NOT NULL REFERENCES rarity_tiers(id),
  name text NOT NULL,
  tagline text NOT NULL,
  rewards_description text[] NOT NULL,
  possible_stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS box_drop_weights (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  box_tier_id text NOT NULL REFERENCES box_tiers(id),
  rarity_tier_id smallint NOT NULL REFERENCES rarity_tiers(id),
  weight smallint NOT NULL CHECK (weight > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (box_tier_id, rarity_tier_id)
);

CREATE INDEX IF NOT EXISTS box_drop_weights_tier_idx
  ON box_drop_weights (box_tier_id);

INSERT INTO rarity_tiers (
  id,
  name,
  multiplier,
  base_box_price_flux,
  approximate_drop_rate,
  color,
  bg,
  border,
  glow,
  intensity
)
VALUES
  (1, 'Common',    1.00,  10, 35.00, '#6B7280', 'rgba(107,114,128,0.12)', 'rgba(107,114,128,0.3)',  'rgba(107,114,128,0)',    0),
  (2, 'Uncommon',  1.25,  25, 25.00, '#22C55E', 'rgba(34,197,94,0.12)',   'rgba(34,197,94,0.3)',    'rgba(34,197,94,0.15)',   1),
  (3, 'Rare',      1.60,  50, 18.00, '#3B82F6', 'rgba(59,130,246,0.12)',  'rgba(59,130,246,0.3)',   'rgba(59,130,246,0.2)',   2),
  (4, 'Epic',      2.00, 100, 10.00, '#8B5CF6', 'rgba(139,92,246,0.12)',  'rgba(139,92,246,0.3)',   'rgba(139,92,246,0.25)',  3),
  (5, 'Legendary', 2.50, 200,  6.00, '#F59E0B', 'rgba(245,158,11,0.12)',  'rgba(245,158,11,0.3)',   'rgba(245,158,11,0.3)',   4),
  (6, 'Mythic',    3.20, 350,  3.50, '#EF4444', 'rgba(239,68,68,0.12)',   'rgba(239,68,68,0.3)',    'rgba(239,68,68,0.35)',   5),
  (7, 'Celestial', 4.00, 500,  1.80, '#06B6D4', 'rgba(6,182,212,0.12)',   'rgba(6,182,212,0.3)',    'rgba(6,182,212,0.4)',    6),
  (8, 'Quantum',   5.00, 750,  0.70, '#E8ECF4', 'rgba(232,236,244,0.12)', 'rgba(232,236,244,0.3)',  'rgba(232,236,244,0.45)', 7)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  multiplier = EXCLUDED.multiplier,
  base_box_price_flux = EXCLUDED.base_box_price_flux,
  approximate_drop_rate = EXCLUDED.approximate_drop_rate,
  color = EXCLUDED.color,
  bg = EXCLUDED.bg,
  border = EXCLUDED.border,
  glow = EXCLUDED.glow,
  intensity = EXCLUDED.intensity;

INSERT INTO rocket_sections (
  id,
  key,
  display_name,
  description,
  attr1_name,
  attr2_name,
  attr3_name
)
VALUES
  (1, 'coreEngine',       'Core Engine',       'The heart of the ship. Determines raw lift-off capability and thermal tolerance.',     'Heat Flux',            'Thrust Efficiency', 'Mass'),
  (2, 'wingPlate',        'Wing-Plate',        'Aerodynamic surfaces that govern flight stability and drag.',                         'Aerodynamic Drag',     'Surface Area',      'Durability'),
  (3, 'fuelCell',         'Fuel Cell',         'Energy storage that determines range and weight efficiency.',                         'Fuel Capacity',        'Energy Density',    'Weight'),
  (4, 'navigationModule', 'Navigation Module', 'On-board intelligence for course-keeping and decision-making.',                       'Accuracy',             'Processing Power',  'Reliability'),
  (5, 'payloadBay',       'Payload Bay',       'Cargo management determines what your rocket can carry and how securely.',            'Cargo Capacity',       'Securing Strength', 'Modularity'),
  (6, 'thrusterArray',    'Thruster Array',    'Secondary propulsion for sustained thrust, fuel cycling, and failsafe systems.',     'Ion Output',           'Fuel Efficiency',   'Redundancy'),
  (7, 'propulsionCables', 'Propulsion Cables', 'Power transmission network, the nervous system of the rocket.',                      'Conductivity',         'Flexibility',       'Insulation'),
  (8, 'shielding',        'Shielding',         'Defensive layer that protects the rocket from cosmic hazards.',                       'Radiation Resistance', 'Impact Resistance', 'Weight')
ON CONFLICT (id) DO UPDATE
SET
  key = EXCLUDED.key,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  attr1_name = EXCLUDED.attr1_name,
  attr2_name = EXCLUDED.attr2_name,
  attr3_name = EXCLUDED.attr3_name;

INSERT INTO part_variants (id, section_id, variant_index, name)
VALUES
  (1, 1, 1, 'Pulse Engine'),
  (2, 1, 2, 'Nova Thruster'),
  (3, 1, 3, 'Quantum Core'),
  (4, 1, 4, 'Radiant Combustor'),
  (5, 1, 5, 'Stellar Pulse'),
  (6, 1, 6, 'Plasma Injector'),
  (7, 1, 7, 'Ion Driver'),
  (8, 1, 8, 'Hyper-Drive'),
  (9, 2, 1, 'Solar Wings'),
  (10, 2, 2, 'Nebula Fins'),
  (11, 2, 3, 'Aerogel Skins'),
  (12, 2, 4, 'Comet Span'),
  (13, 2, 5, 'Meteor Brakes'),
  (14, 2, 6, 'Photon Sails'),
  (15, 2, 7, 'Lumen Vents'),
  (16, 2, 8, 'Void Glides'),
  (17, 3, 1, 'Nebula Tank'),
  (18, 3, 2, 'Void Reservoir'),
  (19, 3, 3, 'Star-Fuel Cell'),
  (20, 3, 4, 'Solar Cell Bank'),
  (21, 3, 5, 'Photon Reactor'),
  (22, 3, 6, 'Dark-Matter Cell'),
  (23, 3, 7, 'Cryo-Fuel Capsule'),
  (24, 3, 8, 'Graviton Storage'),
  (25, 4, 1, 'Astro-Gyro'),
  (26, 4, 2, 'Photon Navigator'),
  (27, 4, 3, 'Quantum GPS'),
  (28, 4, 4, 'Singularity Clock'),
  (29, 4, 5, 'Eclipse Tracker'),
  (30, 4, 6, 'Stellar Atlas'),
  (31, 4, 7, 'Chrono-Scope'),
  (32, 4, 8, 'Deep-Space Comp'),
  (33, 5, 1, 'Cargo Nebula'),
  (34, 5, 2, 'Quantum Cargo'),
  (35, 5, 3, 'Stellar Freight'),
  (36, 5, 4, 'Black-Hole Bay'),
  (37, 5, 5, 'Pulsar Module'),
  (38, 5, 6, 'Interstellar Hold'),
  (39, 5, 7, 'Orbital Storage'),
  (40, 5, 8, 'Modular Crate'),
  (41, 6, 1, 'Ion Array'),
  (42, 6, 2, 'Hyper-Ion Pack'),
  (43, 6, 3, 'Graviton Thrusters'),
  (44, 6, 4, 'Pulsar Blades'),
  (45, 6, 5, 'Dark-Matter Flail'),
  (46, 6, 6, 'Solar-Blade Pack'),
  (47, 6, 7, 'Lumen Cluster'),
  (48, 6, 8, 'Void Engine'),
  (49, 7, 1, 'Quantum Wire'),
  (50, 7, 2, 'Star-Fiber'),
  (51, 7, 3, 'Lumen Conduct'),
  (52, 7, 4, 'Photon Cable'),
  (53, 7, 5, 'Solar-Weld'),
  (54, 7, 6, 'Eclipse Rope'),
  (55, 7, 7, 'Photon Thread'),
  (56, 7, 8, 'Dark-Fiber'),
  (57, 8, 1, 'Event-Horizon Shield'),
  (58, 8, 2, 'Radiation Mantle'),
  (59, 8, 3, 'Impact Field'),
  (60, 8, 4, 'Graviton Barrier'),
  (61, 8, 5, 'Nebula Shell'),
  (62, 8, 6, 'Photon Armor'),
  (63, 8, 7, 'Singularity Plating'),
  (64, 8, 8, 'Void Barrier')
ON CONFLICT (id) DO UPDATE
SET
  section_id = EXCLUDED.section_id,
  variant_index = EXCLUDED.variant_index,
  name = EXCLUDED.name;

INSERT INTO box_tiers (
  id,
  rarity_tier_id,
  name,
  tagline,
  rewards_description,
  possible_stats,
  sort_order
)
VALUES
  ('common',    1, 'Void Crate',        'The starting point',        ARRAY['Common part (x1.0)', 'Uncommon part (x1.25)', 'Rare chance'],         '[{"label":"Best Drop","value":"Rare"},{"label":"Win Chance","value":"~18%"}]'::jsonb, 1),
  ('uncommon',  2, 'Stellar Cache',     'Better odds, better loot',  ARRAY['Uncommon part (x1.25)', 'Rare chance', 'Epic chance'],                '[{"label":"Best Drop","value":"Epic"},{"label":"Win Chance","value":"~10%"}]'::jsonb, 2),
  ('rare',      3, 'Star Vault Box',    'Rarity starts here',        ARRAY['Rare part (x1.6)', 'Epic chance', 'Legendary chance'],                '[{"label":"Best Drop","value":"Legendary"},{"label":"Win Chance","value":"~6%"}]'::jsonb, 3),
  ('epic',      4, 'Astral Chest',      'Pulsing with energy',       ARRAY['Epic part (x2.0)', 'Legendary chance', 'Mythic chance'],              '[{"label":"Best Drop","value":"Mythic"},{"label":"Win Chance","value":"~3.5%"}]'::jsonb, 4),
  ('legendary', 5, 'Solaris Vault',     'Shimmer of gold',           ARRAY['Legendary part (x2.5)', 'Mythic chance', 'Celestial chance'],         '[{"label":"Best Drop","value":"Celestial"},{"label":"Win Chance","value":"~1.8%"}]'::jsonb, 5),
  ('mythic',    6, 'Nova Reliquary',    'Heat at the edge of chaos', ARRAY['Mythic part (x3.2)', 'Celestial chance', 'Quantum chance'],           '[{"label":"Best Drop","value":"Quantum"},{"label":"Win Chance","value":"~0.7%"}]'::jsonb, 6),
  ('celestial', 7, 'Aurora Ark',        'Blue-fire premium crate',   ARRAY['Celestial part (x4.0)', 'High quantum chance'],                      '[{"label":"Best Drop","value":"Quantum"},{"label":"Win Chance","value":"~12%"}]'::jsonb, 7),
  ('quantum',   8, 'Prism Singularity', 'Top-tier reality split',    ARRAY['Quantum part (x5.0)', 'Celestial fallback'],                         '[{"label":"Best Drop","value":"Quantum"},{"label":"Win Chance","value":"~75%"}]'::jsonb, 8)
ON CONFLICT (id) DO UPDATE
SET
  rarity_tier_id = EXCLUDED.rarity_tier_id,
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  rewards_description = EXCLUDED.rewards_description,
  possible_stats = EXCLUDED.possible_stats,
  sort_order = EXCLUDED.sort_order;

INSERT INTO box_drop_weights (box_tier_id, rarity_tier_id, weight)
VALUES
  ('common', 1, 2),
  ('common', 2, 2),
  ('common', 3, 1),
  ('uncommon', 1, 1),
  ('uncommon', 2, 2),
  ('uncommon', 3, 2),
  ('uncommon', 4, 1),
  ('rare', 2, 1),
  ('rare', 3, 2),
  ('rare', 4, 2),
  ('rare', 5, 1),
  ('epic', 3, 1),
  ('epic', 4, 2),
  ('epic', 5, 2),
  ('epic', 6, 1),
  ('legendary', 4, 1),
  ('legendary', 5, 2),
  ('legendary', 6, 2),
  ('legendary', 7, 1),
  ('mythic', 5, 1),
  ('mythic', 6, 2),
  ('mythic', 7, 2),
  ('mythic', 8, 1),
  ('celestial', 6, 1),
  ('celestial', 7, 2),
  ('celestial', 8, 2),
  ('quantum', 7, 1),
  ('quantum', 8, 3)
ON CONFLICT (box_tier_id, rarity_tier_id) DO UPDATE
SET
  weight = EXCLUDED.weight;

ALTER TABLE rarity_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocket_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_drop_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON rarity_tiers;
CREATE POLICY "Allow public read access"
  ON rarity_tiers
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON rocket_sections;
CREATE POLICY "Allow public read access"
  ON rocket_sections
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON part_variants;
CREATE POLICY "Allow public read access"
  ON part_variants
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON box_tiers;
CREATE POLICY "Allow public read access"
  ON box_tiers
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON box_drop_weights;
CREATE POLICY "Allow public read access"
  ON box_drop_weights
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON rarity_tiers FROM anon, authenticated;
REVOKE ALL ON rocket_sections FROM anon, authenticated;
REVOKE ALL ON part_variants FROM anon, authenticated;
REVOKE ALL ON box_tiers FROM anon, authenticated;
REVOKE ALL ON box_drop_weights FROM anon, authenticated;

GRANT SELECT ON rarity_tiers TO anon, authenticated;
GRANT SELECT ON rocket_sections TO anon, authenticated;
GRANT SELECT ON part_variants TO anon, authenticated;
GRANT SELECT ON box_tiers TO anon, authenticated;
GRANT SELECT ON box_drop_weights TO anon, authenticated;

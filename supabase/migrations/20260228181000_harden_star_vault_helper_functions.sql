/*
  # Harden Star Vault helper functions and inventory policy

  ## Summary
  - Pins search_path on the new Star Vault helper functions
  - Rewrites the inventory read policy to use the initplan-friendly auth.uid() form
*/

CREATE OR REPLACE FUNCTION public.star_vault_serial_is_shiny(p_serial bigint)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(p_serial::text ~ '([0-9])\1', false);
$$;

CREATE OR REPLACE FUNCTION public.star_vault_serial_trait(p_serial bigint)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_serial IS NULL OR p_serial <= 0 THEN 'Pending'
    WHEN serial_text ~ '([0-9])\1\1\1' THEN 'Quad Core'
    WHEN serial_text ~ '([0-9])\1\1' THEN 'Triple Echo'
    WHEN serial_text ~ '([0-9])\1' THEN 'Twin Pulse'
    WHEN reverse(serial_text) = serial_text AND length(serial_text) >= 3 THEN 'Mirror Drift'
    WHEN mod(p_serial, 1000) = 0 THEN 'Millennium Mark'
    WHEN mod(p_serial, 100) = 0 THEN 'Century Mark'
    WHEN mod(p_serial, 8) = 0 THEN 'Zenith Run'
    WHEN mod(p_serial, 8) = 1 THEN 'Vanguard Frame'
    WHEN mod(p_serial, 8) = 2 THEN 'Vector Coil'
    WHEN mod(p_serial, 8) = 3 THEN 'Nova Lattice'
    WHEN mod(p_serial, 8) = 4 THEN 'Relay Spine'
    WHEN mod(p_serial, 8) = 5 THEN 'Pioneer Shell'
    WHEN mod(p_serial, 8) = 6 THEN 'Prism Relay'
    ELSE 'Frontier Grade'
  END
  FROM (
    SELECT p_serial::text AS serial_text
  ) resolved;
$$;

CREATE OR REPLACE FUNCTION public.star_vault_roll_attribute(
  p_floor smallint,
  p_cap smallint,
  p_bias numeric
)
RETURNS smallint
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_span integer;
  v_bias numeric := GREATEST(COALESCE(p_bias, 1), 0.05);
  v_roll numeric;
  v_offset integer;
BEGIN
  IF p_floor IS NULL OR p_cap IS NULL THEN
    RAISE EXCEPTION 'attribute floor/cap must be configured';
  END IF;

  IF p_floor > p_cap THEN
    RAISE EXCEPTION 'attribute floor must be <= cap';
  END IF;

  v_span := p_cap - p_floor;
  IF v_span <= 0 THEN
    RETURN p_floor;
  END IF;

  v_roll := 1 - power(1 - random(), v_bias);
  v_offset := LEAST(v_span, floor(v_roll * (v_span + 1))::integer);

  RETURN LEAST(p_cap, p_floor + v_offset)::smallint;
END;
$$;

DROP POLICY IF EXISTS "Users read own inventory" ON public.inventory_parts;

CREATE POLICY "Users read own inventory"
  ON public.inventory_parts
  FOR SELECT
  TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));

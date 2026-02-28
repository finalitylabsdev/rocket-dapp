/*
  # Realign inventory part serial sequence

  ## Summary
  - Advances `inventory_part_serial_number_seq` to the current max `inventory_parts.serial_number`
  - Prevents stale sequence state from colliding with already-issued serial numbers
  - Safe to run repeatedly
*/

SELECT setval(
  'public.inventory_part_serial_number_seq',
  GREATEST(COALESCE((SELECT MAX(serial_number) FROM public.inventory_parts), 1), 1),
  COALESCE((SELECT MAX(serial_number) FROM public.inventory_parts), 0) > 0
);

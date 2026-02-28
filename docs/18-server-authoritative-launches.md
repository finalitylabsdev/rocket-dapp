# 18 - Rocket Lab Server Authority

## Scope

Rocket Lab now treats equipped inventory as the authoritative loadout, moves
launch scoring to Supabase, persists launch history, applies condition damage,
and charges FLUX for both fuel and repair.

This branch depends on the shared inventory contract from stub 1. The migration
in [20260228180000_add_rocket_lab_server_authority.sql](/Users/mblk/Code/finality/rocket-worktrees/wt_lab_server/supabase/migrations/20260228180000_add_rocket_lab_server_authority.sql)
assumes `inventory_parts` already has:

- `condition_pct`
- `serial_number`
- `serial_trait`
- `is_shiny`

## Database Objects

The migration adds:

- `rocket_launches`
- `equip_inventory_part(text, uuid, text)`
- `unequip_inventory_part(text, text)`
- `repair_inventory_part(text, uuid, numeric, timestamptz, text, text)`
- `launch_rocket(text, numeric, timestamptz, text, text)`
- `get_launch_history(text, integer)`

It also replaces `get_user_inventory(text)` so the client receives the enriched
inventory payload needed by Rocket Lab.

## Server Rules

- Loadout authority comes from `inventory_parts.is_equipped` plus
  `inventory_parts.equipped_section_id`.
- `equip_inventory_part` verifies ownership, validates the destination section,
  rejects auction-locked or broken parts, and replaces any existing equipped
  part in that slot.
- `launch_rocket` requires exactly 8 equipped parts, charges FLUX for fuel,
  computes Base, Luck, Randomness, and Total server-side, applies persisted
  meteorite wear to `condition_pct`, and writes a launch record.
- `repair_inventory_part` restores `condition_pct` to `100` and charges FLUX
  from the missing-condition percentage.

## Operator Checklist

1. Apply the stub-1 inventory migration first.
2. Apply
   [20260228180000_add_rocket_lab_server_authority.sql](/Users/mblk/Code/finality/rocket-worktrees/wt_lab_server/supabase/migrations/20260228180000_add_rocket_lab_server_authority.sql).
3. Verify `rocket_launches` exists and RLS is enabled.
4. Verify the five Rocket Lab RPCs are present and granted to
   `authenticated`.
5. Connect a wallet that owns 8 compatible parts, equip one per slot, then run:
   - `launch_rocket(...)`
   - `repair_inventory_part(...)`
6. Confirm:
   - `flux_ledger_entries` received launch fuel and repair debits
   - `wallet_flux_balances.available_balance` decreased correctly
   - `inventory_parts.condition_pct` decreases after launch
   - `rocket_launches` records the score breakdown and damage report

## Current Supabase Note

The attached Supabase project in this session already has the older
`rocket_launches` table and `launch_rocket(text, text)` RPC from the earlier
server-launch branch. It now also exposes the stub-1 inventory columns
(`condition_pct`, `serial_number`, `serial_trait`, `is_shiny`), so this
migration can be applied directly as an in-place upgrade of that older launch
surface.

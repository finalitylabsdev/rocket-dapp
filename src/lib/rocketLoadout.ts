import type { InventoryPart, RocketSection } from '../types/domain';
import { assertSupabaseConfigured } from './shared';
import { formatStarVaultError, normalizeInventoryParts } from './starVault';
import { supabase } from './supabase';

function toFriendlyRocketLoadoutError(message: string | undefined, fallback: string): string {
  if (!message) {
    return fallback;
  }

  if (message.includes('authenticated session required')) {
    return 'Reconnect your wallet to refresh the authenticated session.';
  }

  if (message.includes('wallet does not belong to authenticated user')) {
    return 'The connected wallet does not match the authenticated session.';
  }

  if (message.includes('invalid part selection for slot')) {
    return 'That part cannot be equipped in this slot.';
  }

  if (message.includes('cannot equip locked part')) {
    return 'Locked parts cannot be equipped.';
  }

  if (message.includes('invalid rocket section')) {
    return 'That Rocket Lab slot is unavailable.';
  }

  return message;
}

export async function setRocketLoadoutPart(
  walletAddress: string,
  section: RocketSection,
  partId: string | null,
): Promise<InventoryPart[]> {
  assertSupabaseConfigured(supabase);

  const { data, error } = await supabase!.rpc('set_rocket_loadout_part', {
    p_wallet_address: walletAddress,
    p_section_key: section,
    p_part_id: partId,
  });

  if (error) {
    throw new Error(
      toFriendlyRocketLoadoutError(
        formatStarVaultError(error, 'Failed to update the Rocket Lab loadout.'),
        'Failed to update the Rocket Lab loadout.',
      ),
    );
  }

  return normalizeInventoryParts(data);
}

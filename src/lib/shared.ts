import type { SupabaseClient } from '@supabase/supabase-js';
import type { RarityTier } from '../types/domain';

const RARITY_TIERS: RarityTier[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Celestial', 'Quantum'];

export function assertSupabaseConfigured(client: SupabaseClient | null): asserts client is SupabaseClient {
  if (!client) {
    throw new Error('Supabase is not configured in this environment.');
  }
}

export function toNumber(value: number | string | undefined | null): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

export function isRarityTier(value: string): value is RarityTier {
  return RARITY_TIERS.includes(value as RarityTier);
}

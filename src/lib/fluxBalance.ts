import type { FluxBalance } from './flux';
import { toNumber } from './shared';

export interface FluxBalancePayload {
  wallet_address?: string;
  auth_user_id?: string;
  available_balance?: number | string;
  lifetime_claimed?: number | string;
  lifetime_spent?: number | string;
  last_faucet_claimed_at?: string | null;
  whitelist_bonus_granted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function normalizeFluxBalance(payload: unknown): FluxBalance {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Balance response was malformed.');
  }

  const row = payload as FluxBalancePayload;
  if (typeof row.wallet_address !== 'string' || typeof row.auth_user_id !== 'string') {
    throw new Error('Balance response was incomplete.');
  }

  return {
    walletAddress: row.wallet_address,
    authUserId: row.auth_user_id,
    availableBalance: toNumber(row.available_balance),
    lifetimeClaimed: toNumber(row.lifetime_claimed),
    lifetimeSpent: toNumber(row.lifetime_spent),
    lastFaucetClaimedAt: typeof row.last_faucet_claimed_at === 'string' ? row.last_faucet_claimed_at : null,
    whitelistBonusGrantedAt: typeof row.whitelist_bonus_granted_at === 'string' ? row.whitelist_bonus_granted_at : null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date(0).toISOString(),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date(0).toISOString(),
  };
}

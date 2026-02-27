import { readBooleanEnv } from './env';

/**
 * Feature flags for staged rollout.
 *
 * Each flag reads a VITE_FLAG_* env var via the same boolean parsing used in
 * spec.ts.  All flags default to **true** so the app works unchanged without
 * any env vars set — disable a feature by setting its var to "false" / "0".
 */

export const STAR_VAULT_ENABLED = readBooleanEnv('VITE_FLAG_STAR_VAULT_ENABLED') ?? true;
export const NEBULA_BIDS_ENABLED = readBooleanEnv('VITE_FLAG_NEBULA_BIDS_ENABLED') ?? true;
export const ROCKET_LAB_ENABLED = readBooleanEnv('VITE_FLAG_ROCKET_LAB_ENABLED') ?? true;
export const DEX_ENABLED = readBooleanEnv('VITE_FLAG_DEX_ENABLED') ?? true;
export const FAUCET_ENABLED = readBooleanEnv('VITE_FLAG_FAUCET_ENABLED') ?? true;
export const AUCTION_SCHEDULER_ENABLED = readBooleanEnv('VITE_FLAG_AUCTION_SCHEDULER_ENABLED') ?? true;

export const featureFlags = {
  STAR_VAULT_ENABLED,
  NEBULA_BIDS_ENABLED,
  ROCKET_LAB_ENABLED,
  DEX_ENABLED,
  FAUCET_ENABLED,
  AUCTION_SCHEDULER_ENABLED,
} as const;

export function useFeatureFlags() {
  return featureFlags;
}

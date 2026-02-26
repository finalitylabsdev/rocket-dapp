import type { RarityTier } from '../types/domain';

export const SPEC_FREEZE_VERSION = '2026-02-26-v1';

export const WHITELIST_ETH = 0.05;
export const FAUCET_INTERVAL_SECONDS = 86_400;
export const FAUCET_INTERVAL_MS = FAUCET_INTERVAL_SECONDS * 1000;
export const FAUCET_CLAIM_FLUX = 1;

export const AUCTION_ROUND_SECONDS = 14_400;
export const AUCTION_MIN_INCREMENT_BPS = 500;
export const AUCTION_MIN_RARITY_TIER = 3;

export const PRIZE_EPOCH_SECONDS = 86_400;
export const PRIZE_DISTRIBUTABLE_SHARE_BPS = 5_000;
export const PRIZE_SPLIT_BPS = [5_000, 2_500, 2_500] as const;

export const ROCKET_SLOT_COUNT = 8;
export const DEX_DEFAULT_SLIPPAGE = 0.5;

export const RARITY_MULTIPLIER: Record<RarityTier, number> = {
  Common: 1.0,
  Uncommon: 1.25,
  Rare: 1.6,
  Epic: 2.0,
  Legendary: 2.5,
  Mythic: 3.2,
  Celestial: 4.0,
  Quantum: 5.0,
};

export const RARITY_BOX_PRICE_FLUX: Record<RarityTier, number> = {
  Common: 10,
  Uncommon: 25,
  Rare: 50,
  Epic: 100,
  Legendary: 200,
  Mythic: 350,
  Celestial: 500,
  Quantum: 750,
};

const devFastEconomy = String(import.meta.env.VITE_SPEC_DEV_FAST_ECONOMY || '').toLowerCase();
export const DEV_FAST_ECONOMY = devFastEconomy === '1' || devFastEconomy === 'true';

// Keep fast economy behind an explicit flag to avoid leaking simulation values into default flows.
export const WHITELIST_BONUS_FLUX = DEV_FAST_ECONOMY ? 100 : 0;
export const EFFECTIVE_DAILY_CLAIM_FLUX = DEV_FAST_ECONOMY ? 10 : FAUCET_CLAIM_FLUX;


import type { RarityTier } from '../types/domain';

export const SPEC_FREEZE_VERSION = '2026-02-26-v1';

function readPositiveNumberEnv(key: string): number | null {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === null || raw === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function readBooleanEnv(key: string): boolean | null {
  const raw = import.meta.env[key];
  if (raw === undefined || raw === null || raw === '') return null;
  const normalized = String(raw).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return null;
}

const devFastEconomy = String(import.meta.env.VITE_SPEC_DEV_FAST_ECONOMY || '').toLowerCase();
export const DEV_FAST_ECONOMY = devFastEconomy === '1' || devFastEconomy === 'true';
export const DEX_TRADING_ENABLED =
  readBooleanEnv('VITE_FEATURE_DEX_TRADING_ENABLED') ?? false;

const defaultFaucetIntervalSeconds = DEV_FAST_ECONOMY ? 5 : 86_400;
const defaultWhitelistBonusFlux = DEV_FAST_ECONOMY ? 300 : 0;
const defaultDailyClaimFlux = DEV_FAST_ECONOMY ? 20 : 1;
const defaultWhitelistEth = 0.001;

export const WHITELIST_ETH =
  readPositiveNumberEnv('VITE_SPEC_WHITELIST_ETH') ?? defaultWhitelistEth;
export const FAUCET_INTERVAL_SECONDS =
  readPositiveNumberEnv('VITE_SPEC_FAUCET_INTERVAL_SECONDS') ?? defaultFaucetIntervalSeconds;
export const FAUCET_INTERVAL_MS = FAUCET_INTERVAL_SECONDS * 1000;
export const FAUCET_CLAIM_FLUX = readPositiveNumberEnv('VITE_SPEC_FAUCET_CLAIM_FLUX') ?? 1;
export const WHITELIST_BONUS_FLUX =
  readPositiveNumberEnv('VITE_SPEC_WHITELIST_BONUS_FLUX') ?? defaultWhitelistBonusFlux;
export const EFFECTIVE_DAILY_CLAIM_FLUX =
  readPositiveNumberEnv('VITE_SPEC_DAILY_CLAIM_FLUX') ?? defaultDailyClaimFlux;

export const AUCTION_ROUND_SECONDS = 14_400;
export const AUCTION_SUBMISSION_WINDOW_SECONDS = 1_800;
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

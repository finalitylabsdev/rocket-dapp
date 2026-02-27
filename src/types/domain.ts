export const TOKEN_SYMBOLS = ['Flux', 'wETH', 'wBTC', 'UVD'] as const;
export type TokenSymbol = typeof TOKEN_SYMBOLS[number];
export type LegacyTokenAlias = 'ET';

export const RARITY_TIERS = [
  'Common',
  'Uncommon',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
  'Celestial',
  'Quantum',
] as const;
export type RarityTier = typeof RARITY_TIERS[number];

export const ROCKET_SECTIONS = [
  'coreEngine',
  'wingPlate',
  'fuelCell',
  'navigationModule',
  'payloadBay',
  'thrusterArray',
  'propulsionCables',
  'shielding',
] as const;
export type RocketSection = typeof ROCKET_SECTIONS[number];

export interface AssetReference {
  key: string;
  url?: string | null;
  alt?: string | null;
}
export interface InventoryPart {
  id: string;
  name: string;
  slot: RocketSection;
  rarity: RarityTier;
  power: number;
  attributes: [number, number, number];
  attributeNames: [string, string, string];
  partValue: number;
  sectionName: string;
  rarityTierId: number;
  isLocked?: boolean;
  isEquipped?: boolean;
  source?: 'mystery_box' | 'auction_win' | 'admin';
  createdAt?: string;
  illustration?: AssetReference | null;
}

export interface BoxTierConfig {
  id: string;
  name: string;
  rarity: RarityTier;
  tagline: string;
  price: number;
  rewards: string[];
  possible: { label: string; value: string }[];
  illustration?: AssetReference | null;
}

export interface RarityTierConfig {
  id: number;
  name: RarityTier;
  multiplier: number;
  baseBoxPriceFlux: number;
  approximateDropRate: number;
  color: string;
  bg: string;
  border: string;
  glow: string;
  intensity: number;
  illustration?: AssetReference | null;
}

export interface RocketSectionConfig {
  id: number;
  key: RocketSection;
  displayName: string;
  description: string | null;
  attributeNames: [string, string, string];
  illustration?: AssetReference | null;
}

export interface AuctionBid {
  id: number;
  wallet: string;
  amount: number;
  createdAt: string;
}

export interface AuctionPartInfo {
  id: string;
  name: string;
  sectionName: string;
  rarity: RarityTier;
  rarityTierId: number;
  attributes: [number, number, number];
  attributeNames: [string, string, string];
  partValue: number;
  submittedBy: string;
}

export type AuctionRoundStatus =
  | 'accepting_submissions'
  | 'bidding'
  | 'finalizing'
  | 'completed'
  | 'no_submissions';

export interface AuctionRound {
  roundId: number;
  status: AuctionRoundStatus;
  startsAt: string;
  submissionEndsAt: string;
  endsAt: string;
  biddingOpensAt: string | null;
  part: AuctionPartInfo | null;
  bids: AuctionBid[];
  currentHighestBid: number;
  bidCount: number;
}

export interface AuctionHistoryEntry {
  roundId: number;
  status: Extract<AuctionRoundStatus, 'completed' | 'no_submissions'>;
  startsAt: string;
  endsAt: string;
  finalPrice: number;
  winnerWallet: string | null;
  partName: string | null;
  rarity: RarityTier | null;
  partValue: number;
  sectionName: string | null;
  sellerWallet: string | null;
}

export type InventorySortKey = 'section' | 'rarity' | 'value' | 'name';
export type InventorySortDir = 'asc' | 'desc';

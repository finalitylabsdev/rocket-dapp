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

export const LEGACY_PART_SLOTS = [
  'engine',
  'fuel',
  'body',
  'wings',
  'booster',
  'noseCone',
  'heatShield',
  'gyroscope',
  'solarPanels',
  'landingStruts',
] as const;
export type LegacyPartSlot = typeof LEGACY_PART_SLOTS[number];

export const ALL_PART_SLOTS = [...ROCKET_SECTIONS, ...LEGACY_PART_SLOTS] as const;
export type PartSlot = typeof ALL_PART_SLOTS[number];

export const LEGACY_TO_CANONICAL_SECTION: Record<LegacyPartSlot, RocketSection> = {
  engine: 'coreEngine',
  fuel: 'fuelCell',
  body: 'shielding',
  wings: 'wingPlate',
  booster: 'thrusterArray',
  noseCone: 'navigationModule',
  heatShield: 'shielding',
  gyroscope: 'navigationModule',
  solarPanels: 'payloadBay',
  landingStruts: 'propulsionCables',
};

export interface InventoryPart {
  id: string;
  name: string;
  slot: PartSlot;
  rarity: RarityTier;
  power: number;
  attributes?: [number, number, number];
}


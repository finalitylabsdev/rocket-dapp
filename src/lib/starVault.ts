import { RARITY_BOX_PRICE_FLUX, RARITY_MULTIPLIER, WHITELIST_BONUS_FLUX } from '../config/spec';
import type {
  BoxTierConfig,
  InventoryPart,
  RocketSectionConfig,
  RarityTier,
  RarityTierConfig,
  RocketSection,
} from '../types/domain';
import type { FluxBalance } from './flux';
import { supabase } from './supabase';

interface RarityTierRow {
  id: number | string;
  name: string;
  multiplier: number | string;
  base_box_price_flux: number | string;
  approximate_drop_rate: number | string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  intensity: number | string;
}

interface RocketSectionRow {
  id: number | string;
  key: string;
  display_name: string;
  description: string | null;
  attr1_name: string;
  attr2_name: string;
  attr3_name: string;
}

interface BoxTierRow {
  id: string;
  rarity_tier_id: number | string;
  name: string;
  tagline: string;
  rewards_description: string[];
  possible_stats: unknown;
  sort_order: number | string;
}

interface InventoryPartPayload {
  id?: string;
  name?: string;
  section_key?: string;
  section_name?: string;
  rarity?: string;
  rarity_tier_id?: number | string;
  attr1?: number | string;
  attr2?: number | string;
  attr3?: number | string;
  attr1_name?: string;
  attr2_name?: string;
  attr3_name?: string;
  part_value?: number | string;
  is_locked?: boolean;
  is_equipped?: boolean;
  source?: 'mystery_box' | 'auction_win' | 'admin';
  created_at?: string;
}

interface OpenMysteryBoxResponse {
  part?: InventoryPartPayload;
  balance?: FluxBalancePayload;
  ledger_entry_id?: number | string;
}

interface FluxBalancePayload {
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

const FALLBACK_RARITY_TIERS: RarityTierConfig[] = [
  { id: 1, name: 'Common', multiplier: RARITY_MULTIPLIER.Common, baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Common, approximateDropRate: 35, color: '#6B7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', glow: 'rgba(107,114,128,0)', intensity: 0 },
  { id: 2, name: 'Uncommon', multiplier: RARITY_MULTIPLIER.Uncommon, baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Uncommon, approximateDropRate: 25, color: '#22C55E', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', glow: 'rgba(34,197,94,0.15)', intensity: 1 },
  { id: 3, name: 'Rare', multiplier: RARITY_MULTIPLIER.Rare, baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Rare, approximateDropRate: 18, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', glow: 'rgba(59,130,246,0.2)', intensity: 2 },
  { id: 4, name: 'Epic', multiplier: RARITY_MULTIPLIER.Epic, baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Epic, approximateDropRate: 10, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', glow: 'rgba(139,92,246,0.25)', intensity: 3 },
  { id: 5, name: 'Legendary', multiplier: RARITY_MULTIPLIER.Legendary, baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Legendary, approximateDropRate: 6, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', glow: 'rgba(245,158,11,0.3)', intensity: 4 },
  { id: 6, name: 'Mythic', multiplier: RARITY_MULTIPLIER.Mythic, baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Mythic, approximateDropRate: 3.5, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', glow: 'rgba(239,68,68,0.35)', intensity: 5 },
  { id: 7, name: 'Celestial', multiplier: RARITY_MULTIPLIER.Celestial, baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Celestial, approximateDropRate: 1.8, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', glow: 'rgba(6,182,212,0.4)', intensity: 6 },
  { id: 8, name: 'Quantum', multiplier: RARITY_MULTIPLIER.Quantum, baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Quantum, approximateDropRate: 0.7, color: '#E8ECF4', bg: 'rgba(232,236,244,0.12)', border: 'rgba(232,236,244,0.3)', glow: 'rgba(232,236,244,0.45)', intensity: 7 },
];

const FALLBACK_SECTIONS: RocketSectionConfig[] = [
  { id: 1, key: 'coreEngine', displayName: 'Core Engine', description: 'The heart of the ship. Determines raw lift-off capability and thermal tolerance.', attributeNames: ['Heat Flux', 'Thrust Efficiency', 'Mass'] },
  { id: 2, key: 'wingPlate', displayName: 'Wing-Plate', description: 'Aerodynamic surfaces that govern flight stability and drag.', attributeNames: ['Aerodynamic Drag', 'Surface Area', 'Durability'] },
  { id: 3, key: 'fuelCell', displayName: 'Fuel Cell', description: 'Energy storage that determines range and weight efficiency.', attributeNames: ['Fuel Capacity', 'Energy Density', 'Weight'] },
  { id: 4, key: 'navigationModule', displayName: 'Navigation Module', description: 'On-board intelligence for course-keeping and decision-making.', attributeNames: ['Accuracy', 'Processing Power', 'Reliability'] },
  { id: 5, key: 'payloadBay', displayName: 'Payload Bay', description: 'Cargo management determines what your rocket can carry and how securely.', attributeNames: ['Cargo Capacity', 'Securing Strength', 'Modularity'] },
  { id: 6, key: 'thrusterArray', displayName: 'Thruster Array', description: 'Secondary propulsion for sustained thrust, fuel cycling, and failsafe systems.', attributeNames: ['Ion Output', 'Fuel Efficiency', 'Redundancy'] },
  { id: 7, key: 'propulsionCables', displayName: 'Propulsion Cables', description: 'Power transmission network, the nervous system of the rocket.', attributeNames: ['Conductivity', 'Flexibility', 'Insulation'] },
  { id: 8, key: 'shielding', displayName: 'Shielding', description: 'Defensive layer that protects the rocket from cosmic hazards.', attributeNames: ['Radiation Resistance', 'Impact Resistance', 'Weight'] },
];

const FALLBACK_BOX_TIERS: BoxTierConfig[] = [
  { id: 'common', name: 'Void Crate', rarity: 'Common', tagline: 'The starting point', price: 10, rewards: ['Common part (x1.0)', 'Uncommon part (x1.25)', 'Rare chance'], possible: [{ label: 'Best Drop', value: 'Rare' }, { label: 'Win Chance', value: '~18%' }] },
  { id: 'uncommon', name: 'Stellar Cache', rarity: 'Uncommon', tagline: 'Better odds, better loot', price: 25, rewards: ['Uncommon part (x1.25)', 'Rare chance', 'Epic chance'], possible: [{ label: 'Best Drop', value: 'Epic' }, { label: 'Win Chance', value: '~10%' }] },
  { id: 'rare', name: 'Star Vault Box', rarity: 'Rare', tagline: 'Rarity starts here', price: 50, rewards: ['Rare part (x1.6)', 'Epic chance', 'Legendary chance'], possible: [{ label: 'Best Drop', value: 'Legendary' }, { label: 'Win Chance', value: '~6%' }] },
  { id: 'epic', name: 'Astral Chest', rarity: 'Epic', tagline: 'Pulsing with energy', price: 100, rewards: ['Epic part (x2.0)', 'Legendary chance', 'Mythic chance'], possible: [{ label: 'Best Drop', value: 'Mythic' }, { label: 'Win Chance', value: '~3.5%' }] },
  { id: 'legendary', name: 'Solaris Vault', rarity: 'Legendary', tagline: 'Shimmer of gold', price: 200, rewards: ['Legendary part (x2.5)', 'Mythic chance', 'Celestial chance'], possible: [{ label: 'Best Drop', value: 'Celestial' }, { label: 'Win Chance', value: '~1.8%' }] },
  { id: 'mythic', name: 'Nova Reliquary', rarity: 'Mythic', tagline: 'Heat at the edge of chaos', price: 350, rewards: ['Mythic part (x3.2)', 'Celestial chance', 'Quantum chance'], possible: [{ label: 'Best Drop', value: 'Quantum' }, { label: 'Win Chance', value: '~0.7%' }] },
  { id: 'celestial', name: 'Aurora Ark', rarity: 'Celestial', tagline: 'Blue-fire premium crate', price: 500, rewards: ['Celestial part (x4.0)', 'High quantum chance'], possible: [{ label: 'Best Drop', value: 'Quantum' }, { label: 'Win Chance', value: '~12%' }] },
  { id: 'quantum', name: 'Prism Singularity', rarity: 'Quantum', tagline: 'Top-tier reality split', price: 750, rewards: ['Quantum part (x5.0)', 'Celestial fallback'], possible: [{ label: 'Best Drop', value: 'Quantum' }, { label: 'Win Chance', value: '~75%' }] },
];

function assertSupabaseConfigured(): void {
  if (!supabase) {
    throw new Error('Supabase is not configured in this environment.');
  }
}

function toNumber(value: number | string | undefined | null): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

function toFriendlyStarVaultError(message: string | undefined, fallback: string): string {
  if (!message) {
    return fallback;
  }

  if (message.includes('authenticated session required')) {
    return 'Reconnect your wallet to refresh the authenticated session.';
  }

  if (message.includes('wallet does not belong to authenticated user')) {
    return 'The connected wallet does not match the authenticated session.';
  }

  if (message.includes('insufficient flux balance')) {
    return 'Insufficient FLUX balance.';
  }

  return message;
}

function isRarityTier(value: string): value is RarityTier {
  return ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Celestial', 'Quantum'].includes(value);
}

function normalizeRarityTierRow(payload: RarityTierRow): RarityTierConfig {
  const name = isRarityTier(payload.name) ? payload.name : 'Common';

  return {
    id: toNumber(payload.id),
    name,
    multiplier: toNumber(payload.multiplier),
    baseBoxPriceFlux: toNumber(payload.base_box_price_flux),
    approximateDropRate: toNumber(payload.approximate_drop_rate),
    color: payload.color,
    bg: payload.bg,
    border: payload.border,
    glow: payload.glow,
    intensity: toNumber(payload.intensity),
  };
}

function normalizeRocketSectionRow(payload: RocketSectionRow): RocketSectionConfig {
  return {
    id: toNumber(payload.id),
    key: payload.key as RocketSection,
    displayName: payload.display_name,
    description: payload.description,
    attributeNames: [payload.attr1_name, payload.attr2_name, payload.attr3_name],
  };
}

function normalizePossibleStats(value: unknown): { label: string; value: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const candidate = entry as { label?: unknown; value?: unknown };
      if (typeof candidate.label !== 'string' || typeof candidate.value !== 'string') {
        return null;
      }

      return {
        label: candidate.label,
        value: candidate.value,
      };
    })
    .filter((entry): entry is { label: string; value: string } => entry !== null);
}

function normalizeBoxTierRow(payload: BoxTierRow, rarityLookup: Map<number, RarityTierConfig>): BoxTierConfig {
  const rarity = rarityLookup.get(toNumber(payload.rarity_tier_id))?.name ?? 'Common';

  return {
    id: payload.id,
    name: payload.name,
    rarity,
    tagline: payload.tagline,
    price: rarityLookup.get(toNumber(payload.rarity_tier_id))?.baseBoxPriceFlux ?? 0,
    rewards: Array.isArray(payload.rewards_description) ? payload.rewards_description : [],
    possible: normalizePossibleStats(payload.possible_stats),
  };
}

function normalizeFluxBalance(payload: FluxBalancePayload): FluxBalance {
  if (typeof payload.wallet_address !== 'string' || typeof payload.auth_user_id !== 'string') {
    throw new Error('Flux balance response was incomplete.');
  }

  return {
    walletAddress: payload.wallet_address,
    authUserId: payload.auth_user_id,
    availableBalance: toNumber(payload.available_balance),
    lifetimeClaimed: toNumber(payload.lifetime_claimed),
    lifetimeSpent: toNumber(payload.lifetime_spent),
    lastFaucetClaimedAt: typeof payload.last_faucet_claimed_at === 'string' ? payload.last_faucet_claimed_at : null,
    whitelistBonusGrantedAt: typeof payload.whitelist_bonus_granted_at === 'string' ? payload.whitelist_bonus_granted_at : null,
    createdAt: typeof payload.created_at === 'string' ? payload.created_at : new Date(0).toISOString(),
    updatedAt: typeof payload.updated_at === 'string' ? payload.updated_at : new Date(0).toISOString(),
  };
}

function normalizeInventoryPart(payload: InventoryPartPayload): InventoryPart {
  if (
    typeof payload.id !== 'string' ||
    typeof payload.name !== 'string' ||
    typeof payload.section_key !== 'string' ||
    typeof payload.section_name !== 'string' ||
    typeof payload.rarity !== 'string' ||
    !isRarityTier(payload.rarity)
  ) {
    throw new Error('Inventory part response was malformed.');
  }

  const attr1 = toNumber(payload.attr1);
  const attr2 = toNumber(payload.attr2);
  const attr3 = toNumber(payload.attr3);
  const partValue = toNumber(payload.part_value);

  return {
    id: payload.id,
    name: payload.name,
    slot: payload.section_key as RocketSection,
    rarity: payload.rarity,
    power: Math.round((attr1 + attr2 + attr3) / 3),
    attributes: [attr1, attr2, attr3],
    attributeNames: [
      payload.attr1_name ?? 'Attribute 1',
      payload.attr2_name ?? 'Attribute 2',
      payload.attr3_name ?? 'Attribute 3',
    ],
    partValue,
    sectionName: payload.section_name,
    rarityTierId: toNumber(payload.rarity_tier_id),
    isLocked: Boolean(payload.is_locked),
    isEquipped: Boolean(payload.is_equipped),
    source: payload.source,
    createdAt: payload.created_at,
  };
}

function getFallbackCatalog() {
  return {
    rarityTiers: FALLBACK_RARITY_TIERS,
    rocketSections: FALLBACK_SECTIONS,
    boxTiers: FALLBACK_BOX_TIERS,
  };
}

export async function fetchCatalog(): Promise<{
  rarityTiers: RarityTierConfig[];
  rocketSections: RocketSectionConfig[];
  boxTiers: BoxTierConfig[];
}> {
  if (!supabase) {
    return getFallbackCatalog();
  }

  const [rarityResult, sectionResult, boxResult] = await Promise.all([
    supabase.from('rarity_tiers').select('*').order('id', { ascending: true }),
    supabase.from('rocket_sections').select('*').order('id', { ascending: true }),
    supabase.from('box_tiers').select('*').order('sort_order', { ascending: true }),
  ]);

  if (rarityResult.error) {
    throw new Error(toFriendlyStarVaultError(rarityResult.error.message, 'Failed to load rarity tiers.'));
  }

  if (sectionResult.error) {
    throw new Error(toFriendlyStarVaultError(sectionResult.error.message, 'Failed to load rocket sections.'));
  }

  if (boxResult.error) {
    throw new Error(toFriendlyStarVaultError(boxResult.error.message, 'Failed to load box tiers.'));
  }

  const rarityTiers = (rarityResult.data ?? []).map((row) => normalizeRarityTierRow(row as unknown as RarityTierRow));
  const rocketSections = (sectionResult.data ?? []).map((row) => normalizeRocketSectionRow(row as unknown as RocketSectionRow));
  const rarityLookup = new Map(rarityTiers.map((tier) => [tier.id, tier]));
  const boxTiers = (boxResult.data ?? []).map((row) => normalizeBoxTierRow(row as unknown as BoxTierRow, rarityLookup));

  return {
    rarityTiers,
    rocketSections,
    boxTiers,
  };
}

export async function openMysteryBox(
  walletAddress: string,
  boxTierId: string,
): Promise<{ part: InventoryPart; balance: FluxBalance; ledgerEntryId: number }> {
  assertSupabaseConfigured();

  const { data, error } = await supabase!.rpc('open_mystery_box', {
    p_wallet_address: walletAddress,
    p_box_tier_id: boxTierId,
    p_whitelist_bonus_amount: WHITELIST_BONUS_FLUX,
    p_client_timestamp: new Date().toISOString(),
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

  if (error) {
    throw new Error(toFriendlyStarVaultError(error.message, 'Failed to open mystery box.'));
  }

  const payload = (data ?? {}) as OpenMysteryBoxResponse;
  if (!payload.part || !payload.balance) {
    throw new Error('Mystery box response was incomplete.');
  }

  return {
    part: normalizeInventoryPart(payload.part),
    balance: normalizeFluxBalance(payload.balance),
    ledgerEntryId: toNumber(payload.ledger_entry_id),
  };
}

export async function getUserInventory(
  walletAddress: string,
): Promise<InventoryPart[]> {
  assertSupabaseConfigured();

  const { data, error } = await supabase!.rpc('get_user_inventory', {
    p_wallet_address: walletAddress,
  });

  if (error) {
    throw new Error(toFriendlyStarVaultError(error.message, 'Failed to load inventory.'));
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry) => normalizeInventoryPart(entry as InventoryPartPayload));
}

export function formatStarVaultError(error: unknown, fallback: string): string {
  return toFriendlyStarVaultError(
    error instanceof Error ? error.message : toErrorMessage(error, fallback),
    fallback,
  );
}

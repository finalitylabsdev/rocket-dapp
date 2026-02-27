import { WHITELIST_BONUS_FLUX } from '../config/spec';
import type {
  AssetReference,
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
  illustration_key?: string | null;
  illustration_url?: string | null;
  illustration_alt?: string | null;
}

interface RocketSectionRow {
  id: number | string;
  key: string;
  display_name: string;
  description: string | null;
  attr1_name: string;
  attr2_name: string;
  attr3_name: string;
  illustration_key?: string | null;
  illustration_url?: string | null;
  illustration_alt?: string | null;
}

interface BoxTierRow {
  id: string;
  rarity_tier_id: number | string;
  name: string;
  tagline: string;
  rewards_description: string[];
  possible_stats: unknown;
  sort_order: number | string;
  illustration_key?: string | null;
  illustration_url?: string | null;
  illustration_alt?: string | null;
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
  illustration_key?: string | null;
  illustration_url?: string | null;
  illustration_alt?: string | null;
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

function assertSupabaseConfigured(): void {
  if (!supabase) {
    throw new Error('Supabase is not configured in this environment.');
  }
}

function toNumber(value: number | string | undefined | null): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

function normalizeIllustration(
  payload: {
    illustration_key?: string | null;
    illustration_url?: string | null;
    illustration_alt?: string | null;
  },
  fallbackKey: string,
  fallbackAlt?: string,
): AssetReference {
  return {
    key: toOptionalText(payload.illustration_key) ?? fallbackKey,
    url: toOptionalText(payload.illustration_url),
    alt: toOptionalText(payload.illustration_alt) ?? fallbackAlt ?? null,
  };
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
    illustration: normalizeIllustration(payload, name.toLowerCase(), name),
  };
}

function normalizeRocketSectionRow(payload: RocketSectionRow): RocketSectionConfig {
  return {
    id: toNumber(payload.id),
    key: payload.key as RocketSection,
    displayName: payload.display_name,
    description: payload.description,
    attributeNames: [payload.attr1_name, payload.attr2_name, payload.attr3_name],
    illustration: normalizeIllustration(payload, payload.key, payload.display_name),
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
    illustration: normalizeIllustration(payload, payload.id, payload.name),
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
    illustration: normalizeIllustration(payload, payload.section_key, payload.name),
  };
}

export async function fetchCatalog(): Promise<{
  rarityTiers: RarityTierConfig[];
  rocketSections: RocketSectionConfig[];
  boxTiers: BoxTierConfig[];
}> {
  assertSupabaseConfigured();

  const [rarityResult, sectionResult, boxResult] = await Promise.all([
    supabase!.from('rarity_tiers').select('*').order('id', { ascending: true }),
    supabase!.from('rocket_sections').select('*').order('id', { ascending: true }),
    supabase!.from('box_tiers').select('*').order('sort_order', { ascending: true }),
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

function createIdempotencyKey(): string {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi || typeof cryptoApi.randomUUID !== 'function') {
    throw new Error('Secure randomness is unavailable in this environment.');
  }

  return cryptoApi.randomUUID();
}

export async function openMysteryBox(
  walletAddress: string,
  boxTierId: string,
): Promise<{ part: InventoryPart; balance: FluxBalance; ledgerEntryId: number }> {
  assertSupabaseConfigured();

  const idempotencyKey = `box_open:${walletAddress.toLowerCase()}:${createIdempotencyKey()}`;

  const { data, error } = await supabase!.rpc('open_mystery_box', {
    p_wallet_address: walletAddress,
    p_box_tier_id: boxTierId,
    p_whitelist_bonus_amount: WHITELIST_BONUS_FLUX,
    p_client_timestamp: new Date().toISOString(),
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    p_idempotency_key: idempotencyKey,
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

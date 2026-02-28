import { WHITELIST_BONUS_FLUX } from '../config/spec';
import type {
  AssetReference,
  BoxTierConfig,
  InventoryPart,
  RocketSectionConfig,
  RarityTierConfig,
  RocketSection,
} from '../types/domain';
import type { FluxBalance } from './flux';
import type { FluxBalancePayload } from './fluxBalance';
import { normalizeFluxBalance } from './fluxBalance';
import { assertSupabaseConfigured, isRarityTier, toErrorMessage, toNumber } from './shared';
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

export interface InventoryPartPayload {
  id?: string;
  variant_id?: number | string;
  variant_index?: number | string;
  name?: string;
  section_key?: string;
  section_name?: string;
  equipped_section_key?: string;
  rarity?: string;
  rarity_tier_id?: number | string;
  attr1?: number | string;
  attr2?: number | string;
  attr3?: number | string;
  attr1_name?: string;
  attr2_name?: string;
  attr3_name?: string;
  part_value?: number | string;
  condition_pct?: number | string;
  serial_number?: string;
  serial_trait?: string;
  is_shiny?: boolean;
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

export interface StarVaultCatalog {
  rarityTiers: RarityTierConfig[];
  rocketSections: RocketSectionConfig[];
  boxTiers: BoxTierConfig[];
}

interface FetchCatalogOptions {
  forceRefresh?: boolean;
}

const CATALOG_CACHE_TTL_MS = 5 * 60_000;
let catalogCache: { value: StarVaultCatalog; expiresAt: number } | null = null;
let catalogRequestInFlight: Promise<StarVaultCatalog> | null = null;

function toOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
  const rarityTier = rarityLookup.get(toNumber(payload.rarity_tier_id));

  return {
    id: payload.id,
    name: payload.name,
    rarity: rarityTier?.name ?? 'Common',
    tagline: payload.tagline,
    price: rarityTier?.baseBoxPriceFlux ?? 0,
    rewards: Array.isArray(payload.rewards_description) ? payload.rewards_description : [],
    possible: normalizePossibleStats(payload.possible_stats),
    illustration: normalizeIllustration(payload, payload.id, payload.name),
  };
}

export function normalizeInventoryPart(payload: InventoryPartPayload): InventoryPart {
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
    equippedSectionKey: typeof payload.equipped_section_key === 'string'
      ? payload.equipped_section_key as RocketSection
      : undefined,
    rarity: payload.rarity,
    power: Math.round((attr1 + attr2 + attr3) / 3),
    attributes: [attr1, attr2, attr3],
    attributeNames: [
      payload.attr1_name ?? 'Attribute 1',
      payload.attr2_name ?? 'Attribute 2',
      payload.attr3_name ?? 'Attribute 3',
    ],
    partValue,
    conditionPct: payload.condition_pct === undefined ? undefined : toNumber(payload.condition_pct),
    serialNumber: toOptionalText(payload.serial_number) ?? undefined,
    serialTrait: toOptionalText(payload.serial_trait) ?? undefined,
    isShiny: payload.is_shiny === undefined ? undefined : Boolean(payload.is_shiny),
    variantId: payload.variant_id === undefined ? undefined : toNumber(payload.variant_id),
    variantIndex: payload.variant_index === undefined ? undefined : toNumber(payload.variant_index),
    sectionName: payload.section_name,
    rarityTierId: toNumber(payload.rarity_tier_id),
    isLocked: Boolean(payload.is_locked),
    isEquipped: Boolean(payload.is_equipped),
    source: payload.source,
    createdAt: payload.created_at,
    illustration: normalizeIllustration(payload, payload.section_key, payload.name),
  };
}

async function fetchCatalogFromSource(): Promise<StarVaultCatalog> {
  assertSupabaseConfigured(supabase);

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

export async function fetchCatalog(options: FetchCatalogOptions = {}): Promise<StarVaultCatalog> {
  const { forceRefresh = false } = options;
  const now = Date.now();

  if (!forceRefresh && catalogCache && catalogCache.expiresAt > now) {
    return catalogCache.value;
  }

  if (catalogRequestInFlight) {
    return catalogRequestInFlight;
  }

  const request = fetchCatalogFromSource()
    .then((catalog) => {
      catalogCache = {
        value: catalog,
        expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
      };
      return catalog;
    })
    .finally(() => {
      if (catalogRequestInFlight === request) {
        catalogRequestInFlight = null;
      }
    });

  catalogRequestInFlight = request;
  return request;
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
  assertSupabaseConfigured(supabase);

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
  assertSupabaseConfigured(supabase);

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

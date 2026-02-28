import { LAUNCH_FEE_RATE, REPAIR_COST_RATE } from '../config/spec';
import type { InventoryPart } from '../types/domain';
import { normalizeFluxBalance } from './fluxBalance';
import type { FluxBalancePayload } from './fluxBalance';
import { assertSupabaseConfigured, toErrorMessage, toNumber } from './shared';
import { normalizeInventoryPart, type InventoryPartPayload } from './starVault';
import { supabase } from './supabase';

export interface RocketLabMutationResult {
  inventory: InventoryPart[];
}

export interface RocketLaunchScoreBreakdown {
  base: number;
  luck: number;
  randomness: number;
  total: number;
}

export interface RocketLaunchDamageEntry {
  partId: string;
  sectionKey: string;
  damagePct: number;
  conditionPct: number;
}

export interface RocketLaunchResult {
  launchId: number;
  totalPower: number;
  fuelCostFlux: number;
  scoreBreakdown: RocketLaunchScoreBreakdown;
  meteoriteDamagePct: number;
  damageReport: RocketLaunchDamageEntry[];
  createdAt: string;
  inventory: InventoryPart[];
  balance: ReturnType<typeof normalizeFluxBalance>;
}

export interface RocketLaunchHistoryEntry {
  launchId: number;
  totalPower: number;
  fuelCostFlux: number;
  meteoriteDamagePct: number;
  scoreBreakdown: RocketLaunchScoreBreakdown;
  damageReport: RocketLaunchDamageEntry[];
  createdAt: string;
}

export interface RocketRepairResult {
  repairCostFlux: number;
  inventory: InventoryPart[];
  balance: ReturnType<typeof normalizeFluxBalance>;
}

interface InventoryMutationPayload {
  inventory?: InventoryPartPayload[];
}

interface LaunchScorePayload {
  base?: number | string;
  luck?: number | string;
  randomness?: number | string;
  total?: number | string;
}

interface LaunchDamagePayload {
  part_id?: string;
  section_key?: string;
  damage_pct?: number | string;
  condition_pct?: number | string;
}

interface LaunchPayload extends InventoryMutationPayload {
  launch_id?: number | string;
  total_power?: number | string;
  fuel_cost_flux?: number | string;
  score_breakdown?: LaunchScorePayload;
  meteorite_damage_pct?: number | string;
  damage_report?: LaunchDamagePayload[];
  created_at?: string;
  balance?: FluxBalancePayload;
}

interface LaunchHistoryPayload {
  launch_id?: number | string;
  total_power?: number | string;
  base_score?: number | string;
  luck_score?: number | string;
  randomness_score?: number | string;
  total_score?: number | string;
  fuel_cost_flux?: number | string;
  meteorite_damage_pct?: number | string;
  damage_report?: LaunchDamagePayload[];
  created_at?: string;
}

interface RepairPayload extends InventoryMutationPayload {
  repair_cost_flux?: number | string;
  balance?: FluxBalancePayload;
}

function normalizeInventory(value: unknown): InventoryPart[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => normalizeInventoryPart(entry as InventoryPartPayload));
}

function normalizeScoreBreakdown(payload: LaunchScorePayload | undefined): RocketLaunchScoreBreakdown {
  return {
    base: toNumber(payload?.base ?? 0),
    luck: toNumber(payload?.luck ?? 0),
    randomness: toNumber(payload?.randomness ?? 0),
    total: toNumber(payload?.total ?? 0),
  };
}

function normalizeDamageReport(value: unknown): RocketLaunchDamageEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const payload = entry as LaunchDamagePayload;
      if (typeof payload.part_id !== 'string' || typeof payload.section_key !== 'string') {
        return null;
      }

      return {
        partId: payload.part_id,
        sectionKey: payload.section_key,
        damagePct: toNumber(payload.damage_pct ?? 0),
        conditionPct: toNumber(payload.condition_pct ?? 0),
      };
    })
    .filter((entry): entry is RocketLaunchDamageEntry => entry !== null);
}

function normalizeLaunch(payload: LaunchPayload): RocketLaunchResult {
  if (!payload.balance) {
    throw new Error('Launch response was incomplete.');
  }

  return {
    launchId: toNumber(payload.launch_id),
    totalPower: toNumber(payload.total_power ?? 0),
    fuelCostFlux: toNumber(payload.fuel_cost_flux ?? 0),
    scoreBreakdown: normalizeScoreBreakdown(payload.score_breakdown),
    meteoriteDamagePct: toNumber(payload.meteorite_damage_pct ?? 0),
    damageReport: normalizeDamageReport(payload.damage_report),
    createdAt: typeof payload.created_at === 'string' ? payload.created_at : new Date().toISOString(),
    inventory: normalizeInventory(payload.inventory),
    balance: normalizeFluxBalance(payload.balance),
  };
}

function normalizeLaunchHistoryEntry(payload: LaunchHistoryPayload): RocketLaunchHistoryEntry {
  return {
    launchId: toNumber(payload.launch_id),
    totalPower: toNumber(payload.total_power ?? 0),
    fuelCostFlux: toNumber(payload.fuel_cost_flux ?? 0),
    meteoriteDamagePct: toNumber(payload.meteorite_damage_pct ?? 0),
    scoreBreakdown: {
      base: toNumber(payload.base_score ?? 0),
      luck: toNumber(payload.luck_score ?? 0),
      randomness: toNumber(payload.randomness_score ?? 0),
      total: toNumber(payload.total_score ?? 0),
    },
    damageReport: normalizeDamageReport(payload.damage_report),
    createdAt: typeof payload.created_at === 'string' ? payload.created_at : new Date(0).toISOString(),
  };
}

function normalizeRepair(payload: RepairPayload): RocketRepairResult {
  if (!payload.balance) {
    throw new Error('Repair response was incomplete.');
  }

  return {
    repairCostFlux: toNumber(payload.repair_cost_flux ?? 0),
    inventory: normalizeInventory(payload.inventory),
    balance: normalizeFluxBalance(payload.balance),
  };
}

function createIdempotencyKey(prefix: string, walletAddress: string): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.randomUUID !== 'function') {
    throw new Error('Secure randomness is unavailable in this environment.');
  }

  return `${prefix}:${walletAddress.toLowerCase()}:${cryptoApi.randomUUID()}`;
}

function toFriendlyRocketLabError(message: string | undefined, fallback: string): string {
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
    return 'Not enough Φ.';
  }

  if (message.includes('launch requires exactly 8 equipped parts') || message.includes('missing equipped part for slot')) {
    return 'Equip all 8 rocket sections before launching.';
  }

  if (message.includes('part cannot be equipped to section')) {
    return 'That part does not fit the selected rocket section.';
  }

  if (message.includes('auction-locked parts cannot be equipped') || message.includes('auction-locked parts cannot be repaired')) {
    return 'Auction-locked parts cannot be modified here.';
  }

  if (message.includes('repair the part before equipping it') || message.includes('repair all broken equipped parts before launching')) {
    return 'Repair broken parts before using them in the Rocket Lab.';
  }

  return message;
}

export function getPartConditionPct(part: InventoryPart): number {
  return Math.max(0, Math.min(100, part.conditionPct ?? 100));
}

export function getEffectivePartPower(part: InventoryPart): number {
  return Math.round(part.power * (getPartConditionPct(part) / 100));
}

export function estimateRepairCost(part: InventoryPart): number {
  const missingPct = Math.max(0, 100 - getPartConditionPct(part));
  return Math.round(part.partValue * (missingPct / 100) * REPAIR_COST_RATE * 100) / 100;
}

export function estimateFuelCost(parts: InventoryPart[]): number {
  const totalValue = parts.reduce((sum, part) => sum + part.partValue, 0);
  return Math.round(totalValue * LAUNCH_FEE_RATE * 100) / 100;
}

export async function equipInventoryPart(
  walletAddress: string,
  partId: string,
  sectionKey: string,
): Promise<RocketLabMutationResult> {
  assertSupabaseConfigured(supabase);

  const { data, error } = await supabase!.rpc('equip_inventory_part', {
    p_wallet_address: walletAddress,
    p_part_id: partId,
    p_section_key: sectionKey,
  });

  if (error) {
    throw new Error(toFriendlyRocketLabError(error.message, 'Failed to equip part.'));
  }

  return {
    inventory: normalizeInventory((data as InventoryMutationPayload | null)?.inventory),
  };
}

export async function unequipInventoryPart(
  walletAddress: string,
  sectionKey: string,
): Promise<RocketLabMutationResult> {
  assertSupabaseConfigured(supabase);

  const { data, error } = await supabase!.rpc('unequip_inventory_part', {
    p_wallet_address: walletAddress,
    p_section_key: sectionKey,
  });

  if (error) {
    throw new Error(toFriendlyRocketLabError(error.message, 'Failed to unequip part.'));
  }

  return {
    inventory: normalizeInventory((data as InventoryMutationPayload | null)?.inventory),
  };
}

export async function repairInventoryPart(
  walletAddress: string,
  partId: string,
): Promise<RocketRepairResult> {
  assertSupabaseConfigured(supabase);

  const { data, error } = await supabase!.rpc('repair_inventory_part', {
    p_wallet_address: walletAddress,
    p_part_id: partId,
    p_idempotency_key: createIdempotencyKey('repair', walletAddress),
  });

  if (error) {
    throw new Error(toFriendlyRocketLabError(error.message, 'Failed to repair part.'));
  }

  return normalizeRepair((data ?? {}) as RepairPayload);
}

export async function launchRocket(walletAddress: string): Promise<RocketLaunchResult> {
  assertSupabaseConfigured(supabase);

  const { data, error } = await supabase!.rpc('launch_rocket', {
    p_wallet_address: walletAddress,
    p_idempotency_key: createIdempotencyKey('launch', walletAddress),
  });

  if (error) {
    throw new Error(toFriendlyRocketLabError(error.message, 'Failed to launch rocket.'));
  }

  return normalizeLaunch((data ?? {}) as LaunchPayload);
}

export async function getLaunchHistory(
  walletAddress: string,
  limit = 20,
): Promise<RocketLaunchHistoryEntry[]> {
  assertSupabaseConfigured(supabase);

  const { data, error } = await supabase!.rpc('get_launch_history', {
    p_wallet_address: walletAddress,
    p_limit: limit,
  });

  if (error) {
    throw new Error(toFriendlyRocketLabError(error.message, 'Failed to load launch history.'));
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry) => normalizeLaunchHistoryEntry(entry as LaunchHistoryPayload));
}

export function formatRocketLabError(error: unknown, fallback: string): string {
  return toFriendlyRocketLabError(
    error instanceof Error ? error.message : toErrorMessage(error, fallback),
    fallback,
  );
}

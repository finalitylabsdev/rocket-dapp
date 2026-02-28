import type { FluxBalance } from './flux';
import type { FluxBalancePayload } from './fluxBalance';
import { normalizeFluxBalance } from './fluxBalance';
import { assertSupabaseConfigured, toNumber, toErrorMessage } from './shared';
import { supabase } from './supabase';

export interface LaunchResult {
  launchId: number;
  gravScore: number;
  eventBonus: string;
  finalMultiplier: number;
  power: number;
  launchFeeFlux: number;
  balance: FluxBalance;
}

export interface LaunchHistoryEntry {
  launchId: number;
  gravScore: number;
  eventBonus: string;
  finalMultiplier: number;
  power: number;
  launchFeeFlux: number;
  createdAt: string;
}

interface LaunchRocketPayload {
  launch_id?: number | string;
  grav_score?: number | string;
  event_bonus?: string;
  final_multiplier?: number | string;
  power?: number | string;
  launch_fee_flux?: number | string;
  balance?: FluxBalancePayload;
}

interface LaunchHistoryEntryPayload {
  launch_id?: number | string;
  grav_score?: number | string;
  event_bonus?: string;
  final_multiplier?: number | string;
  power?: number | string;
  launch_fee_flux?: number | string;
  created_at?: string;
}

function toFriendlyLaunchError(message: string | undefined, fallback: string): string {
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

  if (message.includes('missing part for slot')) {
    return 'All 8 slots must be filled with unlocked parts to launch.';
  }

  return message;
}

function createIdempotencyKey(): string {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi || typeof cryptoApi.randomUUID !== 'function') {
    throw new Error('Secure randomness is unavailable in this environment.');
  }

  return cryptoApi.randomUUID();
}

function normalizeLaunchResult(payload: LaunchRocketPayload): LaunchResult {
  if (!payload.balance) {
    throw new Error('Launch response was incomplete.');
  }

  return {
    launchId: toNumber(payload.launch_id),
    gravScore: toNumber(payload.grav_score),
    eventBonus: typeof payload.event_bonus === 'string' ? payload.event_bonus : '',
    finalMultiplier: toNumber(payload.final_multiplier),
    power: toNumber(payload.power),
    launchFeeFlux: toNumber(payload.launch_fee_flux),
    balance: normalizeFluxBalance(payload.balance),
  };
}

function normalizeLaunchHistoryEntry(payload: LaunchHistoryEntryPayload): LaunchHistoryEntry {
  return {
    launchId: toNumber(payload.launch_id),
    gravScore: toNumber(payload.grav_score),
    eventBonus: typeof payload.event_bonus === 'string' ? payload.event_bonus : '',
    finalMultiplier: toNumber(payload.final_multiplier),
    power: toNumber(payload.power),
    launchFeeFlux: toNumber(payload.launch_fee_flux),
    createdAt: typeof payload.created_at === 'string' ? payload.created_at : new Date(0).toISOString(),
  };
}

export async function launchRocket(walletAddress: string): Promise<LaunchResult> {
  assertSupabaseConfigured(supabase);

  const idempotencyKey = `launch:${walletAddress.toLowerCase()}:${createIdempotencyKey()}`;

  const { data, error } = await supabase!.rpc('launch_rocket', {
    p_wallet_address: walletAddress,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    throw new Error(toFriendlyLaunchError(error.message, 'Failed to launch rocket.'));
  }

  const payload = (data ?? {}) as LaunchRocketPayload;
  return normalizeLaunchResult(payload);
}

export async function getLaunchHistory(walletAddress: string): Promise<LaunchHistoryEntry[]> {
  assertSupabaseConfigured(supabase);

  const { data, error } = await supabase!.rpc('get_launch_history', {
    p_wallet_address: walletAddress,
  });

  if (error) {
    throw new Error(toFriendlyLaunchError(error.message, 'Failed to load launch history.'));
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry) => normalizeLaunchHistoryEntry(entry as LaunchHistoryEntryPayload));
}

export function formatLaunchError(error: unknown, fallback: string): string {
  return toFriendlyLaunchError(
    error instanceof Error ? error.message : toErrorMessage(error, fallback),
    fallback,
  );
}

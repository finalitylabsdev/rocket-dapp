import {
  EFFECTIVE_DAILY_CLAIM_FLUX,
  FAUCET_INTERVAL_SECONDS,
  WHITELIST_BONUS_FLUX,
} from '../config/spec';
import { supabase } from './supabase';
import { signConnectedEthereumMessage } from './web3Auth';

interface FluxBalanceRow {
  wallet_address: string;
  auth_user_id: string;
  available_balance: number | string;
  lifetime_claimed: number | string;
  lifetime_spent: number | string;
  last_faucet_claimed_at: string | null;
  whitelist_bonus_granted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FluxBalance {
  walletAddress: string;
  authUserId: string;
  availableBalance: number;
  lifetimeClaimed: number;
  lifetimeSpent: number;
  lastFaucetClaimedAt: string | null;
  whitelistBonusGrantedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FluxFaucetSettlement =
  | {
    kind: 'offchain_message';
    status: 'confirmed';
    signedMessage: string;
    signature: string;
    messageNonce: string;
    chainId: number | null;
  }
  | {
    kind: 'onchain_transaction';
    status: 'pending' | 'confirmed' | 'failed';
    txHash: string;
    chainId: number | null;
  };

function assertSupabaseConfigured(): void {
  if (!supabase) {
    throw new Error('Supabase is not configured in this environment.');
  }
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

function toFriendlyFluxError(message: string | undefined, fallback: string): string {
  if (!message) {
    return fallback;
  }

  if (message.includes('authenticated session required')) {
    return 'Reconnect your wallet to refresh the authenticated session.';
  }

  if (message.includes('wallet does not belong to authenticated user')) {
    return 'The connected wallet does not match the authenticated session.';
  }

  if (message.includes('flux faucet claim is still on cooldown')) {
    return 'Flux faucet claim is still on cooldown.';
  }

  if (message.includes('insufficient flux balance')) {
    return 'Insufficient Flux balance.';
  }

  return message;
}

function toNumber(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBalanceRow(payload: unknown): FluxBalance {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Flux balance response was malformed.');
  }

  const row = payload as Partial<FluxBalanceRow>;
  if (typeof row.wallet_address !== 'string' || typeof row.auth_user_id !== 'string') {
    throw new Error('Flux balance response was incomplete.');
  }

  return {
    walletAddress: row.wallet_address,
    authUserId: row.auth_user_id,
    availableBalance: toNumber(row.available_balance ?? 0),
    lifetimeClaimed: toNumber(row.lifetime_claimed ?? 0),
    lifetimeSpent: toNumber(row.lifetime_spent ?? 0),
    lastFaucetClaimedAt: typeof row.last_faucet_claimed_at === 'string' ? row.last_faucet_claimed_at : null,
    whitelistBonusGrantedAt: typeof row.whitelist_bonus_granted_at === 'string' ? row.whitelist_bonus_granted_at : null,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date(0).toISOString(),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date(0).toISOString(),
  };
}

function createClaimNonce(): string {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi || typeof cryptoApi.randomUUID !== 'function') {
    throw new Error('Secure randomness is unavailable in this environment.');
  }

  return cryptoApi.randomUUID();
}

function buildFluxClaimMessage(
  walletAddress: string,
  claimAmount: number,
  cooldownSeconds: number,
  chainId: number | null,
  nonce: string,
  issuedAt: string,
): string {
  return [
    'Entropy Network Flux Faucet',
    `Wallet: ${walletAddress}`,
    'Action: claim_flux',
    `Amount: ${claimAmount}`,
    `Cooldown Seconds: ${cooldownSeconds}`,
    `Chain ID: ${chainId ?? 'unknown'}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    'Settlement: offchain_message',
  ].join('\n');
}

export async function syncFluxBalance(
  walletAddress: string,
  whitelistBonusAmount = WHITELIST_BONUS_FLUX,
): Promise<FluxBalance> {
  assertSupabaseConfigured();

  const { data, error } = await supabase!.rpc('sync_wallet_flux_balance', {
    p_wallet_address: walletAddress,
    p_whitelist_bonus_amount: whitelistBonusAmount,
    p_client_timestamp: new Date().toISOString(),
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

  if (error) {
    throw new Error(toFriendlyFluxError(error.message, 'Failed to sync Flux balance.'));
  }

  return normalizeBalanceRow(data);
}

export async function claimFluxFromFaucet(
  walletAddress: string,
  claimAmount = EFFECTIVE_DAILY_CLAIM_FLUX,
  cooldownSeconds = FAUCET_INTERVAL_SECONDS,
  whitelistBonusAmount = WHITELIST_BONUS_FLUX,
): Promise<FluxBalance> {
  const settlement = await createSignedFluxClaimSettlement(
    walletAddress,
    claimAmount,
    cooldownSeconds,
  );

  return submitFluxFaucetClaim(
    walletAddress,
    claimAmount,
    cooldownSeconds,
    settlement,
    whitelistBonusAmount,
  );
}

export async function createSignedFluxClaimSettlement(
  walletAddress: string,
  claimAmount = EFFECTIVE_DAILY_CLAIM_FLUX,
  cooldownSeconds = FAUCET_INTERVAL_SECONDS,
): Promise<Extract<FluxFaucetSettlement, { kind: 'offchain_message' }>> {
  const nonce = createClaimNonce();
  const issuedAt = new Date().toISOString();
  const signedMessage = buildFluxClaimMessage(
    walletAddress,
    claimAmount,
    cooldownSeconds,
    null,
    nonce,
    issuedAt,
  );
  const { chainId, signature } = await signConnectedEthereumMessage(walletAddress, signedMessage);

  return {
    kind: 'offchain_message',
    status: 'confirmed',
    signedMessage,
    signature,
    messageNonce: nonce,
    chainId,
  };
}

function buildFaucetIdempotencyKey(walletAddress: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `faucet:${walletAddress.toLowerCase()}:${today}`;
}

export async function submitFluxFaucetClaim(
  walletAddress: string,
  claimAmount: number,
  cooldownSeconds: number,
  settlement: FluxFaucetSettlement,
  whitelistBonusAmount = WHITELIST_BONUS_FLUX,
): Promise<FluxBalance> {
  assertSupabaseConfigured();

  const issuedAt = new Date().toISOString();

  const { data, error } = await supabase!.rpc('record_flux_faucet_claim', {
    p_wallet_address: walletAddress,
    p_claim_amount: claimAmount,
    p_claim_window_seconds: cooldownSeconds,
    p_settlement_kind: settlement.kind,
    p_settlement_status: settlement.status,
    p_signed_message: settlement.kind === 'offchain_message' ? settlement.signedMessage : null,
    p_signature: settlement.kind === 'offchain_message' ? settlement.signature : null,
    p_message_nonce: settlement.kind === 'offchain_message' ? settlement.messageNonce : null,
    p_tx_hash: settlement.kind === 'onchain_transaction' ? settlement.txHash : null,
    p_chain_id: settlement.chainId,
    p_whitelist_bonus_amount: whitelistBonusAmount,
    p_client_timestamp: issuedAt,
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    p_idempotency_key: buildFaucetIdempotencyKey(walletAddress),
  });

  if (error) {
    throw new Error(toFriendlyFluxError(error.message, 'Failed to claim Flux.'));
  }

  return normalizeBalanceRow(data);
}

export async function adjustFluxBalance(
  walletAddress: string,
  deltaFlux: number,
  reason: string,
  payload: Record<string, unknown> = {},
  whitelistBonusAmount = WHITELIST_BONUS_FLUX,
  idempotencyKey: string | null = null,
): Promise<FluxBalance> {
  assertSupabaseConfigured();

  const { data, error } = await supabase!.rpc('adjust_wallet_flux_balance', {
    p_wallet_address: walletAddress,
    p_delta_flux: deltaFlux,
    p_reason: reason,
    p_payload: payload,
    p_whitelist_bonus_amount: whitelistBonusAmount,
    p_client_timestamp: new Date().toISOString(),
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    throw new Error(toFriendlyFluxError(error.message, 'Failed to update Flux balance.'));
  }

  return normalizeBalanceRow(data);
}

export function formatFluxError(error: unknown, fallback: string): string {
  return toFriendlyFluxError(
    error instanceof Error ? error.message : toErrorMessage(error, fallback),
    fallback,
  );
}

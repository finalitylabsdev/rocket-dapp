import { AUCTION_MIN_INCREMENT_BPS, WHITELIST_BONUS_FLUX } from '../config/spec';
import type {
  AuctionBid,
  AuctionHistoryEntry,
  AuctionPartInfo,
  AuctionRound,
  RarityTier,
} from '../types/domain';
import type { FluxBalance } from './flux';
import { supabase } from './supabase';

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

interface BidResponsePayload {
  bid_id?: number | string;
  min_next_bid?: number | string;
  balance?: FluxBalancePayload;
}

interface AuctionBidPayload {
  id?: number | string;
  wallet?: string;
  amount?: number | string;
  created_at?: string;
}

interface AuctionPartPayload {
  id?: string;
  name?: string;
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
  submitted_by?: string;
}

interface ActiveAuctionPayload {
  status?: string;
  round_id?: number | string;
  starts_at?: string;
  submission_ends_at?: string;
  ends_at?: string;
  bidding_opens_at?: string | null;
  part?: AuctionPartPayload | null;
  bids?: AuctionBidPayload[];
  current_highest_bid?: number | string;
  bid_count?: number | string;
}

interface AuctionHistoryPayload {
  round_id?: number | string;
  status?: string;
  starts_at?: string;
  ends_at?: string;
  final_price?: number | string | null;
  winner_wallet?: string | null;
  part_name?: string | null;
  rarity?: string | null;
  part_value?: number | string | null;
  section_name?: string | null;
  seller_wallet?: string | null;
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

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return fallback;
}

function toFriendlyAuctionError(message: string | undefined, fallback: string): string {
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

function normalizeAuctionBid(payload: AuctionBidPayload): AuctionBid {
  return {
    id: toNumber(payload.id),
    wallet: typeof payload.wallet === 'string' ? payload.wallet : 'unknown',
    amount: toNumber(payload.amount),
    createdAt: typeof payload.created_at === 'string' ? payload.created_at : new Date(0).toISOString(),
  };
}

function normalizeAuctionPart(payload: AuctionPartPayload): AuctionPartInfo {
  if (
    typeof payload.id !== 'string' ||
    typeof payload.name !== 'string' ||
    typeof payload.section_name !== 'string' ||
    typeof payload.rarity !== 'string' ||
    !isRarityTier(payload.rarity)
  ) {
    throw new Error('Auction part response was malformed.');
  }

  return {
    id: payload.id,
    name: payload.name,
    sectionName: payload.section_name,
    rarity: payload.rarity,
    rarityTierId: toNumber(payload.rarity_tier_id),
    attributes: [
      toNumber(payload.attr1),
      toNumber(payload.attr2),
      toNumber(payload.attr3),
    ],
    attributeNames: [
      payload.attr1_name ?? 'Attribute 1',
      payload.attr2_name ?? 'Attribute 2',
      payload.attr3_name ?? 'Attribute 3',
    ],
    partValue: toNumber(payload.part_value),
    submittedBy: typeof payload.submitted_by === 'string' ? payload.submitted_by : 'unknown',
  };
}

function normalizeActiveAuction(payload: ActiveAuctionPayload): AuctionRound | null {
  if (payload.status === 'no_active_round') {
    return null;
  }

  if (
    typeof payload.status !== 'string' ||
    typeof payload.round_id !== 'number' && typeof payload.round_id !== 'string' ||
    typeof payload.starts_at !== 'string' ||
    typeof payload.submission_ends_at !== 'string' ||
    typeof payload.ends_at !== 'string'
  ) {
    throw new Error('Auction response was malformed.');
  }

  return {
    roundId: toNumber(payload.round_id),
    status: payload.status as AuctionRound['status'],
    startsAt: payload.starts_at,
    submissionEndsAt: payload.submission_ends_at,
    endsAt: payload.ends_at,
    biddingOpensAt: typeof payload.bidding_opens_at === 'string' ? payload.bidding_opens_at : null,
    part: payload.part ? normalizeAuctionPart(payload.part) : null,
    bids: Array.isArray(payload.bids) ? payload.bids.map((bid) => normalizeAuctionBid(bid)) : [],
    currentHighestBid: toNumber(payload.current_highest_bid),
    bidCount: toNumber(payload.bid_count),
  };
}

function normalizeAuctionHistory(payload: AuctionHistoryPayload): AuctionHistoryEntry {
  return {
    roundId: toNumber(payload.round_id),
    status: payload.status === 'no_submissions' ? 'no_submissions' : 'completed',
    startsAt: typeof payload.starts_at === 'string' ? payload.starts_at : new Date(0).toISOString(),
    endsAt: typeof payload.ends_at === 'string' ? payload.ends_at : new Date(0).toISOString(),
    finalPrice: toNumber(payload.final_price),
    winnerWallet: typeof payload.winner_wallet === 'string' ? payload.winner_wallet : null,
    partName: typeof payload.part_name === 'string' ? payload.part_name : null,
    rarity: typeof payload.rarity === 'string' && isRarityTier(payload.rarity) ? payload.rarity : null,
    partValue: toNumber(payload.part_value),
    sectionName: typeof payload.section_name === 'string' ? payload.section_name : null,
    sellerWallet: typeof payload.seller_wallet === 'string' ? payload.seller_wallet : null,
  };
}

export async function submitAuctionItem(
  walletAddress: string,
  partId: string,
): Promise<{ submissionId: number; roundId: number }> {
  assertSupabaseConfigured();

  const { data, error } = await supabase!.rpc('submit_auction_item', {
    p_wallet_address: walletAddress,
    p_part_id: partId,
    p_client_timestamp: new Date().toISOString(),
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

  if (error) {
    throw new Error(toFriendlyAuctionError(error.message, 'Failed to submit part to auction.'));
  }

  const payload = (data ?? {}) as { submission_id?: number | string; round_id?: number | string };
  return {
    submissionId: toNumber(payload.submission_id),
    roundId: toNumber(payload.round_id),
  };
}

export async function placeAuctionBid(
  walletAddress: string,
  roundId: number,
  amount: number,
): Promise<{ bidId: number; minNextBid: number; balance: FluxBalance }> {
  assertSupabaseConfigured();

  const idempotencyKey = `bid:${walletAddress.toLowerCase()}:${roundId}:${amount}`;

  const { data, error } = await supabase!.rpc('place_auction_bid', {
    p_wallet_address: walletAddress,
    p_round_id: roundId,
    p_amount: amount,
    p_whitelist_bonus_amount: WHITELIST_BONUS_FLUX,
    p_client_timestamp: new Date().toISOString(),
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    throw new Error(toFriendlyAuctionError(error.message, 'Failed to place auction bid.'));
  }

  const payload = (data ?? {}) as BidResponsePayload;
  if (!payload.balance) {
    throw new Error('Auction bid response was incomplete.');
  }

  return {
    bidId: toNumber(payload.bid_id),
    minNextBid: toNumber(payload.min_next_bid),
    balance: normalizeFluxBalance(payload.balance),
  };
}

export async function getActiveAuction(): Promise<AuctionRound | null> {
  assertSupabaseConfigured();

  const { data, error } = await supabase!.rpc('get_active_auction');

  if (error) {
    throw new Error(toFriendlyAuctionError(error.message, 'Failed to load active auction.'));
  }

  return normalizeActiveAuction((data ?? {}) as ActiveAuctionPayload);
}

export async function getAuctionHistory(
  limit = 20,
  offset = 0,
): Promise<AuctionHistoryEntry[]> {
  assertSupabaseConfigured();

  const { data, error } = await supabase!.rpc('get_auction_history', {
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    throw new Error(toFriendlyAuctionError(error.message, 'Failed to load auction history.'));
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((entry) => normalizeAuctionHistory(entry as AuctionHistoryPayload));
}

export function computeMinNextBid(currentHighestBid: number): number {
  if (currentHighestBid <= 0) {
    return 1;
  }

  const minIncrement = currentHighestBid * (AUCTION_MIN_INCREMENT_BPS / 10_000);
  return Math.max(1, Math.round((currentHighestBid + minIncrement) * 100) / 100);
}

export function formatAuctionError(error: unknown, fallback: string): string {
  return toFriendlyAuctionError(
    error instanceof Error ? error.message : toErrorMessage(error, fallback),
    fallback,
  );
}

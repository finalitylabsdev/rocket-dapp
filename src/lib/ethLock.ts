import { WHITELIST_ETH } from '../config/spec';
import { SUPABASE_ANON_KEY, supabase } from './supabase';
import { getConnectedEthereumWalletContext } from './web3Auth';

const ETH_WEI_MULTIPLIER = 1_000_000_000_000_000_000n;
const DEFAULT_LOCK_RECIPIENT = '0x8c80dd6327ed5889be09e77f9ca49d5bad2b0bf7';

export type EthLockStatus = 'pending' | 'sent' | 'verifying' | 'error' | 'confirmed';

const STATUS_SET = new Set<EthLockStatus>(['pending', 'sent', 'verifying', 'error', 'confirmed']);

interface EthLockSubmissionRow {
  id: number;
  wallet_address: string;
  auth_user_id: string;
  tx_hash: string | null;
  chain_id: number | null;
  block_number: number | null;
  from_address: string | null;
  to_address: string | null;
  amount_wei: string | null;
  amount_eth: string | null;
  status: EthLockStatus;
  is_lock_active: boolean;
  last_error: string | null;
  tx_submitted_at: string | null;
  confirmed_at: string | null;
  updated_at: string;
  created_at: string;
}

export interface EthLockSubmission {
  id: number;
  walletAddress: string;
  authUserId: string;
  txHash: string | null;
  chainId: number | null;
  blockNumber: number | null;
  fromAddress: string | null;
  toAddress: string | null;
  amountWei: string | null;
  amountEth: string | null;
  status: EthLockStatus;
  isLockActive: boolean;
  lastError: string | null;
  txSubmittedAt: string | null;
  confirmedAt: string | null;
  updatedAt: string;
  createdAt: string;
}

function normalizeAddress(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

function normalizeTxHash(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^0x[0-9a-f]{64}$/.test(normalized) ? normalized : null;
}

function toRpcHex(value: bigint): string {
  return `0x${value.toString(16)}`;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return 'ETH lock failed.';
}

function parseStatus(value: unknown): EthLockStatus | null {
  if (typeof value !== 'string') {
    return null;
  }

  return STATUS_SET.has(value as EthLockStatus) ? (value as EthLockStatus) : null;
}

function mapSubmission(row: EthLockSubmissionRow): EthLockSubmission {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    authUserId: row.auth_user_id,
    txHash: row.tx_hash,
    chainId: row.chain_id,
    blockNumber: row.block_number,
    fromAddress: row.from_address,
    toAddress: row.to_address,
    amountWei: row.amount_wei,
    amountEth: row.amount_eth,
    status: row.status,
    isLockActive: row.is_lock_active,
    lastError: row.last_error,
    txSubmittedAt: row.tx_submitted_at,
    confirmedAt: row.confirmed_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function ethAmountToWei(value: number): bigint {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('ETH lock amount is invalid.');
  }

  const normalized = value.toFixed(18);
  const [wholePartRaw, fractionPartRaw = ''] = normalized.split('.');
  const wholePart = wholePartRaw.replace(/^\+/, '');
  const fractionPart = fractionPartRaw.slice(0, 18).padEnd(18, '0');

  if (!/^\d+$/.test(wholePart) || !/^\d{18}$/.test(fractionPart)) {
    throw new Error('ETH lock amount could not be converted to wei.');
  }

  return (BigInt(wholePart) * ETH_WEI_MULTIPLIER) + BigInt(fractionPart);
}

function getConfiguredRecipient(): string {
  const rawValue = import.meta.env.VITE_ETH_LOCK_RECIPIENT ?? DEFAULT_LOCK_RECIPIENT;
  const normalized = normalizeAddress(rawValue);

  if (!normalized) {
    throw new Error('ETH lock recipient is not configured. Set VITE_ETH_LOCK_RECIPIENT to a valid 0x address.');
  }

  return normalized;
}

function assertFeatureConfigured() {
  if (!supabase) {
    throw new Error('Supabase is not configured in this environment.');
  }
}

function isSchemaNotReady(message: string | undefined): boolean {
  if (!message) {
    return false;
  }

  return (
    message.includes('record_eth_lock_sent')
    || message.includes('eth_lock_submissions')
    || message.includes('schema cache')
  );
}

function isVerifierFunctionUnavailable(message: string | undefined): boolean {
  if (!message) {
    return false;
  }

  return (
    message.includes('verify-eth-lock')
    || message.includes('Function not found')
    || message.includes('Failed to fetch')
  );
}

function toFriendlyDbError(message: string | undefined): string {
  if (isSchemaNotReady(message)) {
    return 'ETH lock status migration is not applied yet.';
  }

  return message || 'Failed to persist ETH lock submission.';
}

function toFriendlyVerifierError(message: string | undefined): string {
  if (message?.includes('Invalid JWT')) {
    return 'ETH lock verifier rejected the auth token. Reconnect your wallet to refresh the session.';
  }

  if (isVerifierFunctionUnavailable(message)) {
    return 'ETH lock verifier function is unavailable. Deploy verify-eth-lock edge function.';
  }

  return message || 'Failed to verify ETH lock transaction.';
}

async function getVerifierAuthToken(): Promise<string> {
  if (!supabase) {
    if (SUPABASE_ANON_KEY) {
      return SUPABASE_ANON_KEY;
    }

    throw new Error('Supabase is not configured in this environment.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(`Failed to load auth session: ${error.message}`);
  }

  const accessToken = data.session?.access_token;
  if (accessToken) {
    return accessToken;
  }

  if (SUPABASE_ANON_KEY) {
    return SUPABASE_ANON_KEY;
  }

  throw new Error('No valid auth token is available for ETH lock verification.');
}

export function formatEthAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return value
    .toFixed(6)
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1');
}

export function getConfiguredEthLockRecipient(): string {
  return getConfiguredRecipient();
}

export function getRequiredEthLockAmountWei(): bigint {
  return ethAmountToWei(WHITELIST_ETH);
}

export async function getEthLockSubmission(walletAddress: string): Promise<EthLockSubmission | null> {
  assertFeatureConfigured();

  const normalizedWallet = normalizeAddress(walletAddress);
  if (!normalizedWallet) {
    throw new Error('Invalid wallet address.');
  }

  const { data, error } = await supabase!
    .from('eth_lock_submissions')
    .select('id, wallet_address, auth_user_id, tx_hash, chain_id, block_number, from_address, to_address, amount_wei, amount_eth, status, is_lock_active, last_error, tx_submitted_at, confirmed_at, updated_at, created_at')
    .eq('wallet_address', normalizedWallet)
    .maybeSingle();

  if (error) {
    throw new Error(toFriendlyDbError(error.message));
  }

  if (!data) {
    return null;
  }

  return mapSubmission(data as EthLockSubmissionRow);
}

export async function requestEthLockVerification(walletAddress: string, txHash: string): Promise<EthLockStatus | null> {
  assertFeatureConfigured();

  const normalizedWallet = normalizeAddress(walletAddress);
  const normalizedTxHash = normalizeTxHash(txHash);

  if (!normalizedWallet || !normalizedTxHash) {
    throw new Error('Invalid wallet address or transaction hash.');
  }

  const authToken = await getVerifierAuthToken();

  const { data, error } = await supabase!.functions.invoke('verify-eth-lock', {
    body: {
      walletAddress: normalizedWallet,
      txHash: normalizedTxHash,
    },
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (error) {
    throw new Error(toFriendlyVerifierError(error.message));
  }

  const status = data && typeof data === 'object'
    ? parseStatus((data as Record<string, unknown>).status)
    : null;

  return status;
}

export async function submitAndRecordEthLock(walletAddress: string): Promise<EthLockSubmission> {
  assertFeatureConfigured();

  const normalizedWallet = normalizeAddress(walletAddress);
  if (!normalizedWallet) {
    throw new Error('Connected wallet address is invalid.');
  }

  const recipient = getConfiguredRecipient();
  const requiredAmountWei = ethAmountToWei(WHITELIST_ETH);

  try {
    const { provider, address, chainId } = await getConnectedEthereumWalletContext(normalizedWallet);
    if (address !== normalizedWallet) {
      throw new Error('The signing wallet does not match the authenticated wallet session.');
    }

    const txHashRaw = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: address,
          to: recipient,
          value: toRpcHex(requiredAmountWei),
        },
      ],
    });

    const txHash = normalizeTxHash(txHashRaw);
    if (!txHash) {
      throw new Error('Wallet did not return a valid transaction hash.');
    }

    const { error: persistError } = await supabase!.rpc('record_eth_lock_sent', {
      p_wallet_address: normalizedWallet,
      p_tx_hash: txHash,
      p_chain_id: chainId,
      p_from_address: address,
      p_to_address: recipient,
      p_amount_wei: requiredAmountWei.toString(),
      p_client_timestamp: new Date().toISOString(),
      p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });

    if (persistError) {
      throw new Error(toFriendlyDbError(persistError.message));
    }

    // Verification runs server-side; submission remains `sent/verifying` until confirmed or error.
    try {
      await requestEthLockVerification(normalizedWallet, txHash);
    } catch (verifyError) {
      console.warn('ETH lock verification invoke failed:', toErrorMessage(verifyError));
    }

    const submission = await getEthLockSubmission(normalizedWallet);
    if (!submission) {
      throw new Error('Transaction was sent but ETH lock status record could not be loaded.');
    }

    return submission;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

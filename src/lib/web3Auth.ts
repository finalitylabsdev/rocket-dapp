import type { User } from '@supabase/supabase-js';
import { getWalletAuthConfigErrorMessage } from './startupConfig';
import { getWeb3OnboardPrimaryWallet } from './web3Onboard';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabase } from './supabase';

const SIWE_STATEMENT = 'Sign in to Entropy Network.';

let activeWalletProvider: Eip1193Provider | null = null;
let activeWalletAddress: string | null = null;

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface EthereumWalletContext {
  provider: Eip1193Provider;
  address: string;
  chainId: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (isRecord(error) && typeof error.message === 'string') {
    return error.message;
  }

  return fallback;
}

function normalizeWalletAddress(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

function rememberActiveWalletProvider(provider: Eip1193Provider, address: string): void {
  activeWalletProvider = provider;
  activeWalletAddress = address;
}

export function setActiveEthereumWalletContext(provider: Eip1193Provider | null, address: string | null): void {
  if (!provider || !address) {
    clearActiveEthereumWalletContext();
    return;
  }

  const normalizedAddress = normalizeWalletAddress(address);
  if (!normalizedAddress) {
    clearActiveEthereumWalletContext();
    return;
  }

  rememberActiveWalletProvider(provider, normalizedAddress);
}

export function clearActiveEthereumWalletContext(): void {
  activeWalletProvider = null;
  activeWalletAddress = null;
}

function getRandomHex(bytes = 16): string {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Secure randomness is unavailable in this environment.');
  }

  const value = new Uint8Array(bytes);
  cryptoApi.getRandomValues(value);
  return Array.from(value, (entry) => entry.toString(16).padStart(2, '0')).join('');
}

function parseChainId(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.floor(raw);
  }

  if (typeof raw === 'string') {
    if (raw.startsWith('0x')) {
      const parsedHex = Number.parseInt(raw, 16);
      if (Number.isFinite(parsedHex) && parsedHex > 0) {
        return parsedHex;
      }
    }

    const parsedNumber = Number.parseInt(raw, 10);
    if (Number.isFinite(parsedNumber) && parsedNumber > 0) {
      return parsedNumber;
    }
  }

  return 1;
}

function getConfiguredSiweUri(): string {
  const rawValue = import.meta.env.VITE_SIWE_URI;

  if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
    return new URL(rawValue).toString();
  }

  return new URL('/', window.location.origin).toString();
}

function getConfiguredSiweDomain(uri: string): string {
  const rawValue = import.meta.env.VITE_SIWE_DOMAIN;

  if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
    return rawValue.trim();
  }

  return new URL(uri).host;
}

function buildSiweMessage(address: string, chainId: number): string {
  const uri = getConfiguredSiweUri();
  const domain = getConfiguredSiweDomain(uri);
  const issuedAt = new Date().toISOString();
  const nonce = getRandomHex(16);

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    SIWE_STATEMENT,
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');
}

function isEip1193Provider(value: unknown): value is Eip1193Provider {
  return isRecord(value) && typeof value.request === 'function';
}

async function readConnectedAccount(
  provider: Eip1193Provider,
  expectedAddress?: string,
): Promise<string | null> {
  let accountsRaw: unknown;

  try {
    accountsRaw = await provider.request({ method: 'eth_accounts' });
  } catch {
    return null;
  }

  if (!Array.isArray(accountsRaw) || accountsRaw.length === 0) {
    return null;
  }

  const accounts = accountsRaw
    .map((entry) => normalizeWalletAddress(entry))
    .filter((entry): entry is string => !!entry);

  if (accounts.length === 0) {
    return null;
  }

  const primaryAccount = accounts[0];

  if (!expectedAddress) {
    return primaryAccount;
  }

  return primaryAccount === expectedAddress ? primaryAccount : null;
}

function syncActiveWalletFromOnboard(): void {
  const wallet = getWeb3OnboardPrimaryWallet();
  if (!wallet) {
    return;
  }

  const provider = wallet.provider;
  const address = normalizeWalletAddress(wallet.accounts[0]?.address);

  if (!isEip1193Provider(provider) || !address) {
    return;
  }

  rememberActiveWalletProvider(provider, address);
}

export async function getConnectedEthereumWalletContext(
  expectedAddress?: string,
): Promise<EthereumWalletContext> {
  const normalizedExpectedAddress = normalizeWalletAddress(expectedAddress);

  if (!activeWalletProvider) {
    syncActiveWalletFromOnboard();
  }

  if (!activeWalletProvider) {
    throw new Error('No connected wallet session was found. Connect your wallet again.');
  }

  const connectedAddress = await readConnectedAccount(
    activeWalletProvider,
    normalizedExpectedAddress ?? activeWalletAddress ?? undefined,
  );
  if (!connectedAddress) {
    clearActiveEthereumWalletContext();
    throw new Error('No connected wallet session was found. Connect your wallet again.');
  }

  const chainIdRaw = await activeWalletProvider.request({ method: 'eth_chainId' });
  rememberActiveWalletProvider(activeWalletProvider, connectedAddress);

  return {
    provider: activeWalletProvider,
    address: connectedAddress,
    chainId: parseChainId(chainIdRaw),
  };
}

export async function signConnectedEthereumMessage(
  expectedAddress: string,
  message: string,
): Promise<{ address: string; chainId: number | null; signature: string }> {
  const { provider, address, chainId } = await getConnectedEthereumWalletContext(expectedAddress);
  const signature = await signMessage(provider, address, message);

  return {
    address,
    chainId,
    signature,
  };
}

async function signMessage(provider: Eip1193Provider, address: string, message: string): Promise<string> {
  let primaryError: unknown;

  try {
    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, address],
    });
    const normalized = normalizeSignature(signature);
    if (normalized) {
      return normalized;
    }
  } catch (error) {
    primaryError = error;
  }

  try {
    const signature = await provider.request({
      method: 'personal_sign',
      params: [address, message],
    });
    const normalized = normalizeSignature(signature);
    if (normalized) {
      return normalized;
    }
  } catch (secondaryError) {
    throw new Error(toErrorMessage(secondaryError, toErrorMessage(primaryError, 'Message signature failed.')));
  }

  throw new Error(toErrorMessage(primaryError, 'Message signature failed.'));
}

function normalizeSignature(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const signature = value.trim();
  return /^0x[0-9a-fA-F]+$/.test(signature) ? signature : null;
}

function extractPayloadError(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const candidates = [
    payload.message,
    payload.msg,
    payload.error_description,
    payload.error,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
}

function extractSessionTokens(payload: unknown): SessionTokens | null {
  if (!isRecord(payload)) {
    return null;
  }

  const sessionSource = isRecord(payload.session) ? payload.session : payload;
  const accessToken = sessionSource.access_token;
  const refreshToken = sessionSource.refresh_token;

  if (typeof accessToken === 'string' && typeof refreshToken === 'string') {
    return {
      accessToken,
      refreshToken,
    };
  }

  return null;
}

async function exchangeWeb3SignatureForSession(message: string, signature: string): Promise<SessionTokens> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=web3`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({
      chain: 'ethereum',
      message,
      signature,
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const reason = extractPayloadError(payload) ?? `Web3 sign-in failed (${response.status}).`;
    throw new Error(reason);
  }

  const tokens = extractSessionTokens(payload);
  if (!tokens) {
    throw new Error('Web3 sign-in succeeded but no session tokens were returned.');
  }

  return tokens;
}

export function getWalletAddressFromUser(user: User | null): string | null {
  if (!user) {
    return null;
  }

  const directCandidates: unknown[] = [user.id];
  if (isRecord(user.user_metadata)) {
    directCandidates.push(
      user.user_metadata.wallet_address,
      user.user_metadata.address,
      user.user_metadata.sub,
    );
  }

  for (const candidate of directCandidates) {
    const normalized = normalizeWalletAddress(candidate);
    if (normalized) {
      return normalized;
    }
  }

  for (const identity of user.identities ?? []) {
    const providerMatch = normalizeWalletAddress(
      isRecord(identity) ? identity.provider_id ?? identity.provider : identity.provider,
    );
    if (providerMatch) {
      return providerMatch;
    }

    if (isRecord(identity.identity_data)) {
      const identityMatchCandidates = [
        identity.identity_data.wallet_address,
        identity.identity_data.address,
        identity.identity_data.sub,
      ];

      for (const candidate of identityMatchCandidates) {
        const normalized = normalizeWalletAddress(candidate);
        if (normalized) {
          return normalized;
        }
      }
    }
  }

  return null;
}

export async function signInWithConnectedEthereumWallet(
  provider: Eip1193Provider,
  address: string,
  chainIdOverride?: number | null,
): Promise<string> {
  const startupConfigError = getWalletAuthConfigErrorMessage();
  if (!supabase || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || startupConfigError) {
    throw new Error(startupConfigError ?? 'Wallet authentication is unavailable in this environment.');
  }

  const normalizedAddress = normalizeWalletAddress(address);
  if (!normalizedAddress) {
    throw new Error('Wallet connection failed: invalid account address.');
  }

  const resolvedChainId = chainIdOverride ?? parseChainId(await provider.request({ method: 'eth_chainId' }));
  rememberActiveWalletProvider(provider, normalizedAddress);

  const message = buildSiweMessage(normalizedAddress, resolvedChainId);
  const signature = await signMessage(provider, normalizedAddress, message);
  const tokens = await exchangeWeb3SignatureForSession(message, signature);

  const { data, error } = await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });

  if (error) {
    throw new Error(error.message);
  }

  const sessionWallet = getWalletAddressFromUser(data.user);
  if (sessionWallet && sessionWallet !== normalizedAddress) {
    await supabase.auth.signOut();
    throw new Error('Authenticated wallet does not match the signed wallet address.');
  }

  return sessionWallet ?? normalizedAddress;
}

import type { User } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabase } from './supabase';

const SIWE_STATEMENT = 'Sign in to Entropy Network.';

interface Eip6963ProviderDetail {
  info?: {
    rdns?: string;
  };
  provider: Eip1193Provider;
}

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
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

function getRandomHex(bytes = 16): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const value = new Uint8Array(bytes);
    crypto.getRandomValues(value);
    return Array.from(value, (entry) => entry.toString(16).padStart(2, '0')).join('');
  }

  return Array.from({ length: bytes * 2 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
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

function buildSiweMessage(address: string, chainId: number): string {
  const currentUrl = new URL(window.location.href);
  const domain = currentUrl.host;
  const uri = `${currentUrl.origin}${currentUrl.pathname}`;
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

async function discoverEip6963Provider(timeoutMs = 250): Promise<Eip1193Provider | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const discovered: Eip6963ProviderDetail[] = [];
  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
    if (detail && isEip1193Provider(detail.provider)) {
      discovered.push(detail);
    }
  };

  window.addEventListener('eip6963:announceProvider', onAnnounce as EventListener);
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, timeoutMs);
  });

  window.removeEventListener('eip6963:announceProvider', onAnnounce as EventListener);

  if (discovered.length === 0) {
    return null;
  }

  const preferred = discovered.find((entry) => entry.info?.rdns?.includes('metamask'));
  return (preferred ?? discovered[0]).provider;
}

async function resolveEthereumProvider(): Promise<Eip1193Provider> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet auth is only available in a browser.');
  }

  if (isEip1193Provider(window.ethereum)) {
    return window.ethereum;
  }

  const discovered = await discoverEip6963Provider();
  if (discovered) {
    return discovered;
  }

  throw new Error('No Ethereum wallet detected. Install MetaMask or another EIP-1193 wallet.');
}

async function requestAccount(provider: Eip1193Provider): Promise<{ address: string; chainId: number }> {
  const accountsRaw = await provider.request({ method: 'eth_requestAccounts' });
  if (!Array.isArray(accountsRaw) || accountsRaw.length === 0) {
    throw new Error('Wallet connection failed: no accounts returned.');
  }

  const account = normalizeWalletAddress(accountsRaw[0]);
  if (!account) {
    throw new Error('Wallet connection failed: invalid account address.');
  }

  const chainIdRaw = await provider.request({ method: 'eth_chainId' });

  return {
    address: account,
    chainId: parseChainId(chainIdRaw),
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
    const providerMatch = normalizeWalletAddress(identity.provider_id);
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

export async function signInWithEthereumWallet(): Promise<string> {
  if (!supabase || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Supabase is not configured in this environment.');
  }

  const provider = await resolveEthereumProvider();
  const { address, chainId } = await requestAccount(provider);
  const message = buildSiweMessage(address, chainId);
  const signature = await signMessage(provider, address, message);
  const tokens = await exchangeWeb3SignatureForSession(message, signature);

  const { data, error } = await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });

  if (error) {
    throw new Error(error.message);
  }

  const sessionWallet = getWalletAddressFromUser(data.user);
  if (sessionWallet && sessionWallet !== address) {
    await supabase.auth.signOut();
    throw new Error('Authenticated wallet does not match the signed wallet address.');
  }

  return sessionWallet ?? address;
}

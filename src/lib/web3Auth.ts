import type { User } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, supabase } from './supabase';

const SIWE_STATEMENT = 'Sign in to Entropy Network.';
const ACTIVE_WALLET_PROVIDER_STORAGE_KEY = 'entropy.activeWalletProviderId';
const WINDOW_ETHEREUM_PROVIDER_ID = 'window.ethereum';

let activeWalletProvider: Eip1193Provider | null = null;
let activeWalletAddress: string | null = null;
let activeWalletProviderId: string | null = null;

interface Eip6963ProviderDetail {
  info?: {
    uuid?: string;
    name?: string;
    icon?: string;
    rdns?: string;
  };
  provider: Eip1193Provider;
}

interface DiscoveredEthereumProvider {
  id: string;
  label: string;
  icon?: string;
  provider: Eip1193Provider;
}

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

function getStoredActiveWalletProviderId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(ACTIVE_WALLET_PROVIDER_STORAGE_KEY);
    return typeof value === 'string' && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function setStoredActiveWalletProviderId(value: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (value) {
      window.localStorage.setItem(ACTIVE_WALLET_PROVIDER_STORAGE_KEY, value);
      return;
    }

    window.localStorage.removeItem(ACTIVE_WALLET_PROVIDER_STORAGE_KEY);
  } catch {
    // Ignore localStorage access failures (private mode / unavailable storage).
  }
}

function rememberActiveWalletProvider(
  provider: Eip1193Provider,
  address: string,
  providerId: string | null,
): void {
  activeWalletProvider = provider;
  activeWalletAddress = address;
  activeWalletProviderId = providerId;
  setStoredActiveWalletProviderId(providerId);
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

function makeEip6963ProviderId(
  info: Eip6963ProviderDetail['info'],
  fallbackOrdinal: number,
): string {
  return info?.uuid ?? info?.rdns ?? info?.name ?? `wallet-provider-${fallbackOrdinal}`;
}

function makeEip6963ProviderLabel(
  info: Eip6963ProviderDetail['info'],
  fallbackOrdinal: number,
): string {
  return info?.name ?? info?.rdns ?? `Wallet ${fallbackOrdinal}`;
}

function createWalletIcon(iconUrl: string | undefined, label: string): HTMLElement {
  const iconHolder = document.createElement('div');
  iconHolder.style.width = '22px';
  iconHolder.style.height = '22px';
  iconHolder.style.border = '1px solid #2A3348';
  iconHolder.style.background = '#0C1018';
  iconHolder.style.display = 'flex';
  iconHolder.style.alignItems = 'center';
  iconHolder.style.justifyContent = 'center';
  iconHolder.style.flexShrink = '0';
  iconHolder.style.overflow = 'hidden';

  if (iconUrl && (iconUrl.startsWith('data:image') || iconUrl.startsWith('https://'))) {
    const icon = document.createElement('img');
    icon.src = iconUrl;
    icon.alt = `${label} icon`;
    icon.width = 20;
    icon.height = 20;
    icon.style.objectFit = 'contain';
    iconHolder.appendChild(icon);
  } else {
    const fallback = document.createElement('span');
    fallback.textContent = label.slice(0, 1).toUpperCase();
    fallback.style.fontFamily = "'JetBrains Mono', monospace";
    fallback.style.fontWeight = '700';
    fallback.style.fontSize = '12px';
    fallback.style.color = '#8A94A8';
    iconHolder.appendChild(fallback);
  }

  return iconHolder;
}

function pickProviderWithModal(
  providers: DiscoveredEthereumProvider[],
): Promise<DiscoveredEthereumProvider> {
  if (providers.length === 1) {
    return Promise.resolve(providers[0]);
  }

  return new Promise<DiscoveredEthereumProvider>((resolve, reject) => {
    const body = document.body;
    if (!body) {
      reject(new Error('Unable to open wallet picker.'));
      return;
    }

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(6, 8, 15, 0.82)';
    overlay.style.backdropFilter = 'blur(6px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '16px';
    overlay.style.zIndex = '10000';

    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.style.width = 'min(460px, 100%)';
    dialog.style.maxHeight = '90vh';
    dialog.style.overflowY = 'auto';
    dialog.style.background = '#0C1018';
    dialog.style.border = '1px solid #1E2636';
    dialog.style.padding = '18px';
    dialog.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.45)';

    const title = document.createElement('h2');
    title.textContent = 'Select Wallet';
    title.style.margin = '0 0 6px';
    title.style.color = '#E8ECF4';
    title.style.fontFamily = "'JetBrains Mono', monospace";
    title.style.fontSize = '16px';
    title.style.letterSpacing = '0.08em';
    title.style.textTransform = 'uppercase';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Choose the wallet provider to connect.';
    subtitle.style.margin = '0 0 14px';
    subtitle.style.color = '#8A94A8';
    subtitle.style.fontFamily = "'JetBrains Mono', monospace";
    subtitle.style.fontSize = '12px';

    const walletList = document.createElement('div');
    walletList.style.display = 'grid';
    walletList.style.gap = '8px';

    const buttons: HTMLButtonElement[] = [];

    const cleanup = () => {
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
    };

    const onCancel = () => {
      cleanup();
      reject(new Error('Wallet selection cancelled.'));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    providers.forEach((entry) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.style.border = '1px solid #2A3348';
      button.style.background = '#06080F';
      button.style.color = '#E8ECF4';
      button.style.padding = '10px 12px';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.gap = '10px';
      button.style.cursor = 'pointer';
      button.style.textAlign = 'left';
      button.style.width = '100%';
      button.style.fontFamily = "'JetBrains Mono', monospace";
      button.style.fontSize = '13px';
      button.style.transition = 'border-color 120ms ease, background-color 120ms ease';
      button.onmouseenter = () => {
        button.style.borderColor = '#4ADE80';
        button.style.background = 'rgba(74, 222, 128, 0.08)';
      };
      button.onmouseleave = () => {
        button.style.borderColor = '#2A3348';
        button.style.background = '#06080F';
      };
      button.onclick = () => {
        cleanup();
        resolve(entry);
      };

      button.appendChild(createWalletIcon(entry.icon, entry.label));

      const labelSpan = document.createElement('span');
      labelSpan.textContent = entry.label;
      labelSpan.style.fontWeight = '600';
      button.appendChild(labelSpan);

      walletList.appendChild(button);
      buttons.push(button);
    });

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.marginTop = '12px';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancel';
    cancelButton.style.border = '1px solid #2A3348';
    cancelButton.style.background = 'transparent';
    cancelButton.style.color = '#8A94A8';
    cancelButton.style.padding = '8px 12px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontFamily = "'JetBrains Mono', monospace";
    cancelButton.style.fontSize = '12px';
    cancelButton.style.letterSpacing = '0.04em';
    cancelButton.onclick = onCancel;
    footer.appendChild(cancelButton);

    dialog.appendChild(title);
    dialog.appendChild(subtitle);
    dialog.appendChild(walletList);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        onCancel();
      }
    });

    document.addEventListener('keydown', onKeyDown);
    body.appendChild(overlay);
    buttons[0]?.focus();
  });
}

async function discoverEip6963Providers(timeoutMs = 250): Promise<DiscoveredEthereumProvider[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  const discoveredById = new Map<string, DiscoveredEthereumProvider>();
  let announceCount = 0;
  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
    if (detail && isEip1193Provider(detail.provider)) {
      announceCount += 1;
      const id = makeEip6963ProviderId(detail.info, announceCount);
      if (!discoveredById.has(id)) {
        discoveredById.set(id, {
          id,
          label: makeEip6963ProviderLabel(detail.info, announceCount),
          icon: detail.info?.icon,
          provider: detail.provider,
        });
      }
    }
  };

  window.addEventListener('eip6963:announceProvider', onAnnounce as EventListener);
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, timeoutMs);
  });

  window.removeEventListener('eip6963:announceProvider', onAnnounce as EventListener);

  return [...discoveredById.values()];
}

function getWindowEthereumProvider(): DiscoveredEthereumProvider | null {
  if (typeof window === 'undefined' || !isEip1193Provider(window.ethereum)) {
    return null;
  }

  return {
    id: WINDOW_ETHEREUM_PROVIDER_ID,
    label: 'Browser Wallet',
    provider: window.ethereum,
  };
}

async function getKnownEthereumProviders(): Promise<DiscoveredEthereumProvider[]> {
  const discovered = await discoverEip6963Providers();
  if (discovered.length > 0) {
    return discovered;
  }

  const fallback = getWindowEthereumProvider();
  return fallback ? [fallback] : [];
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

  if (!expectedAddress) {
    return accounts[0];
  }

  return accounts.includes(expectedAddress) ? expectedAddress : null;
}

async function resolveEthereumProvider(): Promise<DiscoveredEthereumProvider> {
  if (typeof window === 'undefined') {
    throw new Error('Wallet auth is only available in a browser.');
  }

  const providers = await getKnownEthereumProviders();
  if (providers.length > 0) {
    return pickProviderWithModal(providers);
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

export async function getConnectedEthereumWalletContext(
  expectedAddress?: string,
): Promise<EthereumWalletContext> {
  const normalizedExpectedAddress = normalizeWalletAddress(expectedAddress);

  if (activeWalletProvider) {
    const connectedAddress = await readConnectedAccount(activeWalletProvider, normalizedExpectedAddress ?? activeWalletAddress ?? undefined);
    if (connectedAddress) {
      const chainIdRaw = await activeWalletProvider.request({ method: 'eth_chainId' });
      rememberActiveWalletProvider(activeWalletProvider, connectedAddress, activeWalletProviderId);

      return {
        provider: activeWalletProvider,
        address: connectedAddress,
        chainId: parseChainId(chainIdRaw),
      };
    }
  }

  const providers = await getKnownEthereumProviders();
  const preferredProviderId = activeWalletProviderId ?? getStoredActiveWalletProviderId();

  if (preferredProviderId) {
    const preferredProvider = providers.find((entry) => entry.id === preferredProviderId);
    if (preferredProvider) {
      const connectedAddress = await readConnectedAccount(preferredProvider.provider, normalizedExpectedAddress ?? undefined);
      if (connectedAddress) {
        const chainIdRaw = await preferredProvider.provider.request({ method: 'eth_chainId' });
        rememberActiveWalletProvider(preferredProvider.provider, connectedAddress, preferredProvider.id);

        return {
          provider: preferredProvider.provider,
          address: connectedAddress,
          chainId: parseChainId(chainIdRaw),
        };
      }
    }
  }

  for (const providerEntry of providers) {
    const connectedAddress = await readConnectedAccount(providerEntry.provider, normalizedExpectedAddress ?? undefined);
    if (!connectedAddress) {
      continue;
    }

    const chainIdRaw = await providerEntry.provider.request({ method: 'eth_chainId' });
    rememberActiveWalletProvider(providerEntry.provider, connectedAddress, providerEntry.id);

    return {
      provider: providerEntry.provider,
      address: connectedAddress,
      chainId: parseChainId(chainIdRaw),
    };
  }

  throw new Error('No previously connected wallet session was found in the browser. Connect your wallet again.');
}

export async function getEthereumWalletContext(): Promise<EthereumWalletContext> {
  const providerEntry = await resolveEthereumProvider();
  const account = await requestAccount(providerEntry.provider);
  rememberActiveWalletProvider(providerEntry.provider, account.address, providerEntry.id);

  return {
    provider: providerEntry.provider,
    address: account.address,
    chainId: account.chainId,
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

export async function signInWithEthereumWallet(): Promise<string> {
  if (!supabase || !SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing: string[] = [];
    if (!SUPABASE_URL) {
      missing.push('VITE_SUPABASE_URL');
    }
    if (!SUPABASE_PUBLISHABLE_KEY) {
      missing.push('VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY');
    }

    const detail = missing.length > 0 ? ` Missing: ${missing.join(', ')}.` : '';
    throw new Error(`Supabase is not configured in this environment.${detail}`);
  }

  const { provider, address, chainId } = await getEthereumWalletContext();
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

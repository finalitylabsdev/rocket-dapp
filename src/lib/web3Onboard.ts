import { init } from '@web3-onboard/react';
import injectedModule, { ProviderLabel } from '@web3-onboard/injected-wallets';
import { InjectedNameSpace } from '@web3-onboard/injected-wallets/dist/types';
import type { WalletState } from '@web3-onboard/core';
import type { Device, EIP1193Provider as OnboardEip1193Provider, Platform, WalletModule } from '@web3-onboard/common';
import type { InjectedWalletModule } from '@web3-onboard/injected-wallets/dist/types';
import { safeGetStorageItem } from './safeStorage';
import { WEB3_ONBOARD_MAINNET_CHAIN_ID } from './web3OnboardShared';
const WALLET_COUNT_SUFFIX_PATTERN = /\s*\(\d+\)\s*$/;

const mainnetRpcUrl = import.meta.env.VITE_MAINNET_RPC_URL?.trim() || 'https://ethereum-rpc.publicnode.com';

const BACKPACK_LABEL = 'Backpack';
const BACKPACK_DOWNLOAD_URL = 'https://backpack.app/download';
const BACKPACK_INJECTED_NAMESPACE = 'backpack' as InjectedNameSpace;
const curatedWalletOrder = [
  ProviderLabel.MetaMask,
  ProviderLabel.Trust,
  ProviderLabel.Binance,
  ProviderLabel.OKXWallet,
  ProviderLabel.Phantom,
  BACKPACK_LABEL,
] as const;
const displayedUnavailableWallets = [
  ProviderLabel.MetaMask,
  ProviderLabel.Trust,
  ProviderLabel.Binance,
  ProviderLabel.OKXWallet,
  ProviderLabel.Phantom,
  BACKPACK_LABEL,
];
type EntropyThemeMode = 'dark' | 'light';

function getEntropyThemeMode(): EntropyThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const storedTheme = safeGetStorageItem('entropy-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  const documentTheme = document.documentElement.getAttribute('data-theme');
  return documentTheme === 'light' ? 'light' : 'dark';
}

function getEntropyAppIcon(theme: EntropyThemeMode = getEntropyThemeMode()): string {
  const background = theme === 'light' ? '#FFFFFF' : '#06080F';
  const stroke = theme === 'light' ? '#06080F' : '#E8ECF4';

  return `
    <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${background}" />
      <circle cx="32" cy="32" r="20.5" stroke="${stroke}" stroke-width="4.25" fill="none" stroke-linecap="round" />
      <line x1="32" y1="5.5" x2="32" y2="58.5" stroke="${stroke}" stroke-width="4.25" stroke-linecap="round" />
    </svg>
  `.trim();
}

function getBackpackIcon(theme: EntropyThemeMode = getEntropyThemeMode()): string {
  const background = theme === 'light' ? '#FFFFFF' : '#06080F';
  const fill = '#EF3B3B';

  return `
    <svg width="100%" height="100%" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="${background}" />
      <rect x="19" y="9" width="26" height="6" rx="3" fill="${fill}" />
      <rect x="15" y="18" width="34" height="26" rx="9.5" fill="${fill}" />
      <circle cx="32" cy="30.5" r="6.75" fill="${background}" />
      <rect x="15" y="48" width="34" height="7" rx="3.5" fill="${fill}" />
    </svg>
  `.trim();
}

function isEip1193Provider(value: unknown): value is Eip1193Provider {
  return typeof value === 'object' && value !== null && typeof (value as Eip1193Provider).request === 'function';
}

function getProviderFlag(provider: Eip1193Provider, flag: string): boolean {
  const providerRecord = provider as unknown as Record<string, unknown>;
  return Boolean(providerRecord[flag]);
}

function toOnboardProvider(provider: Eip1193Provider): OnboardEip1193Provider {
  return provider as unknown as OnboardEip1193Provider;
}

function getDirectBackpackProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const maybeWindow = window as typeof window & {
    backpack?: { ethereum?: Eip1193Provider } | Eip1193Provider;
  };

  if (isEip1193Provider(maybeWindow.backpack)) {
    return maybeWindow.backpack;
  }

  if (
    maybeWindow.backpack
    && typeof maybeWindow.backpack === 'object'
    && isEip1193Provider(maybeWindow.backpack.ethereum)
  ) {
    return maybeWindow.backpack.ethereum;
  }

  return null;
}

function isBackpackProvider(value: unknown): value is Eip1193Provider {
  if (!isEip1193Provider(value)) {
    return false;
  }

  if (getProviderFlag(value, 'isBackpack')) {
    return true;
  }

  const directBackpackProvider = getDirectBackpackProvider();
  return Boolean(directBackpackProvider) && value === directBackpackProvider;
}

function isBackpackHost(value: unknown): boolean {
  if (isBackpackProvider(value)) {
    return true;
  }

  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const providerRecord = value as { ethereum?: unknown };
  return isBackpackProvider(providerRecord.ethereum);
}

function getBackpackProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const maybeWindow = window as typeof window & {
    ethereum?: Eip1193Provider & { providers?: unknown[] };
  };
  const directBackpackProvider = getDirectBackpackProvider();
  if (directBackpackProvider) {
    return directBackpackProvider;
  }

  const injectedProvider = maybeWindow.ethereum;
  if (injectedProvider && Array.isArray(injectedProvider.providers)) {
    const matchingProvider = injectedProvider.providers.find((provider) => {
      return isBackpackProvider(provider);
    });

    if (matchingProvider && isEip1193Provider(matchingProvider)) {
      return matchingProvider;
    }
  }

  if (injectedProvider && isBackpackProvider(injectedProvider)) {
    return injectedProvider;
  }

  return null;
}

const backpackWallet = {
  label: BACKPACK_LABEL,
  // Use the dedicated Backpack namespace so availability does not depend on
  // whichever wallet currently owns window.ethereum in multi-wallet browsers.
  injectedNamespace: BACKPACK_INJECTED_NAMESPACE,
  checkProviderIdentity: ({ provider }: { provider: unknown; device: Device }) => {
    return isBackpackHost(provider);
  },
  getIcon: async () => getBackpackIcon(),
  getInterface: async () => {
    const provider = getBackpackProvider();
    if (!provider) {
      throw new Error('Backpack is unavailable.');
    }

    return { provider: toOnboardProvider(provider) };
  },
  platforms: ['desktop', 'mobile'] as Platform[],
  externalUrl: BACKPACK_DOWNLOAD_URL,
} satisfies InjectedWalletModule;

const injected = injectedModule({
  custom: [backpackWallet],
  displayUnavailable: displayedUnavailableWallets,
  filter: {
    [ProviderLabel.Detected]: false,
  },
  walletUnavailableMessage: (wallet) => {
    const externalUrl = 'externalUrl' in wallet && typeof wallet.externalUrl === 'string'
      ? wallet.externalUrl
      : null;

    if (externalUrl) {
      return `Install ${wallet.label} from <a href="${externalUrl}" target="_blank" rel="noreferrer">this download page</a> to continue.`;
    }

    return `Install or enable ${wallet.label} to continue.`;
  },
  sort: (wallets) => {
    const walletsByLabel = new Map(wallets.map((wallet) => [wallet.label, wallet]));

    return curatedWalletOrder
      .map((label) => walletsByLabel.get(label))
      .filter((wallet): wallet is WalletModule => wallet !== undefined);
  },
});

export const web3Onboard = init({
  wallets: [injected],
  chains: [
    {
      id: WEB3_ONBOARD_MAINNET_CHAIN_ID,
      token: 'ETH',
      label: 'Ethereum Mainnet',
      rpcUrl: mainnetRpcUrl,
      publicRpcUrl: 'https://ethereum-rpc.publicnode.com',
      blockExplorerUrl: 'https://etherscan.io',
    },
  ],
  appMetadata: {
    name: 'Entropy Network',
    icon: getEntropyAppIcon(),
    description: 'Lock ETH, claim Φ, and move through the Entropy Network.',
    recommendedInjectedWallets: [
      { name: 'MetaMask', url: 'https://metamask.io/download/' },
      { name: 'Trust Wallet', url: 'https://link.trustwallet.com/' },
      { name: 'Binance Wallet', url: 'https://www.binance.com/en/web3wallet' },
      { name: 'OKX Wallet', url: 'https://www.okx.com/download' },
      { name: 'Phantom', url: 'https://phantom.app/download' },
      { name: BACKPACK_LABEL, url: BACKPACK_DOWNLOAD_URL },
    ],
  },
  i18n: {
    en: {
      connect: {
        selectingWallet: {
          header: 'Supported Ethereum Wallets',
          sidebar: {
            subheading: 'Entropy Gate Access',
            paragraph: 'Select a supported Ethereum wallet to verify your identity and check ETH lock status.',
            IDontHaveAWallet: 'Need a wallet?'
          },
          recommendedWalletsPart1: '{app} supports',
          recommendedWalletsPart2: 'on this platform. Install one of these wallets to continue.',
          installWallet: 'No supported Ethereum wallet is installed. Install one of the supported wallets to continue.',
          whyDontISeeMyWallet: 'Need help finding your wallet?',
          learnMore: 'Open troubleshooting guide',
        },
        connectingWallet: {
          sidebar: {
            subheading: 'Approve Connection',
            paragraph: 'Approve the request in your wallet to continue into Entropy Network.'
          },
          paragraph: 'Choose the account you want to use with Entropy Network.',
          primaryButton: 'Back to wallets',
        },
        connectedWallet: {
          header: 'Wallet Connected',
          sidebar: {
            subheading: 'Wallet Connected',
            paragraph: 'Your wallet is connected. Returning you to Entropy Network.'
          },
        },
      },
      modals: {
        switchChain: {
          heading: 'Switch to Ethereum Mainnet',
          paragraph1: '{app} requires Ethereum Mainnet to continue.',
          paragraph2: 'If this wallet cannot switch networks, return to the wallet list and choose a different supported wallet.'
        },
      },
    },
  },
  connect: {
    showSidebar: false,
    autoConnectLastWallet: false,
    iDontHaveAWalletLink: 'https://ethereum.org/en/wallets/find-wallet/',
    wheresMyWalletLink: 'https://www.blocknative.com/blog/metamask-wont-connect-web3-wallet-troubleshooting',
    removeWhereIsMyWalletWarning: true,
    removeIDontHaveAWalletInfoLink: true,
  },
  accountCenter: {
    desktop: { enabled: false },
    mobile: { enabled: false },
  },
  notify: {
    desktop: { enabled: false, position: 'bottomRight' },
    mobile: { enabled: false, position: 'bottomRight' },
  },
  theme: {
    '--w3o-background-color': 'var(--color-bg-card)',
    '--w3o-foreground-color': 'var(--color-bg-base)',
    '--w3o-text-color': 'var(--color-text-primary)',
    '--w3o-border-color': 'var(--color-border-default)',
    '--w3o-action-color': '#4ADE80',
    '--w3o-border-radius': '0px',
    '--w3o-font-family': "'IBM Plex Mono', 'JetBrains Mono', 'Inter', sans-serif",
  },
  disableFontDownload: true,
});

let onboardDomTweaksInstalled = false;
const ONBOARD_STYLE_OVERRIDE_ID = 'entropy-onboard-style-overrides';
const ONBOARD_CLOSE_ICON_WRAPPER = 'entropy-close-icon';
const ONBOARD_STYLE_OVERRIDES = `
  .container:has(> .connecting-container) {
    display: grid !important;
    grid-template-columns: 6rem minmax(0, 1fr) !important;
    column-gap: 1rem !important;
    row-gap: 0.85rem !important;
    width: 100% !important;
    align-items: start !important;
    padding: 1rem !important;
  }

  .container:has(> .connecting-container) > .connecting-container {
    grid-column: 1 / -1 !important;
    align-items: flex-start !important;
    justify-content: flex-start !important;
    gap: 1rem !important;
    padding: 1rem !important;
  }

  .container:has(> .connecting-container) .wallet-badges {
    flex: 0 0 auto !important;
    margin-top: 0.15rem !important;
  }

  .container:has(> .connecting-container) .connecting-wallet-info {
    margin-left: 1rem !important;
    min-width: 0 !important;
    flex: 1 1 auto !important;
  }

  .container:has(> .connecting-container) > .onboard-button-primary {
    position: static !important;
    grid-column: 2 !important;
    justify-self: start !important;
    align-self: start !important;
    margin: 0 !important;
    width: auto !important;
  }

  .connecting-container {
    background:
      linear-gradient(180deg, rgba(12, 16, 24, 0.96), rgba(6, 8, 15, 0.98)) !important;
    border: 1px solid rgba(74, 222, 128, 0.22) !important;
    border-radius: 0 !important;
    color: var(--w3o-text-color, #E8ECF4) !important;
  }

  .connecting-container.warning {
    background:
      linear-gradient(180deg, rgba(31, 24, 8, 0.96), rgba(18, 14, 6, 0.98)) !important;
    border-color: rgba(245, 158, 11, 0.28) !important;
    color: var(--w3o-text-color, #E8ECF4) !important;
  }

  .connecting-container .text {
    color: var(--w3o-text-color, #E8ECF4) !important;
    font-size: 1rem !important;
    font-weight: 700 !important;
    line-height: 1.25 !important;
    margin-bottom: 0.45rem !important;
  }

  .connecting-container .subtext {
    color: #A7B2C8 !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    line-height: 1.45 !important;
    max-width: 30rem !important;
  }

  .connecting-container .rejected-cta {
    color: #6EE7A0 !important;
  }

  .onboard-button-primary {
    background: rgba(6, 8, 15, 0.92) !important;
    color: #4ADE80 !important;
    border: 1px solid rgba(74, 222, 128, 0.24) !important;
    border-radius: 0 !important;
    display: inline-flex !important;
    box-shadow: none !important;
    font-family: var(--w3o-font-family, 'JetBrains Mono', sans-serif) !important;
    font-size: 0.875rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.03em !important;
    line-height: 1 !important;
    padding: 0.55rem 0.8rem !important;
  }

  .onboard-button-primary:hover {
    background: rgba(74, 222, 128, 0.08) !important;
    border-color: #4ADE80 !important;
    color: #6EE7A0 !important;
  }

  .close-button {
    width: 1.75rem !important;
    height: 1.75rem !important;
    padding: 0 !important;
    border-radius: 0 !important;
    border: 1px solid var(--w3o-border-color, #2A3348) !important;
    background: var(--w3o-foreground-color, rgba(6, 8, 15, 0.92)) !important;
    color: var(--w3o-text-color, #E8ECF4) !important;
    box-shadow: none !important;
  }

  .close-button:hover {
    border-color: rgba(74, 222, 128, 0.35) !important;
    background: rgba(74, 222, 128, 0.08) !important;
    color: #4ADE80 !important;
  }

  .close-button svg {
    width: 1rem !important;
    height: 1rem !important;
  }
`.trim();
function stripWalletCountFromHeader(root: ShadowRoot): void {
  const header = root.querySelector('.header-heading');
  if (!(header instanceof HTMLElement)) {
    return;
  }

  const currentText = header.textContent?.trim() ?? '';
  const nextText = currentText.replace(WALLET_COUNT_SUFFIX_PATTERN, '').trim();

  if (nextText && nextText !== currentText) {
    header.textContent = nextText;
  }
}

function replaceCloseButtonIcon(root: ShadowRoot): void {
  const button = root.querySelector('.close-button');
  if (!(button instanceof HTMLElement)) {
    return;
  }

  const existingWrapper = button.querySelector(`.${ONBOARD_CLOSE_ICON_WRAPPER}`);
  if (existingWrapper instanceof HTMLElement) {
    return;
  }

  const wrapper = document.createElement('span');
  wrapper.className = ONBOARD_CLOSE_ICON_WRAPPER;
  wrapper.setAttribute('aria-hidden', 'true');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  wrapper.appendChild(createCloseIconSvg());

  button.replaceChildren(wrapper);
}

function createCloseIconSvg(): SVGElement {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNamespace, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.style.width = '1rem';
  svg.style.height = '1rem';
  svg.style.display = 'block';

  for (const d of ['M3 3L13 13', 'M13 3L3 13']) {
    const path = document.createElementNS(svgNamespace, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.75');
    path.setAttribute('stroke-linecap', 'square');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);
  }

  return svg;
}

function ensureStyleOverrides(root: ShadowRoot): void {
  if (root.getElementById(ONBOARD_STYLE_OVERRIDE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = ONBOARD_STYLE_OVERRIDE_ID;
  style.textContent = ONBOARD_STYLE_OVERRIDES;
  root.appendChild(style);
}

function attachShadowRootTweaks(root: ShadowRoot): void {
  ensureStyleOverrides(root);
  replaceCloseButtonIcon(root);

  if ((root as ShadowRoot & { __entropyWalletHeaderObserver?: MutationObserver }).__entropyWalletHeaderObserver) {
    stripWalletCountFromHeader(root);
    replaceCloseButtonIcon(root);
    return;
  }

  stripWalletCountFromHeader(root);

  const observer = new MutationObserver(() => {
    stripWalletCountFromHeader(root);
    replaceCloseButtonIcon(root);
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  (root as ShadowRoot & { __entropyWalletHeaderObserver?: MutationObserver }).__entropyWalletHeaderObserver = observer;
}

function installOnboardDomTweaks(): void {
  if (
    onboardDomTweaksInstalled
    || typeof window === 'undefined'
    || typeof document === 'undefined'
    || typeof MutationObserver === 'undefined'
  ) {
    return;
  }

  onboardDomTweaksInstalled = true;

  const syncThemeAwareAppIcon = () => {
    const actions = (web3Onboard as typeof web3Onboard & {
      state: {
        actions?: {
          updateAppMetadata?: (nextMetadata: { icon: string }) => void;
        };
      };
    }).state.actions;

    actions?.updateAppMetadata?.({
      icon: getEntropyAppIcon(),
    });
  };

  const connectHost = () => {
    const host = document.querySelector('onboard-v2');
    if (host?.shadowRoot) {
      attachShadowRootTweaks(host.shadowRoot);
    }
  };

  syncThemeAwareAppIcon();
  connectHost();

  const observer = new MutationObserver(() => {
    connectHost();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  const themeObserver = new MutationObserver(() => {
    syncThemeAwareAppIcon();
  });

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

installOnboardDomTweaks();

export function getWeb3OnboardPrimaryWallet(): WalletState | null {
  return web3Onboard.state.get().wallets[0] ?? null;
}

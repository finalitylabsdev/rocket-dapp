import type { AppKit } from '@reown/appkit/react';

export const REOWN_EVM_NAMESPACE = 'eip155' as const;

const REOWN_ETHEREUM_WALLET_IDS = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Binance Wallet
  '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX Wallet
  '2bd8c14e035c2d48f184aaa168559e86b0e3433228d3c4075900a221785019b0', // Backpack
  'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
] as const;

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID?.trim() ?? '';
const appUrl = typeof window === 'undefined' ? 'http://localhost:5173' : window.location.origin;
const appIcon = typeof window === 'undefined'
  ? `${appUrl}/favicon.svg`
  : new URL('/favicon.svg', window.location.origin).toString();

export const isReownConfigured = projectId.length > 0;

let reownAppKitPromise: Promise<AppKit> | null = null;

export async function loadReownAppKit(): Promise<AppKit | null> {
  if (!isReownConfigured) {
    return null;
  }

  if (!reownAppKitPromise) {
    reownAppKitPromise = (async () => {
      const [{ createAppKit }, { mainnet }, { EthersAdapter }] = await Promise.all([
        import('@reown/appkit/react'),
        import('@reown/appkit/networks'),
        import('@reown/appkit-adapter-ethers'),
      ]);

      const appKit = createAppKit({
        projectId,
        adapters: [new EthersAdapter()],
        networks: [mainnet],
        defaultNetwork: mainnet,
        allowUnsupportedChain: false,
        enableEIP6963: true,
        enableWalletConnect: false,
        featuredWalletIds: [...REOWN_ETHEREUM_WALLET_IDS],
        includeWalletIds: [...REOWN_ETHEREUM_WALLET_IDS],
        features: {
          email: false,
          socials: false,
          allWallets: false,
          connectMethodsOrder: ['wallet'],
          connectorTypeOrder: ['featured'],
        },
        metadata: {
          name: 'Entropy Network',
          description: 'Lock ETH, claim FLUX, and move through the Entropy Network.',
          url: appUrl,
          icons: [appIcon],
        },
      });

      await appKit.ready();
      return appKit;
    })();
  }

  return reownAppKitPromise;
}

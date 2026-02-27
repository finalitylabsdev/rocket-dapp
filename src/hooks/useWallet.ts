import {
  createElement,
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import type { AppKit } from '@reown/appkit/react';
import { recordWalletConnect, recordWalletDisconnect } from '../lib/ledger';
import { REOWN_EVM_NAMESPACE, isReownConfigured, loadReownAppKit } from '../lib/reownAppKit';
import { supabase } from '../lib/supabase';
import {
  clearActiveEthereumWalletContext,
  getWalletAddressFromUser,
  setActiveEthereumWalletContext,
  signInWithConnectedEthereumWallet,
} from '../lib/web3Auth';

type ReownAccountStatus = 'reconnecting' | 'connected' | 'disconnected' | 'connecting' | undefined;

interface ReownState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  status: ReownAccountStatus;
  walletProvider: Eip1193Provider | null;
}

function formatAddress(address: string | null): string | null {
  if (!address) {
    return null;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return 'Wallet action failed.';
}

function normalizeConnectedAddress(address: string | undefined): string | null {
  if (typeof address !== 'string') {
    return null;
  }

  const normalized = address.trim().toLowerCase();
  return /^0x[0-9a-f]{40}$/.test(normalized) ? normalized : null;
}

function parseConnectedChainId(value: string | number | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === 'string') {
    if (value.startsWith('0x')) {
      const parsedHex = Number.parseInt(value, 16);
      if (Number.isFinite(parsedHex) && parsedHex > 0) {
        return parsedHex;
      }
    }

    const parsedNumber = Number.parseInt(value, 10);
    if (Number.isFinite(parsedNumber) && parsedNumber > 0) {
      return parsedNumber;
    }
  }

  return null;
}

interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
  displayAddress: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function useProvideWallet(): WalletContextValue {
  const [reownState, setReownState] = useState<ReownState>({
    address: null,
    chainId: null,
    isConnected: false,
    status: 'disconnected',
    walletProvider: null,
  });
  const [address, setAddress] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSessionHydrated, setIsSessionHydrated] = useState(!supabase);
  const [shouldInitReown, setShouldInitReown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appKitRef = useRef<AppKit | null>(null);
  const failedAuthAddressRef = useRef<string | null>(null);
  const manualDisconnectRef = useRef(false);

  const ensureReownAppKit = useCallback(async (): Promise<AppKit | null> => {
    const appKit = await loadReownAppKit();
    appKitRef.current = appKit;
    return appKit;
  }, []);

  const syncReownState = useCallback(() => {
    const appKit = appKitRef.current;

    if (!appKit) {
      setReownState({
        address: null,
        chainId: null,
        isConnected: false,
        status: 'disconnected',
        walletProvider: null,
      });
      return;
    }

    const account = appKit.getAccount(REOWN_EVM_NAMESPACE);
    const nextAddress = normalizeConnectedAddress(account?.address);
    const nextChainId = parseConnectedChainId(appKit.getChainId());
    const nextProvider = appKit.getProvider<Eip1193Provider>(REOWN_EVM_NAMESPACE) ?? null;

    setReownState({
      address: nextAddress,
      chainId: nextChainId,
      isConnected: Boolean(account?.isConnected && nextAddress),
      status: account?.status,
      walletProvider: nextProvider,
    });
  }, []);

  const disconnectReown = useCallback(async () => {
    const appKit = appKitRef.current ?? await ensureReownAppKit();
    if (!appKit) {
      return;
    }

    await appKit.disconnect(REOWN_EVM_NAMESPACE);
    syncReownState();
  }, [ensureReownAppKit, syncReownState]);

  const clearWalletSession = useCallback(async (message: string) => {
    clearActiveEthereumWalletContext();

    if (supabase) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('Failed to clear stale wallet session:', signOutError.message);
      }
    }

    setAddress(null);
    setError(message);
  }, []);

  const authenticateConnectedWallet = useCallback(async (): Promise<boolean> => {
    if (!reownState.walletProvider || !reownState.address || isAuthenticating) {
      return false;
    }

    setIsAuthenticating(true);
    setError(null);
    const previousAddress = address;

    try {
      const nextAddress = await signInWithConnectedEthereumWallet(
        reownState.walletProvider,
        reownState.address,
        reownState.chainId,
      );
      setAddress(nextAddress);
      failedAuthAddressRef.current = null;

      if (nextAddress !== previousAddress) {
        await recordWalletConnect(nextAddress);
      }

      return true;
    } catch (connectError) {
      const message = toErrorMessage(connectError);
      failedAuthAddressRef.current = reownState.address;
      setError(message);
      console.error('Wallet connect failed:', message);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, isAuthenticating, reownState.address, reownState.chainId, reownState.walletProvider]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!isMounted) {
        return;
      }

      if (sessionError) {
        console.error('Failed to load wallet session:', sessionError.message);
        setAddress(null);
      } else {
        const sessionAddress = getWalletAddressFromUser(data.session?.user ?? null);
        setAddress(sessionAddress);

        if (sessionAddress && isReownConfigured) {
          setShouldInitReown(true);
        }
      }

      setIsSessionHydrated(true);
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionAddress = getWalletAddressFromUser(session?.user ?? null);
      setAddress(sessionAddress);

      if (sessionAddress && isReownConfigured) {
        setShouldInitReown(true);
      }

      setIsSessionHydrated(true);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReownConfigured || !shouldInitReown) {
      return;
    }

    let isMounted = true;
    let cleanupFns: Array<() => void> = [];

    void ensureReownAppKit().then((appKit) => {
      if (!isMounted || !appKit) {
        return;
      }

      syncReownState();

      cleanupFns = [
        appKit.subscribeAccount(() => {
          syncReownState();
        }, REOWN_EVM_NAMESPACE),
        appKit.subscribeNetwork(() => {
          syncReownState();
        }),
        appKit.subscribeProviders(() => {
          syncReownState();
        }),
      ];
    }).catch((loadError) => {
      if (!isMounted) {
        return;
      }

      const message = toErrorMessage(loadError);
      setError(message);
      console.error('Reown AppKit failed to initialize:', message);
    });

    return () => {
      isMounted = false;
      cleanupFns.forEach((cleanup) => cleanup());
    };
  }, [ensureReownAppKit, shouldInitReown, syncReownState]);

  useEffect(() => {
    if (!isReownConfigured) {
      return;
    }

    if (reownState.walletProvider && reownState.address && reownState.isConnected) {
      setActiveEthereumWalletContext(reownState.walletProvider, reownState.address);
      return;
    }

    clearActiveEthereumWalletContext();
  }, [reownState.address, reownState.isConnected, reownState.walletProvider]);

  useEffect(() => {
    if (!isReownConfigured) {
      return;
    }

    if (!reownState.address || !reownState.isConnected) {
      failedAuthAddressRef.current = null;
      return;
    }

    if (failedAuthAddressRef.current && failedAuthAddressRef.current !== reownState.address) {
      failedAuthAddressRef.current = null;
    }
  }, [reownState.address, reownState.isConnected]);

  useEffect(() => {
    if (!isReownConfigured || !shouldInitReown) {
      return;
    }

    if (!isSessionHydrated) {
      return;
    }

    if (!reownState.isConnected || !reownState.address || !reownState.walletProvider) {
      if (address && !manualDisconnectRef.current) {
        void clearWalletSession('Wallet disconnected. Reconnect to continue.');
      }
      return;
    }

    if (manualDisconnectRef.current) {
      return;
    }

    if (address && address !== reownState.address) {
      manualDisconnectRef.current = true;

      void (async () => {
        try {
          await clearWalletSession('Wallet account changed. Reconnect with the active wallet.');
          await disconnectReown();
        } catch (disconnectError) {
          console.error('Wallet reconnect reset failed:', toErrorMessage(disconnectError));
        } finally {
          manualDisconnectRef.current = false;
        }
      })();

      return;
    }

    if (!address && failedAuthAddressRef.current !== reownState.address) {
      void authenticateConnectedWallet();
    }
  }, [
    address,
    authenticateConnectedWallet,
    clearWalletSession,
    disconnectReown,
    isSessionHydrated,
    reownState.address,
    reownState.isConnected,
    reownState.walletProvider,
    shouldInitReown,
  ]);

  const connect = useCallback(async () => {
    if (!isReownConfigured) {
      setError('Wallet connect is unavailable until VITE_REOWN_PROJECT_ID is configured.');
      return;
    }

    setShouldInitReown(true);
    failedAuthAddressRef.current = null;
    setError(null);

    if (reownState.isConnected && reownState.walletProvider && reownState.address) {
      await authenticateConnectedWallet();
      return;
    }

    try {
      const appKit = await ensureReownAppKit();
      if (!appKit) {
        throw new Error('Wallet connect is unavailable until VITE_REOWN_PROJECT_ID is configured.');
      }

      await appKit.open({ view: 'Connect' });
      syncReownState();
    } catch (connectError) {
      const message = toErrorMessage(connectError);
      setError(message);
      console.error('Wallet modal failed:', message);
    }
  }, [
    authenticateConnectedWallet,
    ensureReownAppKit,
    reownState.address,
    reownState.isConnected,
    reownState.walletProvider,
    syncReownState,
  ]);

  const disconnect = useCallback(async () => {
    setError(null);
    setIsDisconnecting(true);
    manualDisconnectRef.current = true;

    try {
      if (address) {
        await recordWalletDisconnect(address);
      }

      if (supabase) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          throw new Error(signOutError.message);
        }
      }

      if (isReownConfigured && shouldInitReown && reownState.isConnected) {
        await disconnectReown();
      }

      clearActiveEthereumWalletContext();
      failedAuthAddressRef.current = null;
      setAddress(null);
    } catch (disconnectError) {
      const message = toErrorMessage(disconnectError);
      setError(message);
      console.error('Wallet disconnect failed:', message);
    } finally {
      manualDisconnectRef.current = false;
      setIsDisconnecting(false);
    }
  }, [address, disconnectReown, reownState.isConnected, shouldInitReown]);

  return {
    address,
    isConnected: !!address,
    connect,
    disconnect,
    isConnecting:
      isDisconnecting
      || isAuthenticating
      || reownState.status === 'connecting'
      || reownState.status === 'reconnecting',
    error,
    displayAddress: formatAddress(address),
  };
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const value = useProvideWallet();

  return createElement(WalletContext.Provider, { value }, children);
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider.');
  }

  return context;
}

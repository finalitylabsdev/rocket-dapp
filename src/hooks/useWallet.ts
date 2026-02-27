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
import type { WalletState } from '@web3-onboard/core';
import { useConnectWallet, useSetChain, useWallets } from '@web3-onboard/react';
import { recordWalletConnect, recordWalletDisconnect } from '../lib/ledger';
import {
  dismissWeb3OnboardModal,
  WEB3_ONBOARD_MAINNET_CHAIN_DECIMAL,
  WEB3_ONBOARD_MAINNET_CHAIN_ID,
} from '../lib/web3Onboard';
import { supabase } from '../lib/supabase';
import {
  clearActiveEthereumWalletContext,
  getWalletAddressFromUser,
  setActiveEthereumWalletContext,
  signInWithConnectedEthereumWallet,
} from '../lib/web3Auth';

interface OnboardState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  walletProvider: Eip1193Provider | null;
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

function isEip1193Provider(value: unknown): value is Eip1193Provider {
  return typeof value === 'object' && value !== null && typeof (value as Eip1193Provider).request === 'function';
}

function normalizeWalletProvider(value: unknown): Eip1193Provider | null {
  return isEip1193Provider(value) ? value : null;
}

function buildOnboardState(wallet: WalletState | null): OnboardState {
  const nextAddress = normalizeConnectedAddress(wallet?.accounts[0]?.address);
  const nextChainId = parseConnectedChainId(wallet?.chains[0]?.id);
  const nextProvider = normalizeWalletProvider(wallet?.provider);

  return {
    address: nextAddress,
    chainId: nextChainId,
    isConnected: Boolean(wallet && nextAddress && nextProvider),
    walletProvider: nextProvider,
  };
}

function useProvideWallet(): WalletContextValue {
  const connectedWallets = useWallets();
  const [{ wallet, connecting }, connectWallet, disconnectWallet, , , setPrimaryWallet] = useConnectWallet();
  const primaryWallet = wallet ?? connectedWallets[0] ?? null;
  const onboardState = buildOnboardState(primaryWallet);
  const [{ settingChain }, setChain] = useSetChain(primaryWallet?.label);

  const [address, setAddress] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSessionHydrated, setIsSessionHydrated] = useState(!supabase);
  const [error, setError] = useState<string | null>(null);

  const failedAuthAddressRef = useRef<string | null>(null);
  const manualDisconnectRef = useRef(false);

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

  const disconnectConnectedWallet = useCallback(async () => {
    if (!primaryWallet) {
      return;
    }

    await disconnectWallet({ label: primaryWallet.label });
  }, [disconnectWallet, primaryWallet]);

  const authenticateConnectedWallet = useCallback(async (): Promise<boolean> => {
    if (!onboardState.walletProvider || !onboardState.address || isAuthenticating) {
      return false;
    }

    setIsAuthenticating(true);
    setError(null);
    const previousAddress = address;

    try {
      if (
        onboardState.chainId !== null
        && onboardState.chainId !== WEB3_ONBOARD_MAINNET_CHAIN_DECIMAL
      ) {
        const switched = await setChain({ chainId: WEB3_ONBOARD_MAINNET_CHAIN_ID });
        if (!switched) {
          throw new Error('Switch to Ethereum Mainnet to continue.');
        }
      }

      const nextAddress = await signInWithConnectedEthereumWallet(
        onboardState.walletProvider,
        onboardState.address,
      );
      setAddress(nextAddress);
      failedAuthAddressRef.current = null;

      if (nextAddress !== previousAddress) {
        await recordWalletConnect(nextAddress);
      }

      return true;
    } catch (connectError) {
      const message = toErrorMessage(connectError);
      failedAuthAddressRef.current = onboardState.address;
      setError(message);
      console.error('Wallet connect failed:', message);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    address,
    isAuthenticating,
    onboardState.address,
    onboardState.chainId,
    onboardState.walletProvider,
    setChain,
  ]);

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
        setAddress(getWalletAddressFromUser(data.session?.user ?? null));
      }

      setIsSessionHydrated(true);
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAddress(getWalletAddressFromUser(session?.user ?? null));
      setIsSessionHydrated(true);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (onboardState.walletProvider && onboardState.address && onboardState.isConnected) {
      setActiveEthereumWalletContext(onboardState.walletProvider, onboardState.address);
      return;
    }

    clearActiveEthereumWalletContext();
  }, [onboardState.address, onboardState.isConnected, onboardState.walletProvider]);

  useEffect(() => {
    if (!onboardState.address || !onboardState.isConnected) {
      failedAuthAddressRef.current = null;
      return;
    }

    if (failedAuthAddressRef.current && failedAuthAddressRef.current !== onboardState.address) {
      failedAuthAddressRef.current = null;
    }
  }, [onboardState.address, onboardState.isConnected]);

  useEffect(() => {
    if (!isSessionHydrated || connecting) {
      return;
    }

    if (!onboardState.isConnected || !onboardState.address || !onboardState.walletProvider) {
      if (address && !manualDisconnectRef.current) {
        void clearWalletSession('Wallet disconnected. Reconnect to continue.');
      }
      return;
    }

    if (manualDisconnectRef.current) {
      return;
    }

    if (address && address !== onboardState.address) {
      manualDisconnectRef.current = true;

      void (async () => {
        try {
          await clearWalletSession('Wallet account changed. Reconnect with the active wallet.');
          await disconnectConnectedWallet();
        } catch (disconnectError) {
          console.error('Wallet reconnect reset failed:', toErrorMessage(disconnectError));
        } finally {
          manualDisconnectRef.current = false;
        }
      })();

      return;
    }

    if (!address && failedAuthAddressRef.current !== onboardState.address) {
      void authenticateConnectedWallet();
    }
  }, [
    address,
    authenticateConnectedWallet,
    clearWalletSession,
    connecting,
    disconnectConnectedWallet,
    isSessionHydrated,
    onboardState.address,
    onboardState.isConnected,
    onboardState.walletProvider,
  ]);

  useEffect(() => {
    if (!primaryWallet || !connecting) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dismissWeb3OnboardModal();
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [connecting, primaryWallet]);

  const connect = useCallback(async () => {
    failedAuthAddressRef.current = null;
    setError(null);

    if (onboardState.isConnected && onboardState.walletProvider && onboardState.address) {
      await authenticateConnectedWallet();
      return;
    }

    try {
      const nextWallets = await connectWallet();
      if (nextWallets[0]) {
        setPrimaryWallet(nextWallets[0]);
      }
    } catch (connectError) {
      const message = toErrorMessage(connectError);
      setError(message);
      console.error('Wallet modal failed:', message);
    }
  }, [
    authenticateConnectedWallet,
    connectWallet,
    onboardState.address,
    onboardState.isConnected,
    onboardState.walletProvider,
    setPrimaryWallet,
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

      await disconnectConnectedWallet();
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
  }, [address, disconnectConnectedWallet]);

  return {
    address,
    isConnected: !!address,
    connect,
    disconnect,
    isConnecting: isDisconnecting || isAuthenticating || connecting || settingChain,
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

import { useState, useEffect, useCallback } from 'react';
import { recordWalletConnect, recordWalletDisconnect } from '../lib/ledger';
import { supabase } from '../lib/supabase';
import { getWalletAddressFromUser, signInWithEthereumWallet } from '../lib/web3Auth';

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

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        return;
      }

      setAddress(getWalletAddressFromUser(data.session?.user ?? null));
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setAddress(getWalletAddressFromUser(session?.user ?? null));
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const nextAddress = await signInWithEthereumWallet();
      setAddress(nextAddress);

      if (nextAddress !== address) {
        await recordWalletConnect(nextAddress);
      }
    } catch (connectError) {
      const message = toErrorMessage(connectError);
      setError(message);
      console.error('Wallet connect failed:', message);
    } finally {
      setIsConnecting(false);
    }
  }, [address, isConnecting]);

  const disconnect = useCallback(async () => {
    if (!supabase || !address) {
      return;
    }

    setError(null);
    setIsConnecting(true);

    try {
      await recordWalletDisconnect(address);

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw new Error(signOutError.message);
      }

      setAddress(null);
    } catch (disconnectError) {
      const message = toErrorMessage(disconnectError);
      setError(message);
      console.error('Wallet disconnect failed:', message);
    } finally {
      setIsConnecting(false);
    }
  }, [address]);

  return {
    address,
    isConnected: !!address,
    connect,
    disconnect,
    isConnecting,
    error,
    displayAddress: formatAddress(address),
  };
}

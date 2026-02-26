import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'enet-wallet';

function generateAddress(): string {
  const hex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `0x${hex}`;
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  useEffect(() => {
    if (address) localStorage.setItem(STORAGE_KEY, address);
    else localStorage.removeItem(STORAGE_KEY);
  }, [address]);

  const connect = useCallback(() => {
    if (!address) setAddress(generateAddress());
  }, [address]);

  const disconnect = useCallback(() => setAddress(null), []);

  return {
    address,
    isConnected: !!address,
    connect,
    disconnect,
    displayAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
  };
}

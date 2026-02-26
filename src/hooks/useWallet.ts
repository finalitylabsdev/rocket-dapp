import { useState, useEffect, useCallback } from 'react';
import { recordWalletConnect, recordWalletDisconnect } from '../lib/ledger';

const STORAGE_KEY = 'phinet-wallet';

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
    if (address) return;

    const nextAddress = generateAddress();
    setAddress(nextAddress);
    void recordWalletConnect(nextAddress);
  }, [address]);

  const disconnect = useCallback(() => {
    if (!address) return;
    void recordWalletDisconnect(address);
    setAddress(null);
  }, [address]);

  return {
    address,
    isConnected: !!address,
    connect,
    disconnect,
    displayAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
  };
}

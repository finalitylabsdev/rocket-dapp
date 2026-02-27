import { createContext, useContext, type ReactNode } from 'react';
import { useEthLock } from '../hooks/useEthLock';
import { useWallet } from '../hooks/useWallet';

type EthLockStateValue = ReturnType<typeof useEthLock>;

const EthLockStateContext = createContext<EthLockStateValue | null>(null);

export function EthLockStateProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const value = useEthLock(wallet.address);

  return (
    <EthLockStateContext.Provider value={value}>
      {children}
    </EthLockStateContext.Provider>
  );
}

export function useEthLockState(): EthLockStateValue {
  const context = useContext(EthLockStateContext);

  if (!context) {
    throw new Error('useEthLockState must be used within an EthLockStateProvider.');
  }

  return context;
}

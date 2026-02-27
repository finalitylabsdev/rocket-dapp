import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  type InventoryPart,
} from '../types/domain';
import {
  EFFECTIVE_DAILY_CLAIM_FLUX,
  FAUCET_INTERVAL_SECONDS,
  FAUCET_INTERVAL_MS,
  WHITELIST_BONUS_FLUX,
} from '../config/spec';
import {
  adjustFluxBalance,
  claimFluxFromFaucet,
  formatFluxError,
  syncFluxBalance,
  type FluxBalance,
} from '../lib/flux';
import { formatStarVaultError, getUserInventory } from '../lib/starVault';
import { supabase } from '../lib/supabase';
import { useWallet } from '../hooks/useWallet';

export type { InventoryPart, RarityTier, RocketSection } from '../types/domain';

interface ServerSnapshot {
  balance?: FluxBalance | null;
  inventory?: InventoryPart[];
}

interface GameState {
  fluxBalance: number;
  inventory: InventoryPart[];
  lastDailyClaim: number | null;
  isFluxSyncing: boolean;
  isClaimingFlux: boolean;
  isInventorySyncing: boolean;
  refreshFluxBalance: () => Promise<void>;
  claimDailyFlux: () => Promise<boolean>;
  spendFlux: (amount: number, reason?: string, payload?: Record<string, unknown>) => Promise<boolean>;
  creditFlux: (amount: number, reason?: string, payload?: Record<string, unknown>) => Promise<boolean>;
  addPart: (part: InventoryPart) => void;
  replaceInventory: (inventory: InventoryPart[]) => void;
  refreshInventory: () => Promise<void>;
  applyServerSnapshot: (snapshot: ServerSnapshot) => void;
}

const defaults = {
  fluxBalance: 0,
  inventory: [] as InventoryPart[],
  lastDailyClaim: null as number | null,
};

// ETH lock truth now lives in EthLockState/useEthLock so shell and feature gates share one source.

function clearServerBackedState<T extends typeof defaults>(state: T): T {
  return {
    ...state,
    fluxBalance: 0,
    inventory: [],
    lastDailyClaim: null,
  };
}

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [state, setState] = useState({ ...defaults });
  const [isFluxSyncing, setIsFluxSyncing] = useState(false);
  const [isClaimingFlux, setIsClaimingFlux] = useState(false);
  const [isInventorySyncing, setIsInventorySyncing] = useState(false);

  const applyRemoteFluxBalance = useCallback((nextBalance: FluxBalance) => {
    setState((current) => ({
      ...current,
      fluxBalance: nextBalance.availableBalance,
      lastDailyClaim: nextBalance.lastFaucetClaimedAt
        ? new Date(nextBalance.lastFaucetClaimedAt).getTime()
        : null,
    }));
  }, []);

  const replaceInventory = useCallback((inventory: InventoryPart[]) => {
    setState((current) => ({
      ...current,
      inventory,
    }));
  }, []);

  const applyServerSnapshot = useCallback((snapshot: ServerSnapshot) => {
    if (snapshot.balance) {
      applyRemoteFluxBalance(snapshot.balance);
    }

    if (snapshot.inventory) {
      replaceInventory(snapshot.inventory);
    }
  }, [applyRemoteFluxBalance, replaceInventory]);

  const refreshFluxBalance = useCallback(async () => {
    if (!wallet.address) {
      setIsFluxSyncing(false);
      return;
    }

    setIsFluxSyncing(true);

    try {
      const balance = await syncFluxBalance(wallet.address, WHITELIST_BONUS_FLUX);
      applyRemoteFluxBalance(balance);
    } catch (error) {
      console.error('Failed to refresh FLUX balance:', formatFluxError(error, 'Failed to refresh FLUX balance.'));
    } finally {
      setIsFluxSyncing(false);
    }
  }, [applyRemoteFluxBalance, wallet.address]);

  const refreshInventory = useCallback(async () => {
    if (!wallet.address) {
      setIsInventorySyncing(false);
      replaceInventory([]);
      return;
    }

    setIsInventorySyncing(true);

    try {
      const inventory = await getUserInventory(wallet.address);
      replaceInventory(inventory);
    } catch (error) {
      console.error('Failed to refresh inventory:', formatStarVaultError(error, 'Failed to refresh inventory.'));
    } finally {
      setIsInventorySyncing(false);
    }
  }, [replaceInventory, wallet.address]);

  useEffect(() => {
    if (!wallet.address) {
      setIsFluxSyncing(false);
      setIsClaimingFlux(false);
      setIsInventorySyncing(false);
      setState((current) => clearServerBackedState(current));
      return;
    }

    setState((current) => clearServerBackedState(current));
    void Promise.all([
      refreshFluxBalance(),
      refreshInventory(),
    ]);
  }, [refreshFluxBalance, refreshInventory, wallet.address]);

  useEffect(() => {
    const supabaseClient = supabase;

    if (!wallet.address || !supabaseClient) {
      return;
    }

    const channel = supabaseClient
      .channel('inventory-parts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_parts' },
        () => {
          void refreshInventory();
        },
      )
      .subscribe((status, error) => {
        if (status === 'SUBSCRIBED') {
          void refreshInventory();
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Inventory realtime subscription degraded:', error?.message ?? status);
          void refreshInventory();
          return;
        }

        if (status === 'CLOSED') {
          console.warn('Inventory realtime subscription closed. Falling back to manual refresh until it reconnects.');
        }
      });

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [refreshInventory, wallet.address]);

  const claimDailyFlux = useCallback(async () => {
    if (!wallet.address || isClaimingFlux) {
      return false;
    }

    const now = Date.now();
    if (state.lastDailyClaim && now - state.lastDailyClaim < FAUCET_INTERVAL_MS) {
      return false;
    }

    setIsClaimingFlux(true);

    try {
      const balance = await claimFluxFromFaucet(
        wallet.address,
        EFFECTIVE_DAILY_CLAIM_FLUX,
        FAUCET_INTERVAL_SECONDS,
        WHITELIST_BONUS_FLUX,
      );
      applyRemoteFluxBalance(balance);
      return true;
    } catch (error) {
      console.error('Failed to claim FLUX:', formatFluxError(error, 'Failed to claim FLUX.'));
      return false;
    } finally {
      setIsClaimingFlux(false);
    }
  }, [applyRemoteFluxBalance, isClaimingFlux, state.lastDailyClaim, wallet.address]);

  const mutateFluxBalance = useCallback(async (
    delta: number,
    reason: string,
    payload: Record<string, unknown> = {},
  ) => {
    if (delta === 0) {
      return true;
    }

    if (delta < 0 && state.fluxBalance < Math.abs(delta)) {
      return false;
    }

    if (!wallet.address) {
      return false;
    }

    try {
      const balance = await adjustFluxBalance(
        wallet.address,
        delta,
        reason,
        payload,
        WHITELIST_BONUS_FLUX,
      );
      applyRemoteFluxBalance(balance);
      return true;
    } catch (error) {
      console.error('Failed to update FLUX balance:', formatFluxError(error, 'Failed to update FLUX balance.'));
      return false;
    }
  }, [applyRemoteFluxBalance, state.fluxBalance, wallet.address]);

  const spendFlux = useCallback(async (
    amount: number,
    reason = 'flux_spend',
    payload: Record<string, unknown> = {},
  ) => mutateFluxBalance(
    -amount,
    reason,
    { ...payload, amount_flux: amount },
  ), [mutateFluxBalance]);

  const creditFlux = useCallback(async (
    amount: number,
    reason = 'flux_credit',
    payload: Record<string, unknown> = {},
  ) => mutateFluxBalance(
    amount,
    reason,
    { ...payload, amount_flux: amount },
  ), [mutateFluxBalance]);

  const addPart = useCallback((part: InventoryPart) => {
    setState((current) => ({
      ...current,
      inventory: [part, ...current.inventory],
    }));
  }, []);

  return (
    <GameStateContext.Provider
      value={{
        ...state,
        isFluxSyncing,
        isClaimingFlux,
        isInventorySyncing,
        refreshFluxBalance,
        claimDailyFlux,
        spendFlux,
        creditFlux,
        addPart,
        replaceInventory,
        refreshInventory,
        applyServerSnapshot,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return ctx;
}

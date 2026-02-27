import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ALL_PART_SLOTS,
  ROCKET_SECTIONS,
  type InventoryPart,
  type PartSlot,
  type RocketSection,
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

export type { InventoryPart, PartSlot, RarityTier, RocketSection } from '../types/domain';

interface ServerSnapshot {
  balance?: FluxBalance | null;
  inventory?: InventoryPart[];
}

interface GameState {
  fluxBalance: number;
  inventory: InventoryPart[];
  equipped: Record<PartSlot, InventoryPart | null>;
  canonicalEquipped: Record<RocketSection, InventoryPart | null>;
  levels: Record<PartSlot, number>;
  scores: number[];
  lockedEth: boolean;
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
  equipPart: (slot: PartSlot, part: InventoryPart) => void;
  unequipPart: (slot: PartSlot) => void;
  upgradePart: (slot: PartSlot) => Promise<boolean>;
  recordScore: (score: number) => void;
}

const STORAGE_KEY = 'phinet-game-state';

interface StoredGameState {
  equipped: Record<PartSlot, InventoryPart | null>;
  levels: Record<PartSlot, number>;
  scores: number[];
}

const equippedDefaults = Object.fromEntries(
  ALL_PART_SLOTS.map((slot) => [slot, null]),
) as Record<PartSlot, InventoryPart | null>;

const levelDefaults = Object.fromEntries(
  ALL_PART_SLOTS.map((slot) => [slot, 1]),
) as Record<PartSlot, number>;

const canonicalDefaults = Object.fromEntries(
  ROCKET_SECTIONS.map((section) => [section, null]),
) as Record<RocketSection, InventoryPart | null>;

const defaults = {
  fluxBalance: 0,
  inventory: [] as InventoryPart[],
  equipped: equippedDefaults,
  levels: levelDefaults,
  scores: [] as number[],
  lockedEth: false,
  lastDailyClaim: null as number | null,
};

function deriveCanonicalEquipped(
  equipped: Record<PartSlot, InventoryPart | null>,
): Record<RocketSection, InventoryPart | null> {
  const canonical = { ...canonicalDefaults };

  for (const section of ROCKET_SECTIONS) {
    canonical[section] = equipped[section];
  }

  return canonical;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        equipped: { ...equippedDefaults },
        levels: { ...levelDefaults },
        scores: [],
      };
    }

    const parsed = JSON.parse(raw) as Partial<StoredGameState>;
    return {
      equipped: { ...equippedDefaults, ...(parsed.equipped || {}) },
      levels: { ...levelDefaults, ...(parsed.levels || {}) },
      scores: Array.isArray(parsed.scores) ? parsed.scores : [],
    };
  } catch {
    return {
      equipped: { ...equippedDefaults },
      levels: { ...levelDefaults },
      scores: [],
    };
  }
}

function clearServerBackedState<T extends typeof defaults>(state: T): T {
  return {
    ...state,
    fluxBalance: 0,
    inventory: [],
    lockedEth: false,
    lastDailyClaim: null,
    equipped: { ...equippedDefaults },
  };
}

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const persistedState = useMemo(load, []);
  const [state, setState] = useState({
    ...defaults,
    equipped: persistedState.equipped,
    levels: persistedState.levels,
    scores: persistedState.scores,
  });
  const [isFluxSyncing, setIsFluxSyncing] = useState(false);
  const [isClaimingFlux, setIsClaimingFlux] = useState(false);
  const [isInventorySyncing, setIsInventorySyncing] = useState(false);
  const persistedEquipped = state.equipped;
  const persistedLevels = state.levels;
  const persistedScores = state.scores;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      equipped: persistedEquipped,
      levels: persistedLevels,
      scores: persistedScores,
    }));
  }, [persistedEquipped, persistedLevels, persistedScores]);

  const applyRemoteFluxBalance = useCallback((nextBalance: FluxBalance) => {
    setState((current) => ({
      ...current,
      fluxBalance: nextBalance.availableBalance,
      lastDailyClaim: nextBalance.lastFaucetClaimedAt
        ? new Date(nextBalance.lastFaucetClaimedAt).getTime()
        : null,
      lockedEth: nextBalance.whitelistBonusGrantedAt !== null,
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void refreshInventory();
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

  const equipPart = useCallback((slot: PartSlot, part: InventoryPart) => {
    setState((current) => ({
      ...current,
      equipped: { ...current.equipped, [slot]: part },
    }));
  }, []);

  const unequipPart = useCallback((slot: PartSlot) => {
    setState((current) => ({
      ...current,
      equipped: { ...current.equipped, [slot]: null },
    }));
  }, []);

  const upgradePart = useCallback(async (slot: PartSlot) => {
    if (state.levels[slot] >= 3) {
      return false;
    }

    const cost = 20 + state.levels[slot] * 15;
    const didSpend = await spendFlux(
      cost,
      'legacy_part_upgrade',
      {
        slot,
        next_level: state.levels[slot] + 1,
      },
    );

    if (!didSpend) {
      return false;
    }

    setState((current) => ({
      ...current,
      levels: { ...current.levels, [slot]: current.levels[slot] + 1 },
    }));
    return true;
  }, [spendFlux, state.levels]);

  const recordScore = useCallback((score: number) => {
    setState((current) => ({
      ...current,
      scores: [...current.scores, score],
    }));
  }, []);

  const canonicalEquipped = useMemo(
    () => deriveCanonicalEquipped(state.equipped),
    [state.equipped],
  );

  return (
    <GameStateContext.Provider
      value={{
        ...state,
        canonicalEquipped,
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
        equipPart,
        unequipPart,
        upgradePart,
        recordScore,
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

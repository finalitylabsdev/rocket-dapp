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
  LEGACY_PART_SLOTS,
  LEGACY_TO_CANONICAL_SECTION,
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
import { adjustFluxBalance, claimFluxFromFaucet, formatFluxError, syncFluxBalance } from '../lib/flux';
import { useWallet } from '../hooks/useWallet';

export type { InventoryPart, PartSlot, RarityTier, RocketSection } from '../types/domain';

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
  refreshFluxBalance: () => Promise<void>;
  claimDailyFlux: () => Promise<boolean>;
  spendFlux: (amount: number, reason?: string, payload?: Record<string, unknown>) => Promise<boolean>;
  creditFlux: (amount: number, reason?: string, payload?: Record<string, unknown>) => Promise<boolean>;
  addPart: (part: InventoryPart) => void;
  equipPart: (slot: PartSlot, part: InventoryPart) => void;
  unequipPart: (slot: PartSlot) => void;
  upgradePart: (slot: PartSlot) => Promise<boolean>;
  recordScore: (score: number) => void;
}

const STORAGE_KEY = 'phinet-game-state';

interface StoredGameState {
  fluxBalance: number;
  inventory: InventoryPart[];
  equipped: Record<PartSlot, InventoryPart | null>;
  levels: Record<PartSlot, number>;
  scores: number[];
  lockedEth: boolean;
  lastDailyClaim: number | null;
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

const defaults: StoredGameState = {
  fluxBalance: 0,
  inventory: [],
  equipped: equippedDefaults,
  levels: levelDefaults,
  scores: [],
  lockedEth: false,
  lastDailyClaim: null,
};

function deriveCanonicalEquipped(
  equipped: Record<PartSlot, InventoryPart | null>,
): Record<RocketSection, InventoryPart | null> {
  const canonical = { ...canonicalDefaults };

  for (const section of ROCKET_SECTIONS) {
    canonical[section] = equipped[section];
  }

  for (const legacySlot of LEGACY_PART_SLOTS) {
    const legacyPart = equipped[legacySlot];
    const mappedSection = LEGACY_TO_CANONICAL_SECTION[legacySlot];
    if (!canonical[mappedSection] && legacyPart) {
      canonical[mappedSection] = legacyPart;
    }
  }

  return canonical;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...defaults,
        equipped: { ...equippedDefaults },
        levels: { ...levelDefaults },
      };
    }
    const parsed = JSON.parse(raw) as Partial<StoredGameState>;
    return {
      ...defaults,
      ...parsed,
      equipped: { ...equippedDefaults, ...(parsed.equipped || {}) },
      levels: { ...levelDefaults, ...(parsed.levels || {}) },
    };
  } catch {
    return {
      ...defaults,
      equipped: { ...equippedDefaults },
      levels: { ...levelDefaults },
    };
  }
}

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const [state, setState] = useState(load);
  const [isFluxSyncing, setIsFluxSyncing] = useState(false);
  const [isClaimingFlux, setIsClaimingFlux] = useState(false);

  useEffect(() => {
    const { fluxBalance, inventory, equipped, levels, scores, lockedEth, lastDailyClaim } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fluxBalance, inventory, equipped, levels, scores, lockedEth, lastDailyClaim }));
  }, [state]);

  const applyRemoteFluxBalance = useCallback((nextBalance: {
    availableBalance: number;
    lastFaucetClaimedAt: string | null;
    whitelistBonusGrantedAt: string | null;
  }) => {
    setState((s) => ({
      ...s,
      fluxBalance: nextBalance.availableBalance,
      lastDailyClaim: nextBalance.lastFaucetClaimedAt
        ? new Date(nextBalance.lastFaucetClaimedAt).getTime()
        : null,
      lockedEth: nextBalance.whitelistBonusGrantedAt !== null,
    }));
  }, []);

  const refreshFluxBalance = useCallback(async () => {
    if (!wallet.address) {
      return;
    }

    setIsFluxSyncing(true);

    try {
      const balance = await syncFluxBalance(wallet.address, WHITELIST_BONUS_FLUX);
      applyRemoteFluxBalance(balance);
    } catch (error) {
      console.error('Failed to refresh Flux balance:', formatFluxError(error, 'Failed to refresh Flux balance.'));
    } finally {
      setIsFluxSyncing(false);
    }
  }, [applyRemoteFluxBalance, wallet.address]);

  useEffect(() => {
    if (!wallet.address) {
      setIsFluxSyncing(false);
      setIsClaimingFlux(false);
      setState((s) => ({
        ...s,
        fluxBalance: 0,
        lockedEth: false,
        lastDailyClaim: null,
      }));
      return;
    }

    void refreshFluxBalance();
  }, [refreshFluxBalance, wallet.address]);

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
      console.error('Failed to claim Flux:', formatFluxError(error, 'Failed to claim Flux.'));
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
      console.error('Failed to update Flux balance:', formatFluxError(error, 'Failed to update Flux balance.'));
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

  const addPart = (part: InventoryPart) => setState(s => ({ ...s, inventory: [...s.inventory, part] }));

  const equipPart = (slot: PartSlot, part: InventoryPart) => setState(s => ({
    ...s,
    equipped: { ...s.equipped, [slot]: part },
    inventory: s.inventory.filter(p => p.id !== part.id),
  }));

  const unequipPart = (slot: PartSlot) => setState(s => {
    const part = s.equipped[slot];
    if (!part) return s;
    return { ...s, equipped: { ...s.equipped, [slot]: null }, inventory: [...s.inventory, part] };
  });

  const upgradePart = async (slot: PartSlot) => {
    if (state.levels[slot] >= 3) return false;
    const cost = 20 + state.levels[slot] * 15;
    const didSpend = await spendFlux(
      cost,
      'legacy_part_upgrade',
      {
        slot,
        next_level: state.levels[slot] + 1,
      },
    );
    if (!didSpend) return false;
    setState(s => ({ ...s, levels: { ...s.levels, [slot]: s.levels[slot] + 1 } }));
    return true;
  };

  const recordScore = (score: number) => setState(s => ({ ...s, scores: [...s.scores, score] }));

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
        refreshFluxBalance,
        claimDailyFlux,
        spendFlux,
        creditFlux,
        addPart,
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
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}

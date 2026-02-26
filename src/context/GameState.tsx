import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
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
  FAUCET_INTERVAL_MS,
  WHITELIST_BONUS_FLUX,
} from '../config/spec';

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
  lockEth: () => void;
  claimDailyFlux: () => boolean;
  spendFlux: (amount: number) => boolean;
  addPart: (part: InventoryPart) => void;
  equipPart: (slot: PartSlot, part: InventoryPart) => void;
  unequipPart: (slot: PartSlot) => void;
  upgradePart: (slot: PartSlot) => boolean;
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
  const [state, setState] = useState(load);

  useEffect(() => {
    const { fluxBalance, inventory, equipped, levels, scores, lockedEth, lastDailyClaim } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fluxBalance, inventory, equipped, levels, scores, lockedEth, lastDailyClaim }));
  }, [state]);

  const lockEth = () => setState((s) => {
    if (s.lockedEth) return s;
    return {
      ...s,
      lockedEth: true,
      fluxBalance: s.fluxBalance + WHITELIST_BONUS_FLUX,
    };
  });

  const claimDailyFlux = () => {
    const now = Date.now();
    if (state.lastDailyClaim && now - state.lastDailyClaim < FAUCET_INTERVAL_MS) return false;
    setState((s) => ({
      ...s,
      fluxBalance: s.fluxBalance + EFFECTIVE_DAILY_CLAIM_FLUX,
      lastDailyClaim: now,
    }));
    return true;
  };

  const spendFlux = (amount: number) => {
    if (state.fluxBalance < amount) return false;
    setState(s => ({ ...s, fluxBalance: s.fluxBalance - amount }));
    return true;
  };

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

  const upgradePart = (slot: PartSlot) => {
    if (state.levels[slot] >= 3) return false;
    const cost = 20 + state.levels[slot] * 15;
    if (state.fluxBalance < cost) return false;
    setState(s => ({ ...s, levels: { ...s.levels, [slot]: s.levels[slot] + 1 }, fluxBalance: s.fluxBalance - cost }));
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
        lockEth,
        claimDailyFlux,
        spendFlux,
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

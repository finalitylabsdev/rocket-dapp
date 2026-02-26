import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type PartSlot = 'engine' | 'fuel' | 'body' | 'wings' | 'booster';
export type RarityTier = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface InventoryPart {
  id: string;
  name: string;
  slot: PartSlot;
  rarity: RarityTier;
  power: number;
}

interface GameState {
  fluxBalance: number;
  inventory: InventoryPart[];
  equipped: Record<PartSlot, InventoryPart | null>;
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

const STORAGE_KEY = 'enet-game-state';
const DAY_MS = 24 * 60 * 60 * 1000;

const defaults = {
  fluxBalance: 0,
  inventory: [] as InventoryPart[],
  equipped: { engine: null, fuel: null, body: null, wings: null, booster: null } as Record<PartSlot, InventoryPart | null>,
  levels: { engine: 1, fuel: 1, body: 1, wings: 1, booster: 1 } as Record<PartSlot, number>,
  scores: [] as number[],
  lockedEth: false,
  lastDailyClaim: null as number | null,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults, equipped: { ...defaults.equipped }, levels: { ...defaults.levels } };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults, equipped: { ...defaults.equipped }, levels: { ...defaults.levels } };
  }
}

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    const { fluxBalance, inventory, equipped, levels, scores, lockedEth, lastDailyClaim } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ fluxBalance, inventory, equipped, levels, scores, lockedEth, lastDailyClaim }));
  }, [state]);

  const lockEth = () => setState(s => s.lockedEth ? s : { ...s, lockedEth: true, fluxBalance: s.fluxBalance + 100 });

  const claimDailyFlux = () => {
    const now = Date.now();
    if (state.lastDailyClaim && now - state.lastDailyClaim < DAY_MS) return false;
    setState(s => ({ ...s, fluxBalance: s.fluxBalance + 10, lastDailyClaim: now }));
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

  return (
    <GameStateContext.Provider value={{ ...state, lockEth, claimDailyFlux, spendFlux, addPart, equipPart, unequipPart, upgradePart, recordScore }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}

import type { MouseEvent } from 'react';
import {
  CLICK_DENIED_TITLE,
  PREVIEW_ALLOW_AUCTION_BID,
  PREVIEW_ALLOW_AUCTION_SUBMIT,
  PREVIEW_ALLOW_BOX_OPEN,
  PREVIEW_ALLOW_GATE_CLAIM,
  PREVIEW_ALLOW_GATE_LOCK,
  PREVIEW_ALLOW_ROCKET_EQUIP,
  PREVIEW_ALLOW_ROCKET_LAUNCH,
  PREVIEW_ALLOW_ROCKET_REPAIR,
  PREVIEW_ALLOW_ROCKET_UNEQUIP,
  PREVIEW_ALLOW_ANON_AUCTION_VIEW,
  PREVIEW_READ_ONLY_ENABLED,
  PREVIEW_SAMPLE_BOX_REVEALS_ENABLED,
  PREVIEW_SAMPLE_FLUX_BALANCE,
  PREVIEW_SAMPLE_INVENTORY_ENABLED,
  PREVIEW_SAMPLE_LAUNCH_HISTORY_ENABLED,
} from '../config/flags';
import type { InventoryPart, RarityTier, RocketSection } from '../types/domain';
import type { RocketLaunchHistoryEntry } from './rocketLab';

export type PreviewMutationAction =
  | 'gateLock'
  | 'gateClaim'
  | 'boxOpen'
  | 'auctionSubmit'
  | 'auctionBid'
  | 'rocketEquip'
  | 'rocketUnequip'
  | 'rocketRepair'
  | 'rocketLaunch';

const PREVIEW_MUTATION_FLAGS: Record<PreviewMutationAction, boolean> = {
  gateLock: PREVIEW_ALLOW_GATE_LOCK,
  gateClaim: PREVIEW_ALLOW_GATE_CLAIM,
  boxOpen: PREVIEW_ALLOW_BOX_OPEN,
  auctionSubmit: PREVIEW_ALLOW_AUCTION_SUBMIT,
  auctionBid: PREVIEW_ALLOW_AUCTION_BID,
  rocketEquip: PREVIEW_ALLOW_ROCKET_EQUIP,
  rocketUnequip: PREVIEW_ALLOW_ROCKET_UNEQUIP,
  rocketRepair: PREVIEW_ALLOW_ROCKET_REPAIR,
  rocketLaunch: PREVIEW_ALLOW_ROCKET_LAUNCH,
};

const SECTION_LABELS: Record<RocketSection, string> = {
  coreEngine: 'Core Engine',
  wingPlate: 'Wing Plate',
  fuelCell: 'Fuel Cell',
  navigationModule: 'Navigation Module',
  payloadBay: 'Payload Bay',
  thrusterArray: 'Thruster Array',
  propulsionCables: 'Propulsion Cables',
  shielding: 'Shielding',
};

const SECTION_ATTRIBUTE_NAMES: Record<RocketSection, [string, string, string]> = {
  coreEngine: ['THRUST', 'HEAT', 'STABILITY'],
  wingPlate: ['LIFT', 'BALANCE', 'DRAG'],
  fuelCell: ['CAPACITY', 'FLOW', 'STABILITY'],
  navigationModule: ['TARGETING', 'CONTROL', 'SYNC'],
  payloadBay: ['CAPACITY', 'SHIELD', 'YIELD'],
  thrusterArray: ['BOOST', 'VECTOR', 'CONTROL'],
  propulsionCables: ['THROUGHPUT', 'INTEGRITY', 'EFFICIENCY'],
  shielding: ['DENSITY', 'RESIST', 'ABSORB'],
};

const RARITY_LEVELS: Record<RarityTier, number> = {
  Common: 1,
  Uncommon: 2,
  Rare: 3,
  Epic: 4,
  Legendary: 5,
  Mythic: 6,
  Celestial: 7,
  Quantum: 8,
};

function createPreviewPart({
  id,
  name,
  slot,
  rarity,
  power,
  attributes,
  partValue,
  conditionPct = 100,
  serialNumber,
  serialTrait,
  isShiny = false,
  isEquipped = false,
  createdAt,
}: {
  id: string;
  name: string;
  slot: RocketSection;
  rarity: RarityTier;
  power: number;
  attributes: [number, number, number];
  partValue: number;
  conditionPct?: number;
  serialNumber: number;
  serialTrait: string;
  isShiny?: boolean;
  isEquipped?: boolean;
  createdAt: string;
}): InventoryPart {
  return {
    id,
    variantId: RARITY_LEVELS[rarity],
    variantIndex: RARITY_LEVELS[rarity],
    name,
    slot,
    equippedSectionKey: isEquipped ? slot : undefined,
    rarity,
    power,
    totalPower: power,
    attributes,
    attributeNames: SECTION_ATTRIBUTE_NAMES[slot],
    partValue,
    conditionPct,
    serialNumber,
    serialTrait,
    isShiny,
    sectionName: SECTION_LABELS[slot],
    rarityTierId: RARITY_LEVELS[rarity],
    isLocked: false,
    isEquipped,
    source: 'mystery_box',
    createdAt,
    illustration: {
      key: slot,
      alt: `${SECTION_LABELS[slot]} preview asset`,
    },
  };
}

export const PREVIEW_SAMPLE_INVENTORY: InventoryPart[] = [
  createPreviewPart({
    id: 'preview-core-engine-a',
    name: 'Singularity Drive',
    slot: 'coreEngine',
    rarity: 'Quantum',
    power: 740,
    attributes: [94, 91, 88],
    partValue: 440,
    serialNumber: 240011,
    serialTrait: 'Prime',
    isShiny: true,
    isEquipped: true,
    createdAt: '2026-02-24T20:10:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-wing-plate-a',
    name: 'Aurora Wing Plate',
    slot: 'wingPlate',
    rarity: 'Celestial',
    power: 575,
    attributes: [89, 84, 81],
    partValue: 315,
    serialNumber: 240027,
    serialTrait: 'Glide',
    isEquipped: true,
    createdAt: '2026-02-24T20:12:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-fuel-cell-a',
    name: 'Darkmatter Cell',
    slot: 'fuelCell',
    rarity: 'Mythic',
    power: 520,
    attributes: [87, 86, 79],
    partValue: 282,
    serialNumber: 240043,
    serialTrait: 'Dense',
    isEquipped: true,
    createdAt: '2026-02-24T20:14:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-navigation-a',
    name: 'Event Horizon Nav',
    slot: 'navigationModule',
    rarity: 'Legendary',
    power: 468,
    attributes: [82, 85, 80],
    partValue: 248,
    serialNumber: 240061,
    serialTrait: 'Vector',
    isEquipped: true,
    createdAt: '2026-02-24T20:16:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-payload-a',
    name: 'Orbital Cargo Bay',
    slot: 'payloadBay',
    rarity: 'Epic',
    power: 436,
    attributes: [80, 77, 78],
    partValue: 226,
    serialNumber: 240079,
    serialTrait: 'Yield',
    isEquipped: true,
    createdAt: '2026-02-24T20:18:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-thruster-a',
    name: 'Nova Thruster Ring',
    slot: 'thrusterArray',
    rarity: 'Legendary',
    power: 452,
    attributes: [84, 78, 75],
    partValue: 234,
    serialNumber: 240094,
    serialTrait: 'Burst',
    isEquipped: true,
    createdAt: '2026-02-24T20:20:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-cables-a',
    name: 'Photon Loom Cables',
    slot: 'propulsionCables',
    rarity: 'Rare',
    power: 364,
    attributes: [71, 76, 73],
    partValue: 182,
    serialNumber: 240112,
    serialTrait: 'Braided',
    isEquipped: true,
    createdAt: '2026-02-24T20:22:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-shielding-a',
    name: 'Halo Shield Mantle',
    slot: 'shielding',
    rarity: 'Epic',
    power: 418,
    attributes: [79, 83, 77],
    partValue: 214,
    serialNumber: 240129,
    serialTrait: 'Bastion',
    isEquipped: true,
    createdAt: '2026-02-24T20:24:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-payload-b',
    name: 'Nebula Crate Lattice',
    slot: 'payloadBay',
    rarity: 'Rare',
    power: 342,
    attributes: [72, 69, 74],
    partValue: 164,
    serialNumber: 240203,
    serialTrait: 'Vaulted',
    createdAt: '2026-02-26T18:40:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-wing-plate-b',
    name: 'Solar Flare Fin',
    slot: 'wingPlate',
    rarity: 'Epic',
    power: 388,
    attributes: [76, 81, 70],
    partValue: 196,
    conditionPct: 84,
    serialNumber: 240244,
    serialTrait: 'Crosswind',
    createdAt: '2026-02-27T09:05:00.000Z',
  }),
];

export const PREVIEW_BOX_REVEALS: InventoryPart[] = PREVIEW_SAMPLE_BOX_REVEALS_ENABLED
  ? [
      PREVIEW_SAMPLE_INVENTORY[8],
      PREVIEW_SAMPLE_INVENTORY[9],
    ]
  : [];

export const PREVIEW_SAMPLE_LAUNCH_HISTORY: RocketLaunchHistoryEntry[] = [
  {
    launchId: 9013,
    totalPower: 3973,
    fuelCostFlux: 104.14,
    meteoriteDamagePct: 3,
    scoreBreakdown: {
      base: 2810,
      luck: 420,
      randomness: 109,
      total: 3339,
    },
    damageReport: [],
    createdAt: '2026-02-27T22:18:00.000Z',
  },
  {
    launchId: 9012,
    totalPower: 3908,
    fuelCostFlux: 103.76,
    meteoriteDamagePct: 4,
    scoreBreakdown: {
      base: 2764,
      luck: 365,
      randomness: 154,
      total: 3283,
    },
    damageReport: [],
    createdAt: '2026-02-27T19:44:00.000Z',
  },
  {
    launchId: 9011,
    totalPower: 3856,
    fuelCostFlux: 102.95,
    meteoriteDamagePct: 5,
    scoreBreakdown: {
      base: 2728,
      luck: 342,
      randomness: 121,
      total: 3191,
    },
    damageReport: [],
    createdAt: '2026-02-27T16:03:00.000Z',
  },
];

export function isPreviewMutationAllowed(action: PreviewMutationAction): boolean {
  return PREVIEW_MUTATION_FLAGS[action];
}

export function getPreviewActionButtonProps(
  action: PreviewMutationAction,
  disabledWhenAllowed = false,
) {
  const allowed = isPreviewMutationAllowed(action);

  return {
    isAllowed: allowed,
    disabled: allowed ? disabledWhenAllowed : false,
    'aria-disabled': !allowed || disabledWhenAllowed,
    title: !allowed ? CLICK_DENIED_TITLE : undefined,
    'data-click-denied': (!allowed ? 'true' : undefined) as 'true' | undefined,
  };
}

export function runPreviewGuardedAction(
  action: PreviewMutationAction,
  onAllowed: () => void,
) {
  return (event: MouseEvent<HTMLElement>) => {
    if (!isPreviewMutationAllowed(action)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onAllowed();
  };
}

export function getPreviewInventory(liveInventory: InventoryPart[]): InventoryPart[] {
  return PREVIEW_SAMPLE_INVENTORY_ENABLED ? PREVIEW_SAMPLE_INVENTORY : liveInventory;
}

export function getPreviewLaunchHistory(liveHistory: RocketLaunchHistoryEntry[]): RocketLaunchHistoryEntry[] {
  return PREVIEW_SAMPLE_LAUNCH_HISTORY_ENABLED ? PREVIEW_SAMPLE_LAUNCH_HISTORY : liveHistory;
}

export function getPreviewFluxBalance(liveBalance: number): number {
  if (!PREVIEW_READ_ONLY_ENABLED) {
    return liveBalance;
  }

  return Math.max(liveBalance, PREVIEW_SAMPLE_FLUX_BALANCE);
}

export function shouldAllowAnonymousAuctionView(walletAddress: string | null): boolean {
  return Boolean(walletAddress) || PREVIEW_ALLOW_ANON_AUCTION_VIEW;
}

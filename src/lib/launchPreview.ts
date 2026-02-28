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
    power: 312,
    attributes: [41, 23, 38],
    partValue: 185,
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
    power: 244,
    attributes: [37, 20, 32],
    partValue: 132,
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
    power: 218,
    attributes: [39, 16, 28],
    partValue: 118,
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
    power: 196,
    attributes: [26, 39, 17],
    partValue: 104,
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
    power: 183,
    attributes: [39, 14, 30],
    partValue: 95,
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
    power: 190,
    attributes: [40, 18, 24],
    partValue: 98,
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
    power: 153,
    attributes: [18, 37, 11],
    partValue: 76,
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
    power: 175,
    attributes: [35, 32, 14],
    partValue: 90,
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
    power: 144,
    attributes: [29, 9, 34],
    partValue: 69,
    serialNumber: 240203,
    serialTrait: 'Vaulted',
    createdAt: '2026-02-26T18:40:00.000Z',
  }),
  createPreviewPart({
    id: 'preview-wing-plate-b',
    name: 'Solar Flare Fin',
    slot: 'wingPlate',
    rarity: 'Epic',
    power: 163,
    attributes: [32, 12, 27],
    partValue: 82,
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
    totalPower: 1671,
    fuelCostFlux: 43.78,
    meteoriteDamagePct: 3,
    scoreBreakdown: {
      base: 1182,
      luck: 176,
      randomness: 46,
      total: 1404,
    },
    damageReport: [],
    createdAt: '2026-02-27T22:18:00.000Z',
  },
  {
    launchId: 9012,
    totalPower: 1643,
    fuelCostFlux: 43.58,
    meteoriteDamagePct: 4,
    scoreBreakdown: {
      base: 1161,
      luck: 153,
      randomness: 65,
      total: 1379,
    },
    damageReport: [],
    createdAt: '2026-02-27T19:44:00.000Z',
  },
  {
    launchId: 9011,
    totalPower: 1621,
    fuelCostFlux: 43.24,
    meteoriteDamagePct: 5,
    scoreBreakdown: {
      base: 1146,
      luck: 144,
      randomness: 51,
      total: 1341,
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

import { ROCKET_SECTIONS, type InventoryPart, type RocketSection } from '../../types/domain';
import { estimateFuelCost, getEffectivePartPower, getPartConditionPct } from '../../lib/rocketLab';

export type RocketLabSlotStatus = 'equipped' | 'available' | 'empty';

interface RocketLabSlotMeta {
  displayName: string;
  description: string;
}

export interface RocketLabSlotView {
  section: RocketSection;
  displayName: string;
  description: string;
  status: RocketLabSlotStatus;
  equippedPart: InventoryPart | null;
  ownedParts: InventoryPart[];
  lockedCount: number;
  brokenCount: number;
  equipableCount: number;
}

export type RocketLabSlots = Record<RocketSection, RocketLabSlotView>;

export interface RocketLabMetrics {
  equippedSlots: number;
  totalSlots: number;
  availableSlots: number;
  emptySlots: number;
  blockedSlots: number;
  damagedEquippedSlots: number;
  averageCondition: number;
  totalPower: number;
  fuelCost: number;
  canLaunch: boolean;
}

const SLOT_META: Record<RocketSection, RocketLabSlotMeta> = {
  coreEngine: {
    displayName: 'Core Engine',
    description: 'Primary burn chamber and main lift.',
  },
  wingPlate: {
    displayName: 'Wing Plate',
    description: 'Keeps the frame stable through ascent.',
  },
  fuelCell: {
    displayName: 'Fuel Cell',
    description: 'Stores propellant for sustained thrust.',
  },
  navigationModule: {
    displayName: 'Navigation Module',
    description: 'Steers the climb and correction path.',
  },
  payloadBay: {
    displayName: 'Payload Bay',
    description: 'Carries mission mass and flight trim.',
  },
  thrusterArray: {
    displayName: 'Thruster Array',
    description: 'Handles vectoring and orbital adjustments.',
  },
  propulsionCables: {
    displayName: 'Propulsion Cables',
    description: 'Routes power and control signals aft.',
  },
  shielding: {
    displayName: 'Shielding',
    description: 'Absorbs heat, debris, and frame stress.',
  },
};

function canEquipPart(part: InventoryPart) {
  return !part.isLocked && getPartConditionPct(part) > 0;
}

function getPartRank(part: InventoryPart) {
  const createdAt = part.createdAt ? Date.parse(part.createdAt) : 0;
  const createdAtScore = Number.isFinite(createdAt) ? createdAt / 1_000_000_000 : 0;
  const equippedBoost = part.isEquipped ? 100_000 : 0;
  const usableBoost = canEquipPart(part) ? 10_000 : 0;

  return equippedBoost
    + usableBoost
    + (getPartConditionPct(part) * 100)
    + (getEffectivePartPower(part) * 80)
    + (part.partValue * 3)
    + (part.rarityTierId * 120)
    + createdAtScore;
}

function sortParts(parts: InventoryPart[]) {
  return [...parts].sort((left, right) => getPartRank(right) - getPartRank(left));
}

function getEquippedPart(parts: InventoryPart[], section: RocketSection) {
  return parts.find((part) => {
    if (!part.isEquipped) {
      return false;
    }

    if (part.equippedSectionKey) {
      return part.equippedSectionKey === section;
    }

    return part.slot === section;
  }) ?? null;
}

export function buildRocketLabSlots(inventory: InventoryPart[]): RocketLabSlots {
  const slots = {} as RocketLabSlots;

  for (const section of ROCKET_SECTIONS) {
    const ownedParts = sortParts(inventory.filter((part) => part.slot === section));
    const equippedPart = getEquippedPart(ownedParts, section);
    const lockedCount = ownedParts.filter((part) => part.isLocked).length;
    const brokenCount = ownedParts.filter((part) => getPartConditionPct(part) <= 0).length;
    const equipableCount = ownedParts.filter((part) => !part.isEquipped && canEquipPart(part)).length;
    const status: RocketLabSlotStatus = equippedPart
      ? 'equipped'
      : ownedParts.length > 0
        ? 'available'
        : 'empty';

    slots[section] = {
      section,
      displayName: SLOT_META[section].displayName,
      description: SLOT_META[section].description,
      status,
      equippedPart,
      ownedParts,
      lockedCount,
      brokenCount,
      equipableCount,
    };
  }

  return slots;
}

export function getEquippedRocketParts(slots: RocketLabSlots): InventoryPart[] {
  return ROCKET_SECTIONS
    .map((section) => slots[section].equippedPart)
    .filter((part): part is InventoryPart => part !== null);
}

export function computeRocketLabMetrics(slots: RocketLabSlots): RocketLabMetrics {
  const equippedParts = getEquippedRocketParts(slots);
  const equippedSlots = equippedParts.length;
  const totalSlots = ROCKET_SECTIONS.length;
  const availableSlots = ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].status === 'available' ? 1 : 0),
    0,
  );
  const emptySlots = ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].status === 'empty' ? 1 : 0),
    0,
  );
  const blockedSlots = ROCKET_SECTIONS.reduce((count, section) => {
    const slot = slots[section];
    if (slot.status === 'empty' || slot.equippedPart || slot.equipableCount > 0) {
      return count;
    }

    return count + 1;
  }, 0);
  const damagedEquippedSlots = equippedParts.reduce(
    (count, part) => count + (getPartConditionPct(part) < 100 ? 1 : 0),
    0,
  );
  const averageCondition = equippedParts.length > 0
    ? Math.round(
      equippedParts.reduce((sum, part) => sum + getPartConditionPct(part), 0) / equippedParts.length,
    )
    : 0;
  const totalPower = equippedParts.reduce((sum, part) => sum + getEffectivePartPower(part), 0);
  const fuelCost = estimateFuelCost(equippedParts);
  const canLaunch = equippedSlots === totalSlots && equippedParts.every((part) => canEquipPart(part));

  return {
    equippedSlots,
    totalSlots,
    availableSlots,
    emptySlots,
    blockedSlots,
    damagedEquippedSlots,
    averageCondition,
    totalPower,
    fuelCost,
    canLaunch,
  };
}

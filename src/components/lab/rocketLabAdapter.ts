import { ROCKET_SECTIONS, type InventoryPart, type RocketSection } from '../../types/domain';
import { ROCKET_MODELS, type RocketModelId } from './RocketModels';

export type RocketLabSlotStatus = 'ready' | 'locked' | 'missing' | 'unassigned';

interface RocketLabSlotMeta {
  displayName: string;
  description: string;
}

export interface RocketLabSlotView {
  section: RocketSection;
  displayName: string;
  description: string;
  status: RocketLabSlotStatus;
  part: InventoryPart | null;
  availableParts: InventoryPart[];
  availableCount: number;
  lockedCount: number;
}

export type RocketLabSlots = Record<RocketSection, RocketLabSlotView>;

export interface RocketLabMetrics {
  readySlots: number;
  totalSlots: number;
  lockedSlots: number;
  unassignedSlots: number;
  missingSlots: number;
  completionRatio: number;
  stability: number;
  fuelEfficiency: number;
  launchPower: number;
  gravScoreBase: number;
  winProbability: number;
  canLaunch: boolean;
}

export interface RocketLabSimulationResult {
  score: number;
  bonus: string;
  multiplier: string;
  power: number;
}

const SLOT_META: Record<RocketSection, RocketLabSlotMeta> = {
  coreEngine: {
    displayName: 'Core Engine',
    description: 'Primary thrust source.',
  },
  wingPlate: {
    displayName: 'Wing Plate',
    description: 'Stability and atmospheric control.',
  },
  fuelCell: {
    displayName: 'Fuel Cell',
    description: 'Feed system for sustained burn.',
  },
  navigationModule: {
    displayName: 'Navigation Module',
    description: 'Flight path and guidance logic.',
  },
  payloadBay: {
    displayName: 'Payload Bay',
    description: 'Mission capacity and balance.',
  },
  thrusterArray: {
    displayName: 'Thruster Array',
    description: 'Secondary maneuvering thrust.',
  },
  propulsionCables: {
    displayName: 'Propulsion Cables',
    description: 'Power routing and signal integrity.',
  },
  shielding: {
    displayName: 'Shielding',
    description: 'Structural protection under load.',
  },
};

const SIMULATION_EVENTS = [
  { bonus: 'Clear corridor: no turbulence penalties', scoreModifier: 0.1, powerModifier: 6 },
  { bonus: 'Solar crosswind: minor stability drag', scoreModifier: -0.08, powerModifier: -4 },
  { bonus: 'Micrometeor scrape: shielding absorbs the hit', scoreModifier: -0.12, powerModifier: -7 },
  { bonus: 'Gravity sling: efficient burn window detected', scoreModifier: 0.15, powerModifier: 8 },
  { bonus: 'Telemetry echo: navigation recalibration delay', scoreModifier: -0.05, powerModifier: -3 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPartRank(part: InventoryPart) {
  const createdAt = part.createdAt ? Date.parse(part.createdAt) : 0;
  const createdAtScore = Number.isFinite(createdAt) ? createdAt / 1_000_000_000 : 0;
  return (part.power * 100) + (part.partValue * 3) + (part.rarityTierId * 120) + createdAtScore;
}

function getBestPart(parts: InventoryPart[]) {
  const sorted = [...parts].sort((left, right) => getPartRank(right) - getPartRank(left));
  return sorted[0] ?? null;
}

function sortPartsByRank(parts: InventoryPart[]) {
  return [...parts].sort((left, right) => getPartRank(right) - getPartRank(left));
}

function getSectionPower(slots: RocketLabSlots, section: RocketSection) {
  return slots[section].status === 'ready' ? slots[section].part?.power ?? 0 : 0;
}

function getSectionValue(slots: RocketLabSlots, section: RocketSection) {
  return slots[section].status === 'ready' ? slots[section].part?.partValue ?? 0 : 0;
}

function getAverageSectionPower(slots: RocketLabSlots, sections: RocketSection[]) {
  const total = sections.reduce((sum, section) => sum + getSectionPower(slots, section), 0);
  return total / sections.length;
}

export function buildRocketLabSlots(inventory: InventoryPart[]): RocketLabSlots {
  const slots = {} as RocketLabSlots;

  for (const section of ROCKET_SECTIONS) {
    const owned = inventory.filter((part) => part.slot === section);
    const available = sortPartsByRank(owned.filter((part) => !part.isLocked));
    const locked = sortPartsByRank(owned.filter((part) => part.isLocked));
    const equippedReadyPart = available.find((part) => part.isEquipped) ?? null;
    const equippedLockedPart = locked.find((part) => part.isEquipped) ?? null;
    const selectedPart = equippedReadyPart
      ?? equippedLockedPart
      ?? (available.length === 0 ? getBestPart(locked) : null);
    const status: RocketLabSlotStatus = equippedReadyPart
      ? 'ready'
      : equippedLockedPart || (available.length === 0 && locked.length > 0)
        ? 'locked'
        : available.length > 0
          ? 'unassigned'
          : 'missing';

    slots[section] = {
      section,
      displayName: selectedPart?.sectionName ?? SLOT_META[section].displayName,
      description: SLOT_META[section].description,
      status,
      part: selectedPart,
      availableParts: available,
      availableCount: available.length,
      lockedCount: locked.length,
    };
  }

  return slots;
}

export function countReadySlots(slots: RocketLabSlots) {
  return ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].status === 'ready' ? 1 : 0),
    0,
  );
}

export function computeRocketLabMetrics(
  slots: RocketLabSlots,
  model: RocketModelId,
): RocketLabMetrics {
  const modelDef = ROCKET_MODELS.find((entry) => entry.id === model) ?? ROCKET_MODELS[0];
  const readySlots = countReadySlots(slots);
  const totalSlots = ROCKET_SECTIONS.length;
  const lockedSlots = ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].status === 'locked' ? 1 : 0),
    0,
  );
  const unassignedSlots = ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].status === 'unassigned' ? 1 : 0),
    0,
  );
  const missingSlots = ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].status === 'missing' ? 1 : 0),
    0,
  );
  const completionRatio = readySlots / totalSlots;

  const readyParts = ROCKET_SECTIONS
    .map((section) => slots[section])
    .filter((slot) => slot.status === 'ready')
    .map((slot) => slot.part)
    .filter((part): part is InventoryPart => part !== null);

  const averagePower = readyParts.reduce((sum, part) => sum + part.power, 0) / (readyParts.length || 1);
  const averageRarity = readyParts.reduce((sum, part) => sum + part.rarityTierId, 0) / (readyParts.length || 1);
  const totalValue = readyParts.reduce((sum, part) => sum + part.partValue, 0);

  const stability = clamp(Math.round(
    (getAverageSectionPower(slots, ['wingPlate', 'navigationModule', 'shielding', 'propulsionCables']) * 0.72) +
    (completionRatio * 28) +
    modelDef.bonuses.stabilityBonus,
  ), 0, 100);

  const fuelEfficiency = clamp(Math.round(
    (getAverageSectionPower(slots, ['fuelCell', 'payloadBay', 'propulsionCables', 'coreEngine']) * 0.7) +
    (completionRatio * 24) +
    modelDef.bonuses.fuelBonus,
  ), 0, 100);

  const launchPower = clamp(Math.round(
    (getSectionPower(slots, 'coreEngine') * 0.34) +
    (getSectionPower(slots, 'thrusterArray') * 0.28) +
    (getSectionPower(slots, 'fuelCell') * 0.18) +
    (getSectionPower(slots, 'payloadBay') * 0.1) +
    (getSectionPower(slots, 'propulsionCables') * 0.1) +
    modelDef.bonuses.powerBonus,
  ), 0, 100);

  const gravScoreBase = Math.round(
    (readyParts.reduce((sum, part) => sum + part.power, 0) * (1 + completionRatio)) +
    (totalValue * 0.18) +
    (averageRarity * 45) +
    (getSectionValue(slots, 'payloadBay') * 0.2),
  );

  const winProbability = clamp(Math.round(
    (completionRatio * 48) +
    (averagePower * 0.3) +
    (averageRarity * 3) +
    (stability * 0.12) +
    (fuelEfficiency * 0.08) +
    (readySlots === totalSlots ? 8 : 0) +
    modelDef.bonuses.winBonus,
  ), 0, 96);

  return {
    readySlots,
    totalSlots,
    lockedSlots,
    unassignedSlots,
    missingSlots,
    completionRatio,
    stability,
    fuelEfficiency,
    launchPower,
    gravScoreBase,
    winProbability,
    canLaunch: readySlots === totalSlots,
  };
}

export function simulateRocketLabLaunch(
  slots: RocketLabSlots,
  model: RocketModelId,
): RocketLabSimulationResult {
  const metrics = computeRocketLabMetrics(slots, model);
  const event = SIMULATION_EVENTS[Math.floor(Math.random() * SIMULATION_EVENTS.length)];
  const baseMultiplier = 1 + (metrics.winProbability / 140) + (metrics.launchPower / 220);
  const score = Math.round(metrics.gravScoreBase * baseMultiplier * (1 + event.scoreModifier));
  const power = clamp(metrics.launchPower + event.powerModifier, 0, 100);

  return {
    score: Math.max(0, score),
    bonus: event.bonus,
    multiplier: (baseMultiplier * (1 + event.scoreModifier)).toFixed(2),
    power,
  };
}

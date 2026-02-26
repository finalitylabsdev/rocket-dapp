export type RocketModelId = 'standard' | 'heavy' | 'scout';

export interface RocketModel {
  id: RocketModelId;
  name: string;
  tagline: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  bonuses: {
    stabilityBonus: number;
    fuelBonus: number;
    powerBonus: number;
    winBonus: number;
  };
}

export const ROCKET_MODELS: RocketModel[] = [
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Balanced build',
    accentColor: '#94A3B8',
    accentBg: 'rgba(148,163,184,0.12)',
    accentBorder: 'rgba(148,163,184,0.3)',
    bonuses: { stabilityBonus: 0, fuelBonus: 0, powerBonus: 0, winBonus: 0 },
  },
  {
    id: 'heavy',
    name: 'Heavy Lifter',
    tagline: '+Power, -Speed',
    accentColor: '#F59E0B',
    accentBg: 'rgba(245,158,11,0.12)',
    accentBorder: 'rgba(245,158,11,0.3)',
    bonuses: { stabilityBonus: 12, fuelBonus: -8, powerBonus: 20, winBonus: 5 },
  },
  {
    id: 'scout',
    name: 'Scout',
    tagline: '+Speed, -Payload',
    accentColor: '#06D6A0',
    accentBg: 'rgba(6,214,160,0.12)',
    accentBorder: 'rgba(6,214,160,0.3)',
    bonuses: { stabilityBonus: -5, fuelBonus: 15, powerBonus: -5, winBonus: 8 },
  },
];

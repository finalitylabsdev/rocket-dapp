import { useSyncExternalStore } from 'react';
import type { RarityTier, RarityTierConfig } from '../../types/domain';

export type { RarityTier } from '../../types/domain';

export interface RarityConfig {
  tier: RarityTier;
  color: string;
  bg: string;
  border: string;
  glow: string;
  label: string;
  multiplier: number;
  baseBoxPriceFlux: number;
  approximateDropRate: number;
  intensity: number;
}

const NEUTRAL_RARITY: RarityConfig = {
  tier: 'Common',
  color: '#6B7280',
  bg: 'rgba(107,114,128,0.12)',
  border: 'rgba(107,114,128,0.3)',
  glow: 'rgba(107,114,128,0)',
  label: 'Loading...',
  multiplier: 1,
  baseBoxPriceFlux: 0,
  approximateDropRate: 0,
  intensity: 0,
};

let rarityConfigLoaded = false;

export const RARITY_CONFIG: Partial<Record<RarityTier, RarityConfig>> = {};

const listeners = new Set<() => void>();
let rarityConfigVersion = 0;

function notifyConfigListeners() {
  rarityConfigVersion += 1;
  listeners.forEach((listener) => listener());
}

export function setRarityConfig(tiers: RarityTierConfig[]) {
  const nextConfig: Partial<Record<RarityTier, RarityConfig>> = {};

  tiers.forEach((tier) => {
    nextConfig[tier.name] = {
      tier: tier.name,
      color: tier.color,
      bg: tier.bg,
      border: tier.border,
      glow: tier.glow,
      label: tier.name,
      multiplier: tier.multiplier,
      baseBoxPriceFlux: tier.baseBoxPriceFlux,
      approximateDropRate: tier.approximateDropRate,
      intensity: tier.intensity,
    };
  });

  for (const key of Object.keys(RARITY_CONFIG) as RarityTier[]) {
    delete RARITY_CONFIG[key];
  }
  for (const [key, value] of Object.entries(nextConfig) as [RarityTier, RarityConfig][]) {
    RARITY_CONFIG[key] = value;
  }

  rarityConfigLoaded = true;
  notifyConfigListeners();
}

export function resetRarityConfig() {
  for (const key of Object.keys(RARITY_CONFIG) as RarityTier[]) {
    delete RARITY_CONFIG[key];
  }
  rarityConfigLoaded = false;
  notifyConfigListeners();
}

export function getRarityConfig(tier: RarityTier): RarityConfig {
  if (!rarityConfigLoaded) return NEUTRAL_RARITY;
  return RARITY_CONFIG[tier] ?? NEUTRAL_RARITY;
}

function subscribeToRarityConfig(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useRarityConfigVersion() {
  return useSyncExternalStore(
    subscribeToRarityConfig,
    () => rarityConfigVersion,
    () => rarityConfigVersion,
  );
}

type GemShapeRenderer = (color: string, size: number) => React.JSX.Element;

const GEM_SHAPES: Record<string, GemShapeRenderer> = {
  Common: (color, s) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4" fill={color} fillOpacity="0.7" />
    </svg>
  ),
  Uncommon: (color, s) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <polygon points="6,1 10.5,6 6,11 1.5,6" fill={color} fillOpacity="0.45" stroke={color} strokeWidth="0.8" />
    </svg>
  ),
  Rare: (color, s) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <polygon points="6,1 10,3.5 10,8.5 6,11 2,8.5 2,3.5" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="0.8" />
      <line x1="6" y1="1" x2="6" y2="11" stroke={color} strokeWidth="0.5" strokeOpacity="0.5" />
    </svg>
  ),
  Epic: (color, s) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <polygon points="6,0.7 9.8,2.2 11.3,6 9.8,9.8 6,11.3 2.2,9.8 0.7,6 2.2,2.2" fill={color} fillOpacity="0.45" stroke={color} strokeWidth="0.8" />
      <circle cx="6" cy="6" r="1.7" fill={color} fillOpacity="0.7" />
    </svg>
  ),
  Legendary: (color, s) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <polygon points="6,0.5 7.4,4.3 11.5,4.3 8.2,6.8 9.4,11 6,8.5 2.6,11 3.8,6.8 0.5,4.3 4.6,4.3" fill={color} fillOpacity="0.7" />
    </svg>
  ),
  Mythic: (color, s) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <path d="M6 1.2C4.6 2.6 3.6 4 3.6 6c0 2 1.5 3.7 2.4 4.8C6.9 9.7 8.4 8 8.4 6c0-2-1-3.4-2.4-4.8Z" fill={color} fillOpacity="0.65" stroke={color} strokeWidth="0.6" />
      <circle cx="6" cy="7.1" r="1.5" fill={color} />
    </svg>
  ),
  Celestial: (color, s) => (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke={color} strokeWidth="0.9" />
      <circle cx="6" cy="6" r="2.2" fill={color} fillOpacity="0.45" />
      <path d="M1.5 6h9M6 1.5v9" stroke={color} strokeWidth="0.6" strokeOpacity="0.6" />
    </svg>
  ),
  Quantum: (_color, s) => {
    const uncommonCfg = getRarityConfig('Uncommon');
    const rareCfg = getRarityConfig('Rare');
    const epicCfg = getRarityConfig('Epic');
    const legendaryCfg = getRarityConfig('Legendary');
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
        <defs>
          <linearGradient id="quantum-prism" x1="0" y1="0" x2="12" y2="12">
            <stop offset="0%" stopColor={uncommonCfg.color} />
            <stop offset="35%" stopColor={rareCfg.color} />
            <stop offset="70%" stopColor={epicCfg.color} />
            <stop offset="100%" stopColor={legendaryCfg.color} />
          </linearGradient>
        </defs>
        <polygon points="6,0.8 10.8,3.6 10.8,8.4 6,11.2 1.2,8.4 1.2,3.6" fill="url(#quantum-prism)" fillOpacity="0.7" stroke="#E8ECF4" strokeWidth="0.65" />
      </svg>
    );
  },
};

function GemIcon({ tier, size = 12 }: { tier: RarityTier; size?: number }) {
  const cfg = getRarityConfig(tier);
  const renderer = GEM_SHAPES[tier];
  if (!renderer) return null;
  return renderer(cfg.color, size);
}

interface RarityBadgeProps {
  tier: RarityTier;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export default function RarityBadge({ tier, showIcon = true, size = 'sm', className = '' }: RarityBadgeProps) {
  useRarityConfigVersion();
  const cfg = getRarityConfig(tier);
  const textSize = size === 'xs' ? 'text-[9px]' : size === 'sm' ? 'text-[10px]' : 'text-xs';
  const px = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-0.5';
  const iconSize = size === 'xs' ? 9 : size === 'sm' ? 11 : 13;

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold font-mono uppercase tracking-wider ${textSize} ${px} ${className}`}
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {showIcon && <GemIcon tier={tier} size={iconSize} />}
      {cfg.label}
    </span>
  );
}

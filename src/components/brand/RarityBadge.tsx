import { useSyncExternalStore } from 'react';
import { RARITY_BOX_PRICE_FLUX, RARITY_MULTIPLIER } from '../../config/spec';
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

function buildFallbackConfig(): Record<RarityTier, RarityConfig> {
  return {
    Common: {
      tier: 'Common',
      color: '#6B7280',
      bg: 'rgba(107,114,128,0.12)',
      border: 'rgba(107,114,128,0.3)',
      glow: 'rgba(107,114,128,0)',
      label: 'Common',
      multiplier: RARITY_MULTIPLIER.Common,
      baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Common,
      approximateDropRate: 35,
      intensity: 0,
    },
    Uncommon: {
      tier: 'Uncommon',
      color: '#22C55E',
      bg: 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.3)',
      glow: 'rgba(34,197,94,0.15)',
      label: 'Uncommon',
      multiplier: RARITY_MULTIPLIER.Uncommon,
      baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Uncommon,
      approximateDropRate: 25,
      intensity: 1,
    },
    Rare: {
      tier: 'Rare',
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.12)',
      border: 'rgba(59,130,246,0.35)',
      glow: 'rgba(59,130,246,0.22)',
      label: 'Rare',
      multiplier: RARITY_MULTIPLIER.Rare,
      baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Rare,
      approximateDropRate: 18,
      intensity: 2,
    },
    Epic: {
      tier: 'Epic',
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.12)',
      border: 'rgba(139,92,246,0.35)',
      glow: 'rgba(139,92,246,0.25)',
      label: 'Epic',
      multiplier: RARITY_MULTIPLIER.Epic,
      baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Epic,
      approximateDropRate: 10,
      intensity: 3,
    },
    Legendary: {
      tier: 'Legendary',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.4)',
      glow: 'rgba(245,158,11,0.3)',
      label: 'Legendary',
      multiplier: RARITY_MULTIPLIER.Legendary,
      baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Legendary,
      approximateDropRate: 6,
      intensity: 4,
    },
    Mythic: {
      tier: 'Mythic',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.42)',
      glow: 'rgba(239,68,68,0.35)',
      label: 'Mythic',
      multiplier: RARITY_MULTIPLIER.Mythic,
      baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Mythic,
      approximateDropRate: 3.5,
      intensity: 5,
    },
    Celestial: {
      tier: 'Celestial',
      color: '#06B6D4',
      bg: 'rgba(6,182,212,0.12)',
      border: 'rgba(6,182,212,0.4)',
      glow: 'rgba(6,182,212,0.32)',
      label: 'Celestial',
      multiplier: RARITY_MULTIPLIER.Celestial,
      baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Celestial,
      approximateDropRate: 1.8,
      intensity: 6,
    },
    Quantum: {
      tier: 'Quantum',
      color: '#E8ECF4',
      bg: 'rgba(232,236,244,0.1)',
      border: 'rgba(232,236,244,0.42)',
      glow: 'rgba(232,236,244,0.35)',
      label: 'Quantum',
      multiplier: RARITY_MULTIPLIER.Quantum,
      baseBoxPriceFlux: RARITY_BOX_PRICE_FLUX.Quantum,
      approximateDropRate: 0.7,
      intensity: 7,
    },
  };
}

const FALLBACK_RARITY_CONFIG = buildFallbackConfig();

export const RARITY_CONFIG: Record<RarityTier, RarityConfig> = {
  Common: { ...FALLBACK_RARITY_CONFIG.Common },
  Uncommon: { ...FALLBACK_RARITY_CONFIG.Uncommon },
  Rare: { ...FALLBACK_RARITY_CONFIG.Rare },
  Epic: { ...FALLBACK_RARITY_CONFIG.Epic },
  Legendary: { ...FALLBACK_RARITY_CONFIG.Legendary },
  Mythic: { ...FALLBACK_RARITY_CONFIG.Mythic },
  Celestial: { ...FALLBACK_RARITY_CONFIG.Celestial },
  Quantum: { ...FALLBACK_RARITY_CONFIG.Quantum },
};

const listeners = new Set<() => void>();
let rarityConfigVersion = 0;

function notifyConfigListeners() {
  rarityConfigVersion += 1;
  listeners.forEach((listener) => listener());
}

function syncExportedConfig(nextConfig: Record<RarityTier, RarityConfig>) {
  (Object.keys(RARITY_CONFIG) as RarityTier[]).forEach((tier) => {
    RARITY_CONFIG[tier] = nextConfig[tier];
  });
}

export function applyRarityConfigOverrides(overrides: RarityTierConfig[]) {
  const nextConfig = buildFallbackConfig();

  overrides.forEach((override) => {
    if (!(override.name in nextConfig)) {
      return;
    }

    nextConfig[override.name] = {
      tier: override.name,
      color: override.color,
      bg: override.bg,
      border: override.border,
      glow: override.glow,
      label: override.name,
      multiplier: override.multiplier,
      baseBoxPriceFlux: override.baseBoxPriceFlux,
      approximateDropRate: override.approximateDropRate,
      intensity: override.intensity,
    };
  });

  syncExportedConfig(nextConfig);
  notifyConfigListeners();
}

export function resetRarityConfigOverrides() {
  syncExportedConfig(buildFallbackConfig());
  notifyConfigListeners();
}

export function getRarityConfig(tier: RarityTier): RarityConfig {
  return RARITY_CONFIG[tier];
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

function GemIcon({ tier, size = 12 }: { tier: RarityTier; size?: number }) {
  const { color } = RARITY_CONFIG[tier];
  const s = size;

  switch (tier) {
    case 'Common':
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4" fill={color} fillOpacity="0.7" />
        </svg>
      );
    case 'Uncommon':
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
          <polygon points="6,1 10.5,6 6,11 1.5,6" fill={color} fillOpacity="0.45" stroke={color} strokeWidth="0.8" />
        </svg>
      );
    case 'Rare':
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
          <polygon points="6,1 10,3.5 10,8.5 6,11 2,8.5 2,3.5" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="0.8" />
          <line x1="6" y1="1" x2="6" y2="11" stroke={color} strokeWidth="0.5" strokeOpacity="0.5" />
        </svg>
      );
    case 'Epic':
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
          <polygon points="6,0.7 9.8,2.2 11.3,6 9.8,9.8 6,11.3 2.2,9.8 0.7,6 2.2,2.2" fill={color} fillOpacity="0.45" stroke={color} strokeWidth="0.8" />
          <circle cx="6" cy="6" r="1.7" fill={color} fillOpacity="0.7" />
        </svg>
      );
    case 'Legendary':
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
          <polygon points="6,0.5 7.4,4.3 11.5,4.3 8.2,6.8 9.4,11 6,8.5 2.6,11 3.8,6.8 0.5,4.3 4.6,4.3" fill={color} fillOpacity="0.7" />
        </svg>
      );
    case 'Mythic':
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
          <path d="M6 1.2C4.6 2.6 3.6 4 3.6 6c0 2 1.5 3.7 2.4 4.8C6.9 9.7 8.4 8 8.4 6c0-2-1-3.4-2.4-4.8Z" fill={color} fillOpacity="0.65" stroke={color} strokeWidth="0.6" />
          <circle cx="6" cy="7.1" r="1.5" fill={color} />
        </svg>
      );
    case 'Celestial':
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke={color} strokeWidth="0.9" />
          <circle cx="6" cy="6" r="2.2" fill={color} fillOpacity="0.45" />
          <path d="M1.5 6h9M6 1.5v9" stroke={color} strokeWidth="0.6" strokeOpacity="0.6" />
        </svg>
      );
    case 'Quantum':
      return (
        <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
          <defs>
            <linearGradient id="quantum-prism" x1="0" y1="0" x2="12" y2="12">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="35%" stopColor="#3B82F6" />
              <stop offset="70%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <polygon points="6,0.8 10.8,3.6 10.8,8.4 6,11.2 1.2,8.4 1.2,3.6" fill="url(#quantum-prism)" fillOpacity="0.7" stroke="#E8ECF4" strokeWidth="0.65" />
        </svg>
      );
    default:
      return null;
  }
}

interface RarityBadgeProps {
  tier: RarityTier;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export default function RarityBadge({ tier, showIcon = true, size = 'sm', className = '' }: RarityBadgeProps) {
  useRarityConfigVersion();
  const cfg = RARITY_CONFIG[tier];
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

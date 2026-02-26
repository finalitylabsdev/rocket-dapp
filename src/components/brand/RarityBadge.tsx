export type RarityTier = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Celestial' | 'Quantum';

export interface RarityConfig {
  tier: RarityTier;
  color: string;
  bg: string;
  border: string;
  glow: string;
  label: string;
  intensity: number;
}

export const RARITY_CONFIG: Record<RarityTier, RarityConfig> = {
  Common:    { tier: 'Common',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)',  glow: 'rgba(107,114,128,0)',    label: 'Common',    intensity: 0 },
  Uncommon:  { tier: 'Uncommon',  color: '#22C55E', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.3)',    glow: 'rgba(34,197,94,0.15)',   label: 'Uncommon',  intensity: 1 },
  Rare:      { tier: 'Rare',      color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  glow: 'rgba(59,130,246,0.2)',   label: 'Rare',      intensity: 2 },
  Epic:      { tier: 'Epic',      color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)',  glow: 'rgba(139,92,246,0.25)',  label: 'Epic',      intensity: 3 },
  Legendary: { tier: 'Legendary', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)',   glow: 'rgba(245,158,11,0.3)',   label: 'Legendary', intensity: 4 },
  Mythic:    { tier: 'Mythic',    color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.4)',    glow: 'rgba(239,68,68,0.3)',    label: 'Mythic',    intensity: 5 },
  Celestial: { tier: 'Celestial', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.4)',    glow: 'rgba(6,182,212,0.3)',    label: 'Celestial', intensity: 6 },
  Quantum:   { tier: 'Quantum',   color: '#E8ECF4', bg: 'rgba(232,236,244,0.08)',border: 'rgba(232,236,244,0.25)', glow: 'rgba(232,236,244,0.15)', label: 'Quantum',   intensity: 7 },
};

function GemIcon({ tier, size = 12 }: { tier: RarityTier; size?: number }) {
  const { color } = RARITY_CONFIG[tier];
  const s = size;

  if (tier === 'Common') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="4" fill={color} fillOpacity="0.7" />
      </svg>
    );
  }
  if (tier === 'Uncommon') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
        <polygon points="6,1 10,5 10,9 6,11 2,9 2,5" fill={color} fillOpacity="0.6" stroke={color} strokeWidth="0.5" />
      </svg>
    );
  }
  if (tier === 'Rare') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
        <polygon points="6,1 10,4.5 10,8 6,11 2,8 2,4.5" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="0.8" />
        <line x1="6" y1="1" x2="6" y2="11" stroke={color} strokeWidth="0.5" strokeOpacity="0.5" />
        <line x1="2" y1="4.5" x2="10" y2="4.5" stroke={color} strokeWidth="0.5" strokeOpacity="0.5" />
      </svg>
    );
  }
  if (tier === 'Epic') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
        <polygon points="6,0.5 11,3.5 11,8.5 6,11.5 1,8.5 1,3.5" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.8" />
        <circle cx="6" cy="6" r="2.5" fill={color} fillOpacity="0.6" />
      </svg>
    );
  }
  if (tier === 'Legendary') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
        <polygon points="6,0 7.5,4.5 12,4.5 8.5,7.5 10,12 6,9 2,12 3.5,7.5 0,4.5 4.5,4.5" fill={color} fillOpacity="0.7" />
        <circle cx="6" cy="6" r="1.5" fill={color} />
      </svg>
    );
  }
  if (tier === 'Mythic') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
        <polygon points="6,0.5 11,3.5 11,8.5 6,11.5 1,8.5 1,3.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
        <polygon points="6,2 9.5,4 9.5,8 6,10 2.5,8 2.5,4" fill={color} fillOpacity="0.5" />
        <circle cx="6" cy="6" r="1.8" fill={color} fillOpacity="0.9" />
      </svg>
    );
  }
  if (tier === 'Celestial') {
    return (
      <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
        <polygon points="6,0.5 11,3.5 11,8.5 6,11.5 1,8.5 1,3.5" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="0.8" />
        <line x1="6" y1="0.5" x2="6" y2="11.5" stroke={color} strokeWidth="0.6" strokeOpacity="0.6" />
        <line x1="1" y1="3.5" x2="11" y2="8.5" stroke={color} strokeWidth="0.6" strokeOpacity="0.6" />
        <line x1="1" y1="8.5" x2="11" y2="3.5" stroke={color} strokeWidth="0.6" strokeOpacity="0.6" />
        <circle cx="6" cy="6" r="2" fill={color} fillOpacity="0.7" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <polygon points="6,0 8,4 12,4 9,7.5 10,12 6,9.5 2,12 3,7.5 0,4 4,4" fill="url(#qGrad)" />
      <defs>
        <linearGradient id="qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="33%" stopColor="#8B5CF6" />
          <stop offset="66%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface RarityBadgeProps {
  tier: RarityTier;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export default function RarityBadge({ tier, showIcon = true, size = 'sm', className = '' }: RarityBadgeProps) {
  const cfg = RARITY_CONFIG[tier];
  const textSize = size === 'xs' ? 'text-[9px]' : size === 'sm' ? 'text-[10px]' : 'text-xs';
  const px = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-0.5';
  const iconSize = size === 'xs' ? 9 : size === 'sm' ? 11 : 13;

  const isAnimated = cfg.intensity >= 5;

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full ${textSize} ${px} ${className}`}
      style={{
        background: cfg.bg,
        color: tier === 'Quantum' ? undefined : cfg.color,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.intensity >= 2 ? `0 0 6px ${cfg.glow}` : undefined,
        animation: isAnimated ? 'rarityPulse 2s ease-in-out infinite' : undefined,
      }}
    >
      {tier === 'Quantum' ? (
        <span className="text-gradient-quantum">{cfg.label}</span>
      ) : (
        <>
          {showIcon && <GemIcon tier={tier} size={iconSize} />}
          {cfg.label}
        </>
      )}
    </span>
  );
}

export function RarityGlow({ tier, children, className = '' }: { tier: RarityTier; children: React.ReactNode; className?: string }) {
  const cfg = RARITY_CONFIG[tier];
  return (
    <div
      className={`relative ${className}`}
      style={cfg.intensity >= 2 ? {
        filter: `drop-shadow(0 0 ${4 + cfg.intensity * 3}px ${cfg.glow.replace('0.', '0.').replace(',0)', `,${0.3 + cfg.intensity * 0.1})`)}`,
      } : undefined}
    >
      {children}
    </div>
  );
}

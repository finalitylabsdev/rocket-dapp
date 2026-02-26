export type RarityTier = 'Common' | 'Rare' | 'Epic' | 'Legendary';

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
  Rare:      { tier: 'Rare',      color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  glow: 'rgba(59,130,246,0.2)',   label: 'Rare',      intensity: 2 },
  Epic:      { tier: 'Epic',      color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)',  glow: 'rgba(139,92,246,0.25)',  label: 'Epic',      intensity: 3 },
  Legendary: { tier: 'Legendary', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)',   glow: 'rgba(245,158,11,0.3)',   label: 'Legendary', intensity: 4 },
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
  return (
    <svg width={s} height={s} viewBox="0 0 12 12" fill="none">
      <polygon points="6,0 7.5,4.5 12,4.5 8.5,7.5 10,12 6,9 2,12 3.5,7.5 0,4.5 4.5,4.5" fill={color} fillOpacity="0.7" />
      <circle cx="6" cy="6" r="1.5" fill={color} />
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

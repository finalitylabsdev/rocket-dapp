import PhiSymbol from '../brand/PhiSymbol';
import { getRarityConfig, type RarityTier } from '../brand/RarityBadge';

export type BoxAnimationState = 'idle' | 'shaking' | 'cracking' | 'revealed';

interface BoxIllustrationProps {
  rarity: RarityTier;
  state: BoxAnimationState;
}

export default function BoxIllustration({ rarity, state }: BoxIllustrationProps) {
  const cfg = getRarityConfig(rarity);
  const isShaking = state === 'shaking';
  const isCracking = state === 'cracking';
  const isRevealed = state === 'revealed';

  return (
    <div className="relative h-28 w-28 flex items-center justify-center">
      {isRevealed && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
            animation: 'sparkBurst 650ms ease-out',
          }}
        />
      )}

      <div
        className="relative h-24 w-24 flex items-center justify-center overflow-hidden"
        style={{
          background: cfg.bg,
          border: `2px solid ${isRevealed ? cfg.color : cfg.border}`,
          boxShadow: isRevealed ? `0 0 28px ${cfg.glow}` : 'none',
          animation: isShaking ? 'boxShake 420ms ease-in-out forwards' : 'none',
          transform: isRevealed ? 'scale(1.06)' : 'scale(1)',
        }}
      >
        <div
          className="absolute inset-y-0 left-0 w-1/2"
          style={{
            background: `linear-gradient(135deg, ${cfg.bg}, transparent)`,
            animation: isCracking ? 'boxCrack 380ms ease-in forwards' : 'none',
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2"
          style={{
            background: `linear-gradient(225deg, ${cfg.bg}, transparent)`,
            animation: isCracking ? 'boxCrackRight 380ms ease-in forwards' : 'none',
          }}
        />
        <div
          className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2"
          style={{
            background: cfg.color,
            opacity: isCracking || isRevealed ? 1 : 0,
            animation: isCracking ? 'seam 180ms ease-out forwards' : 'none',
          }}
        />
        <PhiSymbol size={38} color={isRevealed ? cfg.color : `${cfg.color}99`} />
      </div>
    </div>
  );
}

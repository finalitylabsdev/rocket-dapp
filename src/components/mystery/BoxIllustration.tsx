import { getRarityConfig, type RarityTier } from '../brand/RarityBadge';
import type { AssetReference } from '../../types/domain';
import { getBoxVisualRecipe } from './visualRecipes';
import LootBoxArt from './LootBoxArt';

export type BoxAnimationState = 'idle' | 'shaking' | 'cracking' | 'revealed';

interface BoxIllustrationProps {
  rarity: RarityTier;
  state: BoxAnimationState;
  asset?: AssetReference | null;
  fallbackKey?: string;
  label?: string;
}

export default function BoxIllustration({
  rarity,
  state,
  asset,
  fallbackKey,
  label,
}: BoxIllustrationProps) {
  const cfg = getRarityConfig(rarity);
  const isShaking = state === 'shaking';
  const isRevealed = state === 'revealed';
  const isIdle = state === 'idle';
  const resolvedKey = fallbackKey ?? rarity.toLowerCase();
  const { url, alt } = getBoxVisualRecipe(asset, resolvedKey);

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
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
        className="pointer-events-none absolute bottom-2 left-1/2 h-4 w-20 rounded-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(17, 19, 24, 0.34) 0%, rgba(17, 19, 24, 0.18) 52%, transparent 84%)',
          filter: 'blur(5px)',
          opacity: isRevealed ? 0.2 : 1,
          transform: `translateX(-50%) scale(${isRevealed ? 0.92 : 1.12})`,
        }}
      />

      <div
        className={isIdle ? 'star-vault-box-float relative flex h-28 w-28 items-center justify-center overflow-visible' : 'relative flex h-28 w-28 items-center justify-center overflow-visible'}
      >
        <div
          className="relative flex h-full w-full items-center justify-center overflow-visible"
          style={{
            animation: isShaking ? 'boxShake 420ms ease-in-out forwards' : 'none',
            transform: isRevealed ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          {url ? (
            <img
              src={url}
              alt={alt ?? label ?? `${rarity} Star Vault box`}
              className="absolute inset-0 h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <LootBoxArt
              rarity={rarity}
              assetKey={resolvedKey}
              label={alt ?? label ?? `${rarity} Star Vault box`}
            />
          )}
        </div>
      </div>

    </div>
  );
}

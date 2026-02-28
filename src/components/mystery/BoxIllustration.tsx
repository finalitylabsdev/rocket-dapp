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
        className="relative flex h-28 w-28 items-center justify-center overflow-visible"
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
  );
}

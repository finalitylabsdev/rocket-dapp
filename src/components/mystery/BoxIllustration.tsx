import PhiSymbol from '../brand/PhiSymbol';
import { getRarityConfig, type RarityTier } from '../brand/RarityBadge';
import type { AssetReference } from '../../types/domain';
import { getBoxVisualRecipe } from './visualRecipes';

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
  const isCracking = state === 'cracking';
  const isRevealed = state === 'revealed';
  const { recipe, url, alt } = getBoxVisualRecipe(asset, fallbackKey ?? rarity.toLowerCase());

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
        className="relative h-24 w-24 flex items-center justify-center overflow-hidden rounded-[24px]"
        style={{
          background: recipe?.shellGradient ?? cfg.bg,
          border: `2px solid ${isRevealed ? cfg.color : cfg.border}`,
          boxShadow: isRevealed
            ? `0 0 28px ${cfg.glow}`
            : recipe
              ? `0 0 20px ${recipe.shellGlow}`
              : 'none',
          animation: isShaking ? 'boxShake 420ms ease-in-out forwards' : 'none',
          transform: isRevealed ? 'scale(1.06)' : 'scale(1)',
        }}
      >
        {url ? (
          <div
            className="absolute inset-[7px] rounded-[18px] bg-cover bg-center"
            style={{ backgroundImage: `url(${url})` }}
            aria-label={alt ?? label ?? `${rarity} Star Vault box`}
          />
        ) : recipe ? (
          <>
            <div
              className="absolute inset-[7px] rounded-[18px]"
              style={{
                background: recipe.shellGradient,
                border: `1px solid ${recipe.shellBorder}`,
              }}
            />
            <div
              className="absolute inset-[13px] rounded-[14px]"
              style={{
                background: recipe.latticeGradient,
                border: `1px solid ${recipe.shellBorder}`,
              }}
            />
            <div
              className="absolute inset-[11px] rounded-[16px]"
              style={{
                border: `1px solid ${recipe.shellBorder}`,
                transform: `scale(${recipe.orbitScale})`,
                opacity: 0.65,
              }}
            />
            {recipe.sparkles.map((sparkle) => (
              <div
                key={`${sparkle.top}-${sparkle.left}`}
                className="absolute rounded-full"
                style={{
                  top: sparkle.top,
                  left: sparkle.left,
                  width: sparkle.size,
                  height: sparkle.size,
                  background: cfg.color,
                  opacity: sparkle.opacity,
                  boxShadow: `0 0 10px ${cfg.glow}`,
                }}
              />
            ))}
            <div
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
              style={{ background: `linear-gradient(90deg, transparent, ${recipe.shellBorder}, transparent)` }}
            />
            <div
              className="absolute left-1/2 inset-y-0 w-px -translate-x-1/2"
              style={{ background: `linear-gradient(180deg, transparent, ${recipe.shellBorder}, transparent)` }}
            />
            <div
              className="absolute bottom-3 rounded-lg px-2 py-1 font-mono font-black tracking-[0.24em]"
              style={{
                background: 'rgba(15,23,42,0.76)',
                color: cfg.color,
                border: `1px solid ${recipe.shellBorder}`,
                fontSize: '10px',
              }}
            >
              {recipe.monogram}
            </div>
          </>
        ) : (
          <div
            className="absolute inset-[7px] rounded-[18px] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, rgba(30,41,59,0.92), rgba(15,23,42,0.98))',
              border: '1px dashed rgba(148,163,184,0.38)',
            }}
          >
            <PhiSymbol size={20} color="rgba(226,232,240,0.8)" />
          </div>
        )}

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
        {!url && recipe && (
          <div className="absolute inset-0 flex items-center justify-center">
            <PhiSymbol size={26} color={isRevealed ? cfg.color : `${cfg.color}AA`} />
          </div>
        )}
      </div>

    </div>
  );
}

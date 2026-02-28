import { useEffect, useState } from 'react';
import type { AssetReference, RocketSection } from '../../types/domain';
import { getSectionVisualRecipe } from './visualRecipes';

interface SectionGlyphProps {
  asset?: AssetReference | null;
  fallbackKey?: RocketSection | string | null;
  size?: 'sm' | 'md';
}

export function SectionGlyph({ asset, fallbackKey, size = 'md' }: SectionGlyphProps) {
  const { recipe, url, alt, usesExplicitFallback } = getSectionVisualRecipe(asset, fallbackKey ?? null);
  const dimension = size === 'sm' ? 42 : 54;
  const fontSize = size === 'sm' ? '10px' : '11px';
  const [hasAssetError, setHasAssetError] = useState(false);
  const showImage = Boolean(url) && !hasAssetError;
  const showRecipe = Boolean(recipe) && !showImage;
  const showFallbackBadge = usesExplicitFallback || (hasAssetError && Boolean(recipe));
  const activeRecipe = showRecipe ? recipe : null;

  useEffect(() => {
    setHasAssetError(false);
  }, [url]);

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl"
      style={{
        width: dimension,
        height: dimension,
        background: recipe?.panelGradient ?? 'linear-gradient(150deg, rgba(148,163,184,0.16), rgba(15,23,42,0.9))',
        border: `1px solid ${recipe?.accent ?? 'rgba(148,163,184,0.28)'}`,
        boxShadow: recipe ? `0 0 16px ${recipe.accent}22` : 'none',
      }}
      aria-label={alt ?? 'Section visual'}
    >
      {showImage ? (
        <img
          src={url ?? undefined}
          alt={alt ?? 'Section visual'}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setHasAssetError(true)}
        />
      ) : activeRecipe ? (
        <>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 44 44" fill="none" aria-hidden="true">
            {activeRecipe.traceSegments.map((segment) => (
              <line
                key={`${segment.from[0]}-${segment.from[1]}-${segment.to[0]}-${segment.to[1]}`}
                x1={segment.from[0]}
                y1={segment.from[1]}
                x2={segment.to[0]}
                y2={segment.to[1]}
                stroke={activeRecipe.accent}
                strokeOpacity="0.6"
                strokeWidth="1.2"
              />
            ))}
            {activeRecipe.nodes.map((node, index) => (
              <circle
                key={`${node.x}-${node.y}-${index}`}
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={activeRecipe.accent}
                fillOpacity={index === 0 ? 0.9 : 0.72}
              />
            ))}
          </svg>
          <div
            className="absolute right-1.5 top-1.5 rounded-md px-1.5 py-0.5 font-mono font-black tracking-[0.22em]"
            style={{
              fontSize,
              background: 'rgba(15,23,42,0.72)',
              color: activeRecipe.accent,
              border: `1px solid ${activeRecipe.accent}44`,
            }}
          >
            {activeRecipe.shortLabel}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-mono font-black tracking-[0.22em]"
            style={{ fontSize, color: '#E2E8F0' }}
          >
            ??
          </span>
        </div>
      )}

      {showFallbackBadge && (
        <div
          className="absolute inset-x-1.5 bottom-1.5 rounded-md px-1 py-0.5 text-center font-mono font-semibold uppercase tracking-[0.18em]"
          style={{
            fontSize: '8px',
            color: '#CBD5E1',
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(148,163,184,0.2)',
          }}
        >
          Fallback
        </div>
      )}
    </div>
  );
}

import type { RarityTier } from '../brand/RarityBadge';

const LOOT_IMAGES = ['/loot/grey.png', '/loot/purple.png', '/loot/red.png'] as const;

interface LootBoxArtProps {
  rarity: RarityTier;
  assetKey?: string;
  label: string;
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function resolveLootImage(rarity: RarityTier, assetKey?: string): string {
  const key = `${assetKey ?? rarity}:${rarity}`;
  return LOOT_IMAGES[hashString(key) % LOOT_IMAGES.length];
}

export default function LootBoxArt({ rarity, assetKey, label }: LootBoxArtProps) {
  return (
    <img
      src={resolveLootImage(rarity, assetKey)}
      alt={label}
      className="absolute inset-0 h-full w-full object-contain scale-[1.08]"
      draggable={false}
    />
  );
}

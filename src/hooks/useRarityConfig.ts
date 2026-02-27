import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  isUsingFallbackRarityConfig,
  setRarityConfig,
  resetRarityConfig,
} from '../components/brand/RarityBadge';
import type { RarityTier, RarityTierConfig } from '../types/domain';
import { fetchCatalog, formatStarVaultError } from '../lib/starVault';

export type RarityConfigReadState = 'loading' | 'catalog' | 'stale' | 'fallback';

interface UseRarityConfigResult {
  rarityTiers: RarityTierConfig[];
  configByTier: Partial<Record<RarityTier, RarityTierConfig>>;
  isLoading: boolean;
  error: string | null;
  readState: RarityConfigReadState;
  isUsingFallback: boolean;
  refresh: () => Promise<void>;
}

export function useRarityConfig(): UseRarityConfigResult {
  const [rarityTiers, setRarityTiers] = useState<RarityTierConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readState, setReadState] = useState<RarityConfigReadState>('loading');
  const hasLoadedCatalogConfig = useRef(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const catalog = await fetchCatalog();
      if (catalog.rarityTiers.length === 0) {
        if (hasLoadedCatalogConfig.current) {
          setError('Rarity config returned no tiers. Continuing with the last synced catalog treatment.');
          setReadState('stale');
        } else {
          setRarityTiers([]);
          resetRarityConfig();
          setError('Rarity config is unavailable. Using launch-default rarity treatment.');
          setReadState('fallback');
        }

        return;
      }

      setRarityTiers(catalog.rarityTiers);
      setRarityConfig(catalog.rarityTiers);
      setError(null);
      setReadState('catalog');
      hasLoadedCatalogConfig.current = true;
    } catch (nextError) {
      const message = formatStarVaultError(nextError, 'Failed to load rarity config.');

      if (hasLoadedCatalogConfig.current) {
        setError(`${message} Continuing with the last synced catalog treatment.`);
        setReadState('stale');
      } else {
        setRarityTiers([]);
        resetRarityConfig();
        setError(`${message} Using launch-default rarity treatment.`);
        setReadState('fallback');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const configByTier = useMemo(
    () => Object.fromEntries(rarityTiers.map((tier) => [tier.name, tier])) as Partial<Record<RarityTier, RarityTierConfig>>,
    [rarityTiers],
  );

  return {
    rarityTiers,
    configByTier,
    isLoading,
    error,
    readState,
    isUsingFallback: readState === 'fallback' || isUsingFallbackRarityConfig(),
    refresh,
  };
}

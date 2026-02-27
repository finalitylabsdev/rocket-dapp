import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyRarityConfigOverrides,
  resetRarityConfigOverrides,
} from '../components/brand/RarityBadge';
import type { RarityTier, RarityTierConfig } from '../types/domain';
import { fetchCatalog, formatStarVaultError } from '../lib/starVault';

interface UseRarityConfigResult {
  rarityTiers: RarityTierConfig[];
  configByTier: Partial<Record<RarityTier, RarityTierConfig>>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRarityConfig(): UseRarityConfigResult {
  const [rarityTiers, setRarityTiers] = useState<RarityTierConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const catalog = await fetchCatalog();
      setRarityTiers(catalog.rarityTiers);
      applyRarityConfigOverrides(catalog.rarityTiers);
      setError(null);
    } catch (nextError) {
      setError(formatStarVaultError(nextError, 'Failed to load rarity config.'));
      resetRarityConfigOverrides();
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
    refresh,
  };
}

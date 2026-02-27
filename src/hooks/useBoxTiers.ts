import { useCallback, useEffect, useState } from 'react';
import type { BoxTierConfig } from '../types/domain';
import { fetchCatalog, formatStarVaultError } from '../lib/starVault';

interface UseBoxTiersResult {
  boxTiers: BoxTierConfig[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBoxTiers(): UseBoxTiersResult {
  const [boxTiers, setBoxTiers] = useState<BoxTierConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const catalog = await fetchCatalog();
      setBoxTiers(catalog.boxTiers);
      setError(null);
    } catch (nextError) {
      setError(formatStarVaultError(nextError, 'Failed to load box tiers.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    boxTiers,
    isLoading,
    error,
    refresh,
  };
}

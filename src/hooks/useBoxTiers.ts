import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoxTierConfig } from '../types/domain';
import { fetchCatalog, formatStarVaultError } from '../lib/starVault';

export type BoxTierReadState = 'loading' | 'ready' | 'stale' | 'degraded';

interface UseBoxTiersResult {
  boxTiers: BoxTierConfig[];
  isLoading: boolean;
  error: string | null;
  readState: BoxTierReadState;
  refresh: () => Promise<void>;
}

export function useBoxTiers(): UseBoxTiersResult {
  const [boxTiers, setBoxTiers] = useState<BoxTierConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readState, setReadState] = useState<BoxTierReadState>('loading');
  const hasLoadedCatalog = useRef(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const catalog = await fetchCatalog();
      if (catalog.boxTiers.length === 0) {
        if (hasLoadedCatalog.current) {
          setError('Box tier catalog returned no entries. Showing the last synced Star Vault layout.');
          setReadState('stale');
        } else {
          setBoxTiers([]);
          setError('Star Vault catalog returned no box tiers. Box purchasing is paused until metadata recovers.');
          setReadState('degraded');
        }

        return;
      }

      setBoxTiers(catalog.boxTiers);
      setError(null);
      setReadState('ready');
      hasLoadedCatalog.current = true;
    } catch (nextError) {
      const message = formatStarVaultError(nextError, 'Failed to load box tiers.');

      if (hasLoadedCatalog.current) {
        setError(`${message} Showing the last synced Star Vault layout.`);
        setReadState('stale');
      } else {
        setBoxTiers([]);
        setError(`${message} Star Vault is in degraded read mode until catalog data recovers.`);
        setReadState('degraded');
      }
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
    readState,
    refresh,
  };
}

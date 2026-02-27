import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuctionHistoryEntry, AuctionRound } from '../types/domain';
import { formatAuctionError, getActiveAuction, getAuctionHistory } from '../lib/nebulaBids';
import { supabase } from '../lib/supabase';

interface UseAuctionsResult {
  activeAuction: AuctionRound | null;
  history: AuctionHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAuctions(enabled: boolean): UseAuctionsResult {
  const [activeAuction, setActiveAuction] = useState<AuctionRound | null>(null);
  const [history, setHistory] = useState<AuctionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabledRef = useRef(enabled);

  enabledRef.current = enabled;

  const refresh = useCallback(async () => {
    if (!enabledRef.current) {
      setActiveAuction(null);
      setHistory([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [nextActiveAuction, nextHistory] = await Promise.all([
        getActiveAuction(),
        getAuctionHistory(),
      ]);
      setActiveAuction(nextActiveAuction);
      setHistory(nextHistory);
      setError(null);
    } catch (nextError) {
      setError(formatAuctionError(nextError, 'Failed to load auctions.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    const supabaseClient = supabase;

    if (!enabled || !supabaseClient) {
      return;
    }

    const channel = supabaseClient
      .channel('nebula-bids')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_rounds' },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_submissions' },
        () => {
          void refresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_bids' },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [enabled, refresh]);

  return useMemo(
    () => ({
      activeAuction,
      history,
      isLoading,
      error,
      refresh,
    }),
    [activeAuction, error, history, isLoading, refresh],
  );
}

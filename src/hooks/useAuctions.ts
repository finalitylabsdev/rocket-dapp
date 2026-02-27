import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuctionHistoryEntry, AuctionRound } from '../types/domain';
import { formatAuctionError, getActiveAuction, getAuctionHistory } from '../lib/nebulaBids';
import { supabase } from '../lib/supabase';

const REFRESH_DEBOUNCE_MS = 500;

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
  const pendingRefreshRef = useRef(false);
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  enabledRef.current = enabled;

  const performRefresh = useCallback(async () => {
    if (!enabledRef.current) {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      pendingRefreshRef.current = false;
      setActiveAuction(null);
      setHistory([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (refreshInFlightRef.current) {
      pendingRefreshRef.current = true;
      await refreshInFlightRef.current;
      return;
    }

    const refreshTask = (async () => {
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
    })();

    refreshInFlightRef.current = refreshTask;

    try {
      await refreshTask;
    } finally {
      refreshInFlightRef.current = null;

      if (pendingRefreshRef.current && enabledRef.current) {
        pendingRefreshRef.current = false;
        void performRefresh();
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    pendingRefreshRef.current = false;
    await performRefresh();
  }, [performRefresh]);

  const scheduleRefresh = useCallback(() => {
    if (!enabledRef.current) {
      return;
    }

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      void performRefresh();
    }, REFRESH_DEBOUNCE_MS);
  }, [performRefresh]);

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
          scheduleRefresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_submissions' },
        () => {
          scheduleRefresh();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_bids' },
        () => {
          scheduleRefresh();
        },
      )
      .subscribe();

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [enabled, scheduleRefresh]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, []);

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

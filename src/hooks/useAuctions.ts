import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuctionHistoryEntry, AuctionRound } from '../types/domain';
import { formatAuctionError, getActiveAuction, getAuctionHistory } from '../lib/nebulaBids';
import { supabase } from '../lib/supabase';

const REFRESH_DEBOUNCE_MS = 500;

export type AuctionsRealtimeState = 'disabled' | 'connecting' | 'connected' | 'degraded';

interface UseAuctionsResult {
  activeAuction: AuctionRound | null;
  history: AuctionHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  realtimeState: AuctionsRealtimeState;
  realtimeIssue: string | null;
  refresh: () => Promise<void>;
}

export function useAuctions(enabled: boolean): UseAuctionsResult {
  const [activeAuction, setActiveAuction] = useState<AuctionRound | null>(null);
  const [history, setHistory] = useState<AuctionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realtimeState, setRealtimeState] = useState<AuctionsRealtimeState>('disabled');
  const [realtimeIssue, setRealtimeIssue] = useState<string | null>(null);
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
      setRealtimeState('disabled');
      setRealtimeIssue(null);
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
      setRealtimeState('disabled');
      setRealtimeIssue(null);
      return;
    }

    setRealtimeState('connecting');
    setRealtimeIssue(null);

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
      .subscribe((status, nextError) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeState('connected');
          setRealtimeIssue(null);
          void refresh();
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeState('degraded');
          setRealtimeIssue(toRealtimeIssueMessage(status, nextError));
          scheduleRefresh();
          return;
        }

        if (status === 'CLOSED' && enabledRef.current) {
          setRealtimeState('degraded');
          setRealtimeIssue('Live auction updates are disconnected. Use Refresh if the view looks stale.');
        }
      });

    return () => {
      void supabaseClient.removeChannel(channel);
    };
  }, [enabled, refresh, scheduleRefresh]);

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
      realtimeState,
      realtimeIssue,
      refresh,
    }),
    [activeAuction, error, history, isLoading, realtimeIssue, realtimeState, refresh],
  );
}

function toRealtimeIssueMessage(status: 'CHANNEL_ERROR' | 'TIMED_OUT', error: Error | undefined): string {
  const suffix = error?.message ? ` (${error.message})` : '';

  if (status === 'TIMED_OUT') {
    return `Live auction updates timed out. Falling back to manual refresh until the channel recovers${suffix}.`;
  }

  return `Live auction updates hit a realtime channel error. Falling back to manual refresh until the channel recovers${suffix}.`;
}

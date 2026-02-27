import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createElement } from 'react';

interface PriceData {
  ethereum: { usd: number; usd_24h_change: number };
  bitcoin: { usd: number; usd_24h_change: number };
}

interface PriceState {
  prices: PriceData | null;
  isLoading: boolean;
  error: string | null;
}

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true';

const POLL_INTERVAL = 60_000;

const FLUX_USD = 0.042;
const UVD_USD = 1.0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeUsdQuote(value: unknown, assetName: string): { usd: number; usd_24h_change: number } {
  if (!isRecord(value)) {
    throw new Error(`CoinGecko payload for ${assetName} was malformed.`);
  }

  const usd = readFiniteNumber(value.usd);
  const usd24hChange = readFiniteNumber(value.usd_24h_change);

  if (usd === null || usd24hChange === null) {
    throw new Error(`CoinGecko payload for ${assetName} was incomplete.`);
  }

  return {
    usd,
    usd_24h_change: usd24hChange,
  };
}

function normalizePriceData(payload: unknown): PriceData {
  if (!isRecord(payload)) {
    throw new Error('CoinGecko payload was malformed.');
  }

  return {
    ethereum: normalizeUsdQuote(payload.ethereum, 'ethereum'),
    bitcoin: normalizeUsdQuote(payload.bitcoin, 'bitcoin'),
  };
}

const PriceContext = createContext<PriceState>({
  prices: null,
  isLoading: true,
  error: null,
});

export function PriceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PriceState>({
    prices: null,
    isLoading: true,
    error: null,
  });

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(COINGECKO_URL);
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const data = normalizePriceData(await res.json());
      setState({ prices: data, isLoading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch prices',
      }));
    }
  }, []);

  useEffect(() => {
    void fetchPrices();
    const id = setInterval(() => void fetchPrices(), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchPrices]);

  return createElement(PriceContext.Provider, { value: state }, children);
}

export function usePrices() {
  return useContext(PriceContext);
}

export function getTokenUsdPrice(prices: PriceData | null, symbol: string): number {
  if (symbol === 'FLUX') return FLUX_USD;
  if (symbol === 'UVD') return UVD_USD;
  if (!prices) return 0;
  if (symbol === 'wETH') return prices.ethereum.usd;
  if (symbol === 'wBTC') return prices.bitcoin.usd;
  return 0;
}

export function getTokenChange(prices: PriceData | null, symbol: string): number {
  if (symbol === 'FLUX') return 5.43;
  if (symbol === 'UVD') return 0.01;
  if (!prices) return 0;
  if (symbol === 'wETH') return prices.ethereum.usd_24h_change;
  if (symbol === 'wBTC') return prices.bitcoin.usd_24h_change;
  return 0;
}

export function getRate(prices: PriceData | null, from: string, to: string): number {
  if (from === to) return 1;
  const fromUsd = getTokenUsdPrice(prices, from);
  const toUsd = getTokenUsdPrice(prices, to);
  if (!toUsd) return 0;
  return fromUsd / toUsd;
}

export function formatUsdPrice(value: number): string {
  if (value >= 1000) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (value >= 1) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toFixed(4)}`;
}

import { TrendingUp, BarChart3, Droplets, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useCountUp';
import { usePrices, getTokenUsdPrice, getTokenChange, formatUsdPrice } from '../../hooks/usePrices';
import TokenIcon from './TokenIcon';

const TOKEN_DATA = [
  { symbol: 'FLUX', name: 'Flux Token', volume: '$128,409', liquidity: '$842,000' },
  { symbol: 'wETH', name: 'Wrapped Ethereum', volume: '$9.2M', liquidity: '$4.12M' },
  { symbol: 'wBTC', name: 'Wrapped Bitcoin', volume: '$42.1M', liquidity: '$2.34M' },
  { symbol: 'UVD', name: 'Universe Dollar', volume: '$3.8M', liquidity: '$1.25M' },
];

export default function MarketStats() {
  const { ref, isVisible } = useIntersectionObserver(0.1);
  const { prices, isLoading } = usePrices();

  return (
    <div
      ref={ref}
      className={`space-y-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="app-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} className="text-dot-green" />
          <h3 className="font-mono font-bold text-text-primary text-sm tracking-tight">Live Market</h3>
          <div className="ml-auto flex items-center gap-1">
            <div className="glow-dot" />
            <span className="text-[10px] text-dot-green font-mono font-semibold uppercase">Live</span>
          </div>
        </div>

        <div className="space-y-3">
          {TOKEN_DATA.map((token) => {
            const price = getTokenUsdPrice(prices, token.symbol);
            const change = getTokenChange(prices, token.symbol);
            const up = change >= 0;

            return (
              <div
                key={token.symbol}
                className="flex items-center justify-between p-3 app-panel-muted hover:border-border-default hover:bg-bg-card-hover transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <TokenIcon symbol={token.symbol} size="lg" />
                  <div>
                    <p className="font-mono font-bold text-text-primary text-sm leading-none">{token.symbol}</p>
                    <p className="text-text-muted text-[10px] mt-0.5">{token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-text-primary text-sm leading-none">
                    {isLoading ? '--' : formatUsdPrice(price)}
                  </p>
                  <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${up ? 'text-dot-green' : 'text-text-secondary'}`}>
                    {up ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    <span className="text-[10px] font-mono font-semibold">
                      {isLoading ? '--' : `${up ? '+' : ''}${change.toFixed(2)}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="app-panel p-5">
        <h3 className="font-mono font-bold text-text-primary text-sm mb-4 flex items-center gap-2 tracking-tight">
          <BarChart3 size={15} className="text-text-secondary" />
          Protocol Stats
        </h3>
        <div className="space-y-3">
          {[
            { label: '24h Volume', value: '$14.2M', icon: <TrendingUp size={13} className="text-dot-green" /> },
            { label: 'Total Liquidity', value: '$8.56M', icon: <Droplets size={13} className="text-text-secondary" /> },
            { label: 'All-Time Volume', value: '$142M', icon: <BarChart3 size={13} className="text-text-secondary" /> },
            { label: 'Active Pairs', value: '12', icon: <Activity size={13} className="text-text-secondary" /> },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0">
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-sm text-text-muted font-mono">{stat.label}</span>
              </div>
              <span className="font-mono font-bold text-text-primary text-sm">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="app-panel p-5">
        <h3 className="font-mono font-bold text-text-primary text-sm mb-4 tracking-tight">Your Position</h3>
        <div className="text-center py-4">
          <div className="w-12 h-12 app-panel-muted flex items-center justify-center mx-auto mb-3">
            <Droplets size={20} className="text-text-muted" />
          </div>
          <p className="text-text-muted text-sm font-mono">No liquidity positions</p>
          <p className="text-text-muted text-xs font-mono">Connect wallet to view your positions</p>
        </div>
      </div>
    </div>
  );
}

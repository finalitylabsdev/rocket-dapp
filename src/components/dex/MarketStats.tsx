import { TrendingUp, TrendingDown, BarChart3, Droplets, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useCountUp';

const TOKEN_DATA = [
  {
    symbol: 'FLUX',
    name: 'Flux Token',
    price: '$0.0420',
    change: '+5.43%',
    up: true,
    volume: '$128,409',
    liquidity: '$842,000',
    label: 'F',
    bg: 'bg-zinc-200',
  },
  {
    symbol: 'wETH',
    name: 'Wrapped Ethereum',
    price: '$2,847',
    change: '+1.21%',
    up: true,
    volume: '$9.2M',
    liquidity: '$4.12M',
    label: 'Ξ',
    bg: 'bg-zinc-300',
  },
  {
    symbol: 'wBTC',
    name: 'Wrapped Bitcoin',
    price: '$67,420',
    change: '-0.87%',
    up: false,
    volume: '$42.1M',
    liquidity: '$2.34M',
    label: '₿',
    bg: 'bg-zinc-400',
  },
  {
    symbol: 'UVD',
    name: 'Universe Dollar',
    price: '$1.0000',
    change: '+0.01%',
    up: true,
    volume: '$3.8M',
    liquidity: '$1.25M',
    label: 'U',
    bg: 'bg-zinc-500',
  },
];

export default function MarketStats() {
  const { ref, isVisible } = useIntersectionObserver(0.1);

  return (
    <div
      ref={ref}
      className={`space-y-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="bg-bg-card border border-border-subtle p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={15} className="text-dot-green" />
          <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wider">Live Market</h3>
          <div className="ml-auto flex items-center gap-1">
            <div className="glow-dot" />
            <span className="text-[10px] text-dot-green font-mono font-semibold uppercase">Live</span>
          </div>
        </div>

        <div className="space-y-3">
          {TOKEN_DATA.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-3 bg-zinc-900 border border-border-subtle hover:border-border-default hover:bg-bg-card-hover transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 ${token.bg} flex items-center justify-center text-black font-mono font-black text-xs flex-shrink-0`}>
                  {token.label}
                </div>
                <div>
                  <p className="font-mono font-bold text-white text-sm leading-none">{token.symbol}</p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">{token.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-white text-sm leading-none">{token.price}</p>
                <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${token.up ? 'text-dot-green' : 'text-zinc-400'}`}>
                  {token.up ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  <span className="text-[10px] font-mono font-semibold">{token.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-bg-card border border-border-subtle p-5">
        <h3 className="font-mono font-bold text-white text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
          <BarChart3 size={15} className="text-zinc-400" />
          Protocol Stats
        </h3>
        <div className="space-y-3">
          {[
            { label: '24h Volume', value: '$14.2M', icon: <TrendingUp size={13} className="text-dot-green" /> },
            { label: 'Total Liquidity', value: '$8.56M', icon: <Droplets size={13} className="text-zinc-400" /> },
            { label: 'All-Time Volume', value: '$142M', icon: <BarChart3 size={13} className="text-zinc-400" /> },
            { label: 'Active Pairs', value: '12', icon: <Activity size={13} className="text-zinc-400" /> },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0">
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-sm text-zinc-500 font-mono">{stat.label}</span>
              </div>
              <span className="font-mono font-bold text-white text-sm">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-bg-card border border-border-subtle p-5">
        <h3 className="font-mono font-bold text-white text-sm mb-4 uppercase tracking-wider">Your Position</h3>
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-zinc-900 border border-border-default flex items-center justify-center mx-auto mb-3">
            <Droplets size={20} className="text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm font-mono">No liquidity positions</p>
          <p className="text-zinc-600 text-xs font-mono">Connect wallet to view your positions</p>
        </div>
      </div>
    </div>
  );
}

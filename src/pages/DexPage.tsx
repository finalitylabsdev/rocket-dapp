import { useState } from 'react';
import { ArrowLeftRight, CheckCircle2, Droplets, ExternalLink, Rocket, ShieldCheck, TimerReset } from 'lucide-react';
import { toast } from 'sonner';
import SwapTab from '../components/dex/SwapTab';
import LiquidityTab from '../components/dex/LiquidityTab';
import MarketStats from '../components/dex/MarketStats';
import { DEX_TRADING_ENABLED } from '../config/spec';
import { APP_VERSION } from '../config/app';
import { PriceProvider } from '../hooks/usePrices';

export default function DexPage() {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity'>('swap');

  const summaryCards = DEX_TRADING_ENABLED
    ? [
      { label: 'Trading Fee', value: '0.3%', sub: 'Per swap' },
      { label: 'Protocol Fee', value: '0.05%', sub: 'To treasury' },
      { label: 'Min Liquidity', value: '$100', sub: 'To add LP' },
      { label: 'Testnet Flux', value: 'Free', sub: 'Via Entropy Gate' },
    ]
    : [
      { label: 'Swap', value: 'Paused', sub: 'Mainnet prep' },
      { label: 'Liquidity', value: 'Paused', sub: 'Mainnet prep' },
      { label: 'Contract Link', value: 'Soon', sub: 'Verification pending' },
      { label: 'Status', value: 'Building', sub: 'Execution track active' },
    ];

  return (
    <PriceProvider>
      <div className="pt-24 md:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-3">
              <span className="tag">
                <ArrowLeftRight size={11} />
                Decentralized Exchange
              </span>
            </div>
            <h1 className="font-mono font-black text-3xl md:text-4xl lg:text-5xl text-text-primary mb-3 tracking-tight">
              Entropy Exchange
            </h1>
            <p className="text-text-muted text-lg font-mono">
              Trade <span className="text-text-primary font-semibold">Flux</span> ↔{' '}
              <span className="text-text-primary font-semibold">wBTC / wETH / UVD</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-6 max-w-5xl mx-auto lg:max-w-none">
            {DEX_TRADING_ENABLED ? (
              <div className="app-window overflow-hidden">
                <div className="p-6 border-b border-border-subtle">
                  <div className="flex gap-2 app-panel-muted p-2">
                    <button
                      onClick={() => setActiveTab('swap')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono font-semibold text-sm transition-all duration-200 rounded-lg ${
                        activeTab === 'swap'
                          ? 'text-dot-green'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      style={activeTab === 'swap' ? { background: 'rgba(184,255,85,0.12)', boxShadow: 'var(--surface-gloss)' } : undefined}
                    >
                      <ArrowLeftRight size={14} />
                      SWAP
                    </button>
                    <button
                      onClick={() => setActiveTab('liquidity')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono font-semibold text-sm transition-all duration-200 rounded-lg ${
                        activeTab === 'liquidity'
                          ? 'text-dot-green'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      style={activeTab === 'liquidity' ? { background: 'rgba(184,255,85,0.12)', boxShadow: 'var(--surface-gloss)' } : undefined}
                    >
                      <Droplets size={14} />
                      LIQUIDITY
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {activeTab === 'swap' ? <SwapTab /> : <LiquidityTab />}
                </div>

                <div className="px-6 pb-5 pt-1 border-t border-border-subtle">
                  <div className="flex items-center justify-between text-xs text-text-muted font-mono">
                    <span>{`Powered by Entropy Protocol v${APP_VERSION}`}</span>
                    <button
                      onClick={() => toast.info('Contract verification pending')}
                      className="flex items-center gap-1 hover:text-text-secondary transition-colors"
                    >
                      Contracts <ExternalLink size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative app-window overflow-hidden">
                <div
                  className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.18) 0%, rgba(74,222,128,0) 70%)' }}
                />
                <div className="p-7 md:p-8 relative">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="tag">
                      <Rocket size={11} />
                      Mainnet Track
                    </span>
                  </div>

                  <h2 className="font-mono font-black text-2xl md:text-3xl text-text-primary uppercase tracking-wider leading-tight">
                    Feature in Preparation for Mainnet Release
                  </h2>
                  <p className="text-text-muted font-mono mt-3 max-w-2xl leading-relaxed">
                    Swap and liquidity provisioning are intentionally disabled in this test build while on-chain execution and settlement are finalized.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
                    {[
                      { icon: ShieldCheck, title: 'Routing', value: 'Contract Validation' },
                      { icon: Droplets, title: 'Liquidity', value: 'Vault Bootstrapping' },
                      { icon: TimerReset, title: 'Launch', value: 'Mainnet Release Window' },
                    ].map((item) => (
                      <div key={item.title} className="app-panel-muted p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <item.icon size={13} className="text-dot-green" />
                          <span className="text-[11px] uppercase tracking-widest font-mono text-text-muted">{item.title}</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-text-primary">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-5 pt-1 border-t border-border-subtle">
                  <div className="flex items-center justify-between text-xs text-text-muted font-mono">
                    <span>{`Entropy Protocol v${APP_VERSION}`}</span>
                    <span className="flex items-center gap-1 text-text-secondary">
                      <CheckCircle2 size={10} />
                      Mainnet Prep Active
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <MarketStats />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto lg:max-w-none">
            {summaryCards.map((item) => (
              <div key={item.label} className="app-stat p-4 text-center">
                <p className="font-mono font-bold text-text-primary text-lg">{item.value}</p>
                <p className="text-sm font-mono font-medium text-text-secondary mt-0.5 tracking-wide">{item.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PriceProvider>
  );
}

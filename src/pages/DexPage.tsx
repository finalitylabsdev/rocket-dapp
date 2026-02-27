import { useState } from 'react';
import { ArrowLeft, ArrowLeftRight, CheckCircle2, Droplets, ExternalLink, LogOut, Rocket, ShieldCheck, TimerReset, Zap } from 'lucide-react';
import SwapTab from '../components/dex/SwapTab';
import LiquidityTab from '../components/dex/LiquidityTab';
import MarketStats from '../components/dex/MarketStats';
import { DEX_TRADING_ENABLED } from '../config/spec';
import { APP_VERSION } from '../config/app';
import { useWallet } from '../hooks/useWallet';
import { PriceProvider } from '../hooks/usePrices';

interface DexPageProps {
  onBack: () => void;
}

export default function DexPage({ onBack }: DexPageProps) {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity'>('swap');
  const wallet = useWallet();

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
    <div className="min-h-screen bg-bg-base">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 bg-zinc-900 border border-border-default group-hover:border-border-strong flex items-center justify-center transition-all">
                  <ArrowLeft size={15} className="text-zinc-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-mono font-medium hidden sm:inline">BACK</span>
              </button>
              <div className="h-5 w-px bg-border-default" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-dot-green flex items-center justify-center">
                  <Zap size={16} className="text-black" fill="black" />
                </div>
                <div>
                  <span className="font-mono font-bold text-white text-base leading-none uppercase tracking-wider">Entropy Exchange</span>
                  <div className="text-[10px] font-mono font-medium text-zinc-500 leading-none mt-0.5 uppercase tracking-wider">Constant-Product AMM · ɸ-net</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-border-subtle px-3 py-2">
                <div className="glow-dot" />
                <span className="text-xs font-mono font-semibold text-zinc-300">TESTNET</span>
              </div>
              {wallet.isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-zinc-900 border border-border-subtle px-3 py-2">
                    <div className="glow-dot" />
                    <span className="text-xs font-mono font-semibold text-zinc-300">{wallet.displayAddress}</span>
                  </div>
                  <button
                    onClick={() => void wallet.disconnect()}
                    disabled={wallet.isConnecting}
                    className="w-9 h-9 bg-zinc-900 border border-border-subtle flex items-center justify-center hover:border-border-strong transition-all"
                  >
                    <LogOut size={14} className="text-zinc-400" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => void wallet.connect()}
                  disabled={wallet.isConnecting}
                  className="btn-primary text-sm py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={13} />
                  {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-3">
              <span className="tag">
                <ArrowLeftRight size={11} />
                Decentralized Exchange
              </span>
            </div>
            <h1 className="font-mono font-black text-3xl md:text-4xl lg:text-5xl text-white mb-3 uppercase tracking-wider">
              Entropy Exchange
            </h1>
            <p className="text-zinc-500 text-lg font-mono">
              Trade <span className="text-zinc-300 font-semibold">Flux</span> ↔{' '}
              <span className="text-zinc-300 font-semibold">wBTC / wETH / UVD</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-6 max-w-5xl mx-auto lg:max-w-none">
            {DEX_TRADING_ENABLED ? (
              <div className="bg-bg-card border border-border-subtle overflow-hidden">
                <div className="p-6 border-b border-border-subtle">
                  <div className="flex gap-0 border border-border-subtle">
                    <button
                      onClick={() => setActiveTab('swap')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono font-semibold text-sm transition-all duration-200 ${
                        activeTab === 'swap'
                          ? 'bg-dot-green/10 text-dot-green border-b-2 border-dot-green'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <ArrowLeftRight size={14} />
                      SWAP
                    </button>
                    <button
                      onClick={() => setActiveTab('liquidity')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 font-mono font-semibold text-sm transition-all duration-200 ${
                        activeTab === 'liquidity'
                          ? 'bg-dot-green/10 text-dot-green border-b-2 border-dot-green'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
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
                  <div className="flex items-center justify-between text-xs text-zinc-600 font-mono">
                    <span>{`Powered by Entropy Protocol v${APP_VERSION}`}</span>
                    <a href="#" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
                      Contracts <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-bg-card border border-border-subtle overflow-hidden">
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

                  <h2 className="font-mono font-black text-2xl md:text-3xl text-white uppercase tracking-wider leading-tight">
                    Feature in Preparation for Mainnet Release
                  </h2>
                  <p className="text-zinc-500 font-mono mt-3 max-w-2xl leading-relaxed">
                    Swap and liquidity provisioning are intentionally disabled in this test build while on-chain execution and settlement are finalized.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
                    {[
                      { icon: ShieldCheck, title: 'Routing', value: 'Contract Validation' },
                      { icon: Droplets, title: 'Liquidity', value: 'Vault Bootstrapping' },
                      { icon: TimerReset, title: 'Launch', value: 'Mainnet Release Window' },
                    ].map((item) => (
                      <div key={item.title} className="bg-zinc-900/70 border border-border-subtle p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <item.icon size={13} className="text-dot-green" />
                          <span className="text-[11px] uppercase tracking-widest font-mono text-zinc-500">{item.title}</span>
                        </div>
                        <p className="text-sm font-mono font-semibold text-zinc-200">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-6 pb-5 pt-1 border-t border-border-subtle">
                  <div className="flex items-center justify-between text-xs text-zinc-600 font-mono">
                    <span>{`Entropy Protocol v${APP_VERSION}`}</span>
                    <span className="flex items-center gap-1 text-zinc-400">
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
              <div key={item.label} className="bg-bg-card border border-border-subtle p-4 text-center">
                <p className="font-mono font-bold text-white text-lg">{item.value}</p>
                <p className="text-sm font-mono font-medium text-zinc-400 mt-0.5 uppercase tracking-wider">{item.label}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </PriceProvider>
  );
}

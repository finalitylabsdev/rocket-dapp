import { useState } from 'react';
import { ArrowLeft, ArrowLeftRight, Droplets, ExternalLink, Zap } from 'lucide-react';
import SwapTab from '../components/dex/SwapTab';
import LiquidityTab from '../components/dex/LiquidityTab';
import MarketStats from '../components/dex/MarketStats';

interface DexPageProps {
  onBack: () => void;
}

export default function DexPage({ onBack }: DexPageProps) {
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity'>('swap');

  return (
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
                  <div className="text-[10px] font-mono font-medium text-zinc-500 leading-none mt-0.5 uppercase tracking-wider">Constant-Product AMM · E-Net | φ-Net</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-border-subtle px-3 py-2">
                <div className="glow-dot" />
                <span className="text-xs font-mono font-semibold text-zinc-300">TESTNET</span>
              </div>
              <button className="btn-primary text-sm py-2.5 px-5">
                <Zap size={13} />
                Connect Wallet
              </button>
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
                  <span>Powered by Entropy Protocol v0.9.2</span>
                  <a href="#" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
                    Contracts <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>

            <div>
              <MarketStats />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto lg:max-w-none">
            {[
              { label: 'Trading Fee', value: '0.3%', sub: 'Per swap' },
              { label: 'Protocol Fee', value: '0.05%', sub: 'To treasury' },
              { label: 'Min Liquidity', value: '$100', sub: 'To add LP' },
              { label: 'Testnet Flux', value: 'Free', sub: 'Via Entropy Gate' },
            ].map((item) => (
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
  );
}

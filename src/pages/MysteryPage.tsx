import { ArrowLeft, Gift, Zap } from 'lucide-react';
import FloatingParticles from '../components/mystery/FloatingParticles';
import BoxSection from '../components/mystery/BoxSection';
import AuctionSection from '../components/mystery/AuctionSection';

interface MysteryPageProps {
  onBack: () => void;
}

export default function MysteryPage({ onBack }: MysteryPageProps) {
  return (
    <div className="min-h-screen bg-bg-base relative">
      <FloatingParticles />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/95 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-border-default group-hover:border-border-strong flex items-center justify-center transition-all">
                  <ArrowLeft size={15} className="text-zinc-400 group-hover:text-white" />
                </div>
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>
              <div className="h-5 w-px bg-border-default" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                  <Zap size={16} className="text-black" fill="black" />
                </div>
                <div>
                  <span className="font-poppins font-bold text-white text-base leading-none">Star Vault & Nebula Bids</span>
                  <div className="text-[10px] font-medium text-zinc-500 leading-none mt-0.5">App 3 · E-Net Testnet</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-border-subtle rounded-2xl px-3 py-2">
                <div className="glow-dot" />
                <span className="text-xs font-semibold text-zinc-300">Testnet</span>
              </div>
              <button className="btn-primary text-sm py-2.5 px-5">
                <Zap size={13} fill="black" />
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="flex justify-center mb-4">
              <span className="tag">
                <Gift size={11} />
                Gamified Rewards
              </span>
            </div>
            <h1 className="font-poppins font-black text-3xl md:text-5xl lg:text-6xl text-white mb-4 leading-[1.08]">
              Star Vault & Nebula Bids
            </h1>
            <p className="text-zinc-400 text-lg max-w-lg mx-auto">
              Crack open the cosmos. Bid on destiny.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {[
                { label: 'Boxes Opened', value: '14,291' },
                { label: 'Flux Distributed', value: '2.1M' },
                { label: 'Unique Winners', value: '1,847' },
                { label: 'Live Auctions', value: '4' },
              ].map((stat) => (
                <div key={stat.label} className="bg-bg-card border border-border-subtle rounded-2xl px-4 py-2.5 flex items-center gap-3">
                  <p className="font-poppins font-bold text-white text-sm">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <BoxSection />
          <AuctionSection />
        </div>
      </div>
    </div>
  );
}

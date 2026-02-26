import { useState } from 'react';
import { ArrowLeftRight, Gift, Rocket, Trophy, Lock, Star, ChevronRight } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useCountUp';

interface ActionCard {
  id: string;
  icon: React.ReactNode;
  badge?: string;
  title: string;
  tagline: string;
  description: string;
  buttonLabel: string;
  stats: { label: string; value: string }[];
}

const cards: ActionCard[] = [
  {
    id: 'faucet',
    icon: <Lock size={22} className="text-white" />,
    badge: 'Start Here',
    title: 'Entropy Gate',
    tagline: 'Lock ETH → Claim Flux',
    description: 'Lock 0.05 ETH once to whitelist your wallet. Claim 1 Flux every 24 hours. Funds the ETH prize pool forever.',
    buttonLabel: 'Claim Your Flux',
    stats: [
      { label: 'Daily Claim', value: '1 Flux' },
      { label: 'Lock Amount', value: '0.05 ETH' },
    ],
  },
  {
    id: 'dex',
    icon: <ArrowLeftRight size={22} className="text-white" />,
    title: 'Flux Exchange',
    tagline: 'Trade at the speed of entropy',
    description: 'Swap Flux ↔ wBTC / wETH / UVD on the constant-product AMM. Low fees. Full on-chain transparency.',
    buttonLabel: 'Start Trading',
    stats: [
      { label: 'Swap Fee', value: '0.30%' },
      { label: 'Pairs', value: '3 pools' },
    ],
  },
  {
    id: 'mystery',
    icon: <Gift size={22} className="text-white" />,
    badge: 'New',
    title: 'Star Vault & Nebula Bids',
    tagline: 'Crack open the cosmos',
    description: 'Buy Star Vault mystery boxes for NFT rocket parts across 8 rarity tiers. Submit rare drops to Nebula Bids auctions every 4 hours.',
    buttonLabel: 'Open a Box',
    stats: [
      { label: 'Rarity Tiers', value: '8' },
      { label: 'Auction Cycle', value: '4 hrs' },
    ],
  },
  {
    id: 'lab',
    icon: <Rocket size={22} className="text-white" />,
    title: 'Celestial Assembler',
    tagline: 'Build. Launch. Dominate.',
    description: 'Equip 8 NFT parts across Core Engine, Wing-Plates, Fuel Cells and more. Launch via Quantum Lift-Off for your Grav Score.',
    buttonLabel: 'Start Building',
    stats: [
      { label: 'Rocket Slots', value: '8' },
      { label: 'Launched', value: '8,491' },
    ],
  },
  {
    id: 'leaderboard',
    icon: <Trophy size={22} className="text-white" />,
    badge: 'Season 1',
    title: 'Cosmic Jackpot',
    tagline: 'Compete. Win ETH rewards.',
    description: 'Rank by cumulative Grav Score. Top 3 daily split 50% of all locked ETH. 1st place also wins a Quantum NFT part.',
    buttonLabel: 'See Leaderboard',
    stats: [
      { label: 'Prize', value: '50% ETH' },
      { label: 'Reset', value: '24 hrs' },
    ],
  },
];

interface QuickActionsProps {
  onOpenDex: () => void;
  onOpenMystery: () => void;
  onOpenLab: () => void;
  onOpenLeaderboard: () => void;
}

export default function QuickActions({ onOpenDex, onOpenMystery, onOpenLab, onOpenLeaderboard }: QuickActionsProps) {
  const { ref, isVisible } = useIntersectionObserver(0.1);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div
          ref={ref}
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="flex justify-center mb-3">
            <span className="tag">
              <Star size={11} className="text-white" />
              Four Apps
            </span>
          </div>
          <h2 className="section-title mb-3">Your Dashboard</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            One end-to-end journey — from locking ETH to winning it back. Every app feeds the next.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cards.map((card, i) => (
            <div
              key={card.id}
              className={`relative rounded-3xl bg-bg-card border overflow-hidden cursor-pointer transition-all duration-300 ${
                hovered === card.id
                  ? 'border-border-strong shadow-card-hover -translate-y-1.5 bg-bg-card-hover'
                  : 'border-border-subtle shadow-card'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 70}ms` }}
              onMouseEnter={() => setHovered(card.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {card.badge && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {card.badge}
                  </span>
                </div>
              )}

              <div className="p-5 flex flex-col h-full">
                <div
                  className={`w-11 h-11 rounded-2xl bg-zinc-800 border border-border-default flex items-center justify-center mb-4 transition-all duration-300 ${
                    hovered === card.id ? 'scale-110 bg-zinc-700' : ''
                  }`}
                >
                  {card.icon}
                </div>

                <h3 className="font-poppins font-bold text-white text-base leading-tight mb-1">
                  {card.title}
                </h3>
                <p className="text-xs font-semibold text-zinc-400 mb-2">{card.tagline}</p>
                <p className="text-sm text-zinc-500 leading-relaxed flex-1 mb-4">{card.description}</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {card.stats.map((stat, j) => (
                    <div key={j} className="bg-zinc-900 rounded-xl p-2 text-center border border-border-subtle">
                      <p className="font-bold text-white text-sm leading-none">{stat.value}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-none">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={card.id === 'dex' ? onOpenDex : card.id === 'mystery' ? onOpenMystery : card.id === 'lab' ? onOpenLab : card.id === 'leaderboard' ? onOpenLeaderboard : undefined}
                  className="w-full bg-white hover:bg-zinc-100 text-black font-semibold text-sm py-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {card.buttonLabel}
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

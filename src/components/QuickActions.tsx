import { useState } from 'react';
import { ArrowLeftRight, Gift, Rocket, Trophy, Lock, ChevronRight } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useCountUp';
import { WHITELIST_ETH } from '../config/spec';
import { formatEthAmount } from '../lib/ethLock';
import {
  FAUCET_ENABLED,
  DEX_ENABLED,
  STAR_VAULT_ENABLED,
  NEBULA_BIDS_ENABLED,
  ROCKET_LAB_ENABLED,
} from '../config/flags';

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
    icon: <Lock size={22} className="text-dot-green" />,
    badge: 'Start Here',
    title: 'Entropy Gate',
    tagline: 'Lock ETH → Claim Flux',
    description: `Lock ${formatEthAmount(WHITELIST_ETH)} ETH once to whitelist your wallet. Claim 1 Flux every 24 hours. Funds the ETH prize pool forever.`,
    buttonLabel: 'Open Entropy Gate',
    stats: [
      { label: 'Daily Claim', value: '1 Flux' },
      { label: 'Lock Amount', value: `${formatEthAmount(WHITELIST_ETH)} ETH` },
    ],
  },
  {
    id: 'dex',
    icon: <ArrowLeftRight size={22} className="text-dot-green" />,
    title: 'Entropy Exchange',
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
    icon: <Gift size={22} className="text-dot-green" />,
    badge: 'New',
    title: 'Star Vault',
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
    icon: <Rocket size={22} className="text-dot-green" />,
    title: 'Rocket Lab',
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
    icon: <Trophy size={22} className="text-dot-green" />,
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

const cardEnabled: Record<string, boolean> = {
  faucet: FAUCET_ENABLED,
  dex: DEX_ENABLED,
  mystery: STAR_VAULT_ENABLED || NEBULA_BIDS_ENABLED,
  lab: ROCKET_LAB_ENABLED,
  leaderboard: true,
};

interface QuickActionsProps {
  onOpenGate: () => void;
  onOpenDex: () => void;
  onOpenMystery: () => void;
  onOpenLab: () => void;
  onOpenLeaderboard: () => void;
}

export default function QuickActions({
  onOpenGate,
  onOpenDex,
  onOpenMystery,
  onOpenLab,
  onOpenLeaderboard,
}: QuickActionsProps) {
  const { ref, isVisible } = useIntersectionObserver(0.1);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section id="status" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div
          ref={ref}
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <h2 className="section-title mb-3">Your Dashboard</h2>
          <p className="text-text-muted max-w-xl mx-auto">
            One end-to-end journey — from locking ETH to winning it back. Every app feeds the next.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cards.map((card, i) => {
            const enabled = cardEnabled[card.id] ?? true;
            const badge = enabled ? card.badge : 'Coming Soon';
            return (
            <div
              key={card.id}
              className={`relative bg-bg-card border overflow-hidden transition-all duration-300 ${
                enabled ? 'cursor-pointer' : 'cursor-default'
              } ${
                !enabled ? 'opacity-50 grayscale' : ''
              } ${
                enabled && hovered === card.id
                  ? 'border-border-strong bg-bg-card-hover'
                  : 'border-border-subtle'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                transitionDelay: `${i * 70}ms`,
                ...(!enabled ? { opacity: 0.45, filter: 'grayscale(0.6)' } : {}),
              }}
              onMouseEnter={() => enabled && setHovered(card.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {badge && (
                <div className="absolute top-3 right-3 z-10">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider ${
                    enabled ? 'bg-dot-green text-black' : 'bg-text-muted text-bg-base'
                  }`}>
                    {badge}
                  </span>
                </div>
              )}

              <div className="p-5 flex flex-col h-full">
                <div className="w-11 h-11 bg-bg-inset border border-border-default flex items-center justify-center mb-4">
                  {card.icon}
                </div>

                <h3 className="font-mono font-bold text-text-primary text-base leading-tight mb-1 uppercase tracking-wider">
                  {card.title}
                </h3>
                <p className="text-xs font-mono font-semibold text-text-secondary mb-2">{card.tagline}</p>
                <p className="text-sm text-text-muted leading-relaxed flex-1 mb-4">{card.description}</p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {card.stats.map((stat, j) => (
                    <div key={j} className="bg-bg-inset p-2 text-center border border-border-subtle">
                      <p className="font-mono font-bold text-text-primary text-sm leading-none">{stat.value}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 leading-none font-mono uppercase">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={enabled ? (
                    card.id === 'dex' ? onOpenDex
                    : card.id === 'mystery' ? onOpenMystery
                    : card.id === 'lab' ? onOpenLab
                    : card.id === 'leaderboard' ? onOpenLeaderboard
                    : card.id === 'faucet' ? onOpenGate
                    : undefined
                  ) : undefined}
                  disabled={!enabled}
                  className={`w-full border font-mono font-semibold text-sm py-2.5 transition-all duration-200 flex items-center justify-center gap-1.5 uppercase tracking-wider ${
                    enabled
                      ? 'border-dot-green text-dot-green hover:bg-dot-green/10 active:scale-95'
                      : 'border-border-subtle text-text-muted cursor-not-allowed'
                  }`}
                >
                  {enabled ? card.buttonLabel : 'Coming Soon'}
                  {enabled && <ChevronRight size={13} />}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

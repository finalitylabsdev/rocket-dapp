import { Lock, Layers, Trophy, ArrowRight, Rocket } from 'lucide-react';
import { useIntersectionObserver } from '../hooks/useCountUp';

const steps = [
  {
    step: '01',
    icon: <Lock size={26} className="text-white" />,
    title: 'Entropy Gate — Lock & Claim',
    description: 'Lock 0.05 ETH in the Entropy Gate bridge. Funds the prize pool forever. Claim 1 Flux token every 24 hours — deterministically on-chain.',
    features: ['Non-custodial bridge', '1 Flux/day faucet', 'Entropy Points (XP)'],
    appName: 'App 1',
  },
  {
    step: '02',
    icon: <Layers size={26} className="text-white" />,
    title: 'Flux Exchange — Trade & LP',
    description: 'Swap Flux ↔ wBTC / wETH / UVD on the constant-product AMM. Provide liquidity to earn 0.3% on every swap in your pair.',
    features: ['Flux–BTC · Flux–ETH · Flux–UVD', '0.3% swap fee to LPs', 'UVD stable-coin reserves'],
    appName: 'App 2',
  },
  {
    step: '03',
    icon: <Trophy size={26} className="text-white" />,
    title: 'Star Vault & Nebula Bids',
    description: 'Open mystery boxes to reveal NFT rocket parts across 8 rarity tiers. Submit rare drops to Nebula Bids auctions — win Flux and outbid rivals.',
    features: ['8 rarity tiers (Common → Quantum)', 'New auction every 4 hours', 'Earn Flux from auction wins'],
    appName: 'App 3',
  },
  {
    step: '04',
    icon: <Rocket size={26} className="text-white" />,
    title: 'Celestial Assembler & Cosmic Jackpot',
    description: 'Assemble your 8-slot rocket with NFT parts. Launch via Quantum Lift-Off for a Grav Score. Top 3 daily earn 50% of all locked ETH — real on mainnet.',
    features: ['8-section rocket builder', 'Grav Score leaderboard', 'Top 3 daily: 50% of ETH pool'],
    appName: 'App 4',
  },
];

export default function HowItWorks() {
  const { ref, isVisible } = useIntersectionObserver(0.1);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-bg-surface">
      <div className="max-w-7xl mx-auto">
        <div
          ref={ref}
          className={`text-center mb-14 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="tag mb-3 inline-flex">How It Works</span>
          <h2 className="section-title mt-3 mb-3">Four Apps. One Closed-Loop Economy.</h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Every app feeds the next. Lock ETH once, participate forever, win real ETH prizes.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
          <div
            className="hidden xl:flex absolute top-16 left-[calc(12.5%+32px)] right-[calc(12.5%+32px)] items-center justify-between pointer-events-none"
            style={{ zIndex: 0 }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className="flex-1 border-t border-dashed border-border-default" />
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 mx-1" />
              </div>
            ))}
          </div>

          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative rounded-3xl bg-bg-card border border-border-subtle p-7 shadow-card hover:shadow-card-hover hover:border-border-default transition-all duration-300 hover:-translate-y-1 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 150}ms`, zIndex: 1 }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-13 h-13 rounded-2xl bg-zinc-800 border border-border-default flex items-center justify-center flex-shrink-0" style={{ width: '52px', height: '52px' }}>
                  {step.icon}
                </div>
                <div className="font-poppins font-black text-5xl text-zinc-800 leading-none select-none">{step.step}</div>
              </div>

              <div className="mb-1">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{step.appName}</span>
              </div>
              <h3 className="font-poppins font-bold text-white text-lg mb-3 leading-snug">{step.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-5">{step.description}</p>

              <div className="space-y-2">
                {step.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-zinc-800 border border-border-strong flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    </div>
                    <span className="text-sm text-zinc-400 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {i < steps.length - 1 && (
                <div className="xl:hidden flex justify-center mt-6">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-border-default flex items-center justify-center">
                    <ArrowRight size={15} className="text-zinc-500 md:rotate-0" style={{ transform: 'rotate(90deg)' }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className={`mt-14 bg-bg-card rounded-4xl border border-border-default shadow-card p-8 md:p-10 text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '600ms' }}
        >
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Limited Time</p>
            <h3 className="font-poppins font-bold text-white text-2xl md:text-3xl mb-4">
              Season 1 Cosmic Jackpot is <span className="text-gradient">Live Now</span>
            </h3>
            <p className="text-zinc-500 mb-7">
              Top 3 players on the leaderboard share <strong className="text-zinc-200">50% of all locked ETH</strong> every 24 hours.
              Plus NFT rewards — Quantum, Celestial, and Mythic parts for 1st, 2nd, and 3rd place.
              Join 2,400+ testers competing right now.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button className="btn-primary px-8 py-3.5">
                <Layers size={15} />
                Join the Testnet
              </button>
              <button className="btn-secondary px-8 py-3.5">
                View Cosmic Jackpot
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

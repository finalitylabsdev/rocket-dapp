import { Zap, ExternalLink, ChevronDown } from 'lucide-react';
import RocketIllustration from './RocketIllustration';

interface HeroProps {
  onOpenDex: () => void;
}

export default function Hero({ onOpenDex }: HeroProps) {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pt-20">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full py-16 lg:py-0">
          <div className="space-y-8 animate-slide-up">
            <div className="flex flex-wrap gap-2">
              <span className="tag">
                <span className="glow-dot" />
                Testnet Live
              </span>
              <span className="tag">
                <Zap size={11} className="text-white" />
                Proof-of-Infinity
              </span>
              <span className="tag">
                Permission-less
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="font-poppins font-black text-4xl sm:text-5xl lg:text-6xl text-white leading-[1.08]">
                Welcome to the{' '}
                <span className="text-gradient">Entropy Network</span>
              </h1>
              <p className="font-poppins font-semibold text-xl text-zinc-500 tracking-wide">
                Deterministic. Immutable. Gamified.
              </p>
              <p className="text-zinc-500 text-lg leading-relaxed max-w-lg">
                Lock ETH. Claim Flux daily. Trade, build rockets, and{' '}
                <span className="font-semibold text-zinc-300">win real ETH rewards.</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button className="btn-primary text-base px-7 py-3.5">
                <Zap size={16} fill="black" />
                Claim Your Flux
              </button>
              <button onClick={onOpenDex} className="btn-secondary text-base px-7 py-3.5">
                Flux Exchange
                <ExternalLink size={15} />
              </button>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-2">
                {['#FFFFFF', '#D4D4D4', '#A3A3A3', '#737373'].map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-zinc-900"
                    style={{ backgroundColor: color, zIndex: 4 - i }}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">2,400+ Testers</p>
                <p className="text-xs text-zinc-500">actively exploring E-Net</p>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div>
                <p className="text-sm font-semibold text-white">Season 1</p>
                <p className="text-xs text-zinc-500">Cosmic Jackpot open</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative w-full max-w-lg h-[480px]">
              <div className="absolute inset-4 rounded-4xl bg-bg-card border border-border-default shadow-card" />
              <RocketIllustration />

              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-border-default p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 font-medium">Current Block</p>
                      <p className="font-poppins font-bold text-white text-lg">#1,048,576</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-500 font-medium">Block Time</p>
                      <p className="font-poppins font-bold text-white text-lg">2.1s</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 font-medium">Flux Rate</p>
                      <p className="font-poppins font-bold text-white text-lg">1 / day</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex justify-center pb-8">
        <a
          href="#status"
          className="flex flex-col items-center gap-1 text-zinc-600 hover:text-zinc-400 transition-colors animate-bounce-gentle"
        >
          <span className="text-xs font-medium">Explore</span>
          <ChevronDown size={18} />
        </a>
      </div>
    </section>
  );
}

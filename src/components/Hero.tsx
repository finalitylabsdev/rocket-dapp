import { Zap, ExternalLink, ChevronDown, Lock, Clock } from 'lucide-react';
import { useGameState } from '../context/GameState';
import { useWallet } from '../hooks/useWallet';
import PhiSymbol from './brand/PhiSymbol';

interface HeroProps {
  onOpenDex: () => void;
}

function formatCooldown(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function Hero({ onOpenDex }: HeroProps) {
  const game = useGameState();
  const wallet = useWallet();

  const DAY_MS = 24 * 60 * 60 * 1000;
  const cooldownRemaining = game.lastDailyClaim ? Math.max(0, DAY_MS - (Date.now() - game.lastDailyClaim)) : 0;
  const canClaim = !game.lastDailyClaim || cooldownRemaining === 0;

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
              {!wallet.isConnected ? (
                <button onClick={wallet.connect} className="btn-primary text-base px-7 py-3.5">
                  <Zap size={16} fill="black" />
                  Connect Wallet
                </button>
              ) : !game.lockedEth ? (
                <button onClick={game.lockEth} className="btn-primary text-base px-7 py-3.5">
                  <Lock size={16} />
                  Lock 0.05 ETH
                </button>
              ) : (
                <button
                  onClick={() => game.claimDailyFlux()}
                  disabled={!canClaim}
                  className="btn-primary text-base px-7 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canClaim ? (
                    <>
                      <Zap size={16} fill="black" />
                      Claim 10 Flux
                    </>
                  ) : (
                    <>
                      <Clock size={16} />
                      {formatCooldown(cooldownRemaining)}
                    </>
                  )}
                </button>
              )}
              <button onClick={onOpenDex} className="btn-secondary text-base px-7 py-3.5">
                Flux Exchange
                <ExternalLink size={15} />
              </button>
            </div>

            <div className="flex items-center gap-6 pt-2">
              {wallet.isConnected && (
                <>
                  <div className="flex items-center gap-2">
                    <PhiSymbol size={18} color="#E8ECF4" />
                    <p className="font-poppins font-bold text-white text-lg">{game.fluxBalance}</p>
                    <p className="text-xs text-zinc-500">FLUX</p>
                  </div>
                  <div className="h-8 w-px bg-zinc-800" />
                </>
              )}
              <div>
                <p className="text-sm font-semibold text-white">Season 1</p>
                <p className="text-xs text-zinc-500">Cosmic Jackpot open</p>
              </div>
              {game.scores.length > 0 && (
                <>
                  <div className="h-8 w-px bg-zinc-800" />
                  <div>
                    <p className="text-sm font-semibold text-white">{Math.max(...game.scores).toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">Best Grav Score</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative w-full max-w-lg">
              <div className="rounded-4xl bg-bg-card border border-border-default shadow-card p-8 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-border-default flex items-center justify-center mx-auto mb-4">
                    <Zap size={28} className="text-white" fill="white" />
                  </div>
                  <p className="font-poppins font-bold text-white text-lg">Entropy Gate</p>
                  <p className="text-sm text-zinc-500 mt-1">Lock ETH to begin. Claim Flux daily.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-900 rounded-2xl p-3 text-center border border-border-subtle">
                    <p className="font-poppins font-bold text-white text-lg">0.05</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">ETH to lock</p>
                  </div>
                  <div className="bg-zinc-900 rounded-2xl p-3 text-center border border-border-subtle">
                    <p className="font-poppins font-bold text-white text-lg">100</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Flux on lock</p>
                  </div>
                  <div className="bg-zinc-900 rounded-2xl p-3 text-center border border-border-subtle">
                    <p className="font-poppins font-bold text-white text-lg">10</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Flux / day</p>
                  </div>
                </div>
                {game.lockedEth && (
                  <div className="flex items-center justify-center gap-2 rounded-2xl p-3 border" style={{ background: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.2)' }}>
                    <Lock size={14} style={{ color: '#4ADE80' }} />
                    <span className="text-sm font-bold" style={{ color: '#4ADE80' }}>ETH Locked</span>
                    <span className="text-xs text-zinc-500 ml-auto">{game.fluxBalance} Flux available</span>
                  </div>
                )}
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

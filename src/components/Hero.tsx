import { ChevronDown, ExternalLink, Lock, Wallet, Zap } from 'lucide-react';
import { useEthLockState } from '../context/EthLockState';
import { useGameState } from '../context/GameState';
import { useWallet } from '../hooks/useWallet';
import PhiSymbol from './brand/PhiSymbol';
import LaunchCountdown from './LaunchCountdown';

interface HeroProps {
  onOpenDex: () => void;
  onOpenGate: () => void;
  onOpenWallet: () => void;
}

export default function Hero({ onOpenDex, onOpenGate, onOpenWallet }: HeroProps) {
  const wallet = useWallet();
  const game = useGameState();
  const ethLock = useEthLockState();

  const gateLabel = !wallet.isConnected
    ? 'Open Entropy Gate'
    : ethLock.isLocked
      ? 'Claim at the Gate'
      : 'Unlock the Gate';

  const gateStatus = !wallet.isConnected
    ? 'Connect a wallet to check gate status.'
    : ethLock.status === 'confirmed'
      ? 'ETH locked. Daily FLUX claims are enabled.'
      : ethLock.statusDetail;

  return (
    <section className="relative min-h-[76vh] flex flex-col overflow-hidden pt-20">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
        <div className="w-full py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
            <div className="flex flex-wrap justify-center gap-2">
              <span className="tag">
                <div className="glow-dot" />
                Testnet Live
              </span>
              <span className="tag">
                <Lock size={11} />
                Gate + Wallet Split
              </span>
              <span className="tag">
                Overview Funnel
              </span>
            </div>

            <LaunchCountdown />

            <div className="space-y-4">
              <h1 className="font-mono font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary leading-[1.08] uppercase tracking-tight">
                Enter the{' '}
                <span className="text-dot-green">Entropy Network</span>
              </h1>
              <p className="font-mono font-semibold text-lg sm:text-xl text-text-muted tracking-[0.3em] uppercase">
                Deterministic. Immutable. Gamified.
              </p>
              <p className="text-text-muted text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Start at the gate, route claimed FLUX through the exchange, and keep moving toward
                the leaderboard. Home now stays focused on orientation and wayfinding.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
              {!wallet.isConnected ? (
                <button
                  onClick={() => void wallet.connect()}
                  disabled={wallet.isConnecting}
                  className="btn-primary text-sm sm:text-base px-6 py-3.5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={16} />
                  {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              ) : (
                <button
                  onClick={onOpenGate}
                  className="btn-primary text-sm sm:text-base px-6 py-3.5 justify-center"
                >
                  <Lock size={16} />
                  {gateLabel}
                </button>
              )}
              <button onClick={onOpenDex} className="btn-secondary text-sm sm:text-base px-6 py-3.5 justify-center">
                Entropy Exchange
                <ExternalLink size={15} />
              </button>
              <button
                onClick={onOpenWallet}
                className="flex items-center justify-center gap-2 border border-border-default px-5 py-3.5 text-sm font-mono font-semibold uppercase tracking-wider text-text-primary hover:border-border-strong transition-colors"
              >
                <Wallet size={15} />
                Wallet Overview
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-left">
              <div className="bg-bg-card border border-border-subtle p-5">
                <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.16em]">
                  Entropy Gate
                </p>
                <p className="mt-3 font-mono font-bold text-text-primary text-lg uppercase tracking-wider">
                  {wallet.isConnected && ethLock.isLocked ? 'Gate Open' : 'Start Here'}
                </p>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  {gateStatus}
                </p>
              </div>

              <div className="bg-bg-card border border-border-subtle p-5">
                <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.16em]">
                  Wallet
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <PhiSymbol size={16} color="var(--color-text-primary)" />
                  <p className="font-mono font-bold text-text-primary text-lg">
                    {wallet.isConnected ? game.fluxBalance : '--'}
                  </p>
                  <p className="text-xs text-text-muted font-mono uppercase tracking-wider">FLUX</p>
                </div>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  {wallet.isConnected
                    ? `Connected as ${wallet.displayAddress}.`
                    : 'Connect to load live FLUX and open the wallet page.'}
                </p>
              </div>

              <div className="bg-bg-card border border-border-subtle p-5">
                <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.16em]">
                  Leaderboard
                </p>
                <p className="mt-3 font-mono font-bold text-text-primary text-lg uppercase tracking-wider">
                  Season 1 Active
                </p>
                <p className="mt-2 text-sm text-text-muted leading-relaxed">
                  Track Cosmic Jackpot standings from the dashboard cards and footer links while the home header stays leaner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex justify-center pb-8">
        <a
          href="#status"
          className="flex flex-col items-center gap-1 text-text-muted hover:text-text-secondary transition-colors"
        >
          <span className="text-xs font-mono font-medium uppercase tracking-wider">Explore</span>
          <ChevronDown size={18} />
        </a>
      </div>
    </section>
  );
}

import type { ComponentType } from 'react';
import { useState, useEffect } from 'react';
import { APP_VERSION } from '../config/app';
import {
  type LucideProps,
  Menu, X, Trophy, Zap, LogOut, ArrowLeft, Wallet,
  ArrowLeftRight, FlaskConical, Compass,
} from 'lucide-react';
import PhiSymbol from './brand/PhiSymbol';
import { useWallet } from '../hooks/useWallet';
import { useGameState } from '../context/GameState';

import type { Page } from '../App';
import {
  DEX_ENABLED,
  STAR_VAULT_ENABLED,
  NEBULA_BIDS_ENABLED,
  ROCKET_LAB_ENABLED,
} from '../config/flags';

interface ShellNavProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

function StarVaultCubeIcon({ size = 16, className, style, ...props }: LucideProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3 19 7 12 11 5 7 12 3Z" />
      <path d="M5 7v8l7 4v-8" />
      <path d="M19 7v8l-7 4" />
      <path d="M12 11 19 7" />
    </svg>
  );
}

const PAGE_META: Record<Exclude<Page, 'home'>, { title: string; subtitle: string; icon: ComponentType<LucideProps> }> = {
  gate:        { title: 'Entropy Gate',             subtitle: 'Lock ETH · Claim Φ',            icon: Zap },
  wallet:      { title: 'Wallet Overview',          subtitle: 'Live Φ · Token Scaffold',       icon: Wallet },
  dex:         { title: 'Entropy Exchange',         subtitle: 'Constant-Product AMM · ɸ-net', icon: ArrowLeftRight },
  mystery:     { title: 'Star Vault',               subtitle: 'Unbox · Bid · Collect',         icon: StarVaultCubeIcon },
  lab:         { title: 'Rocket Lab',               subtitle: 'Build & Launch',                icon: FlaskConical },
  leaderboard: { title: 'Cosmic Jackpot',           subtitle: 'Season 1 · Rankings',           icon: Trophy },
};

const pageEnabled: Record<Exclude<Page, 'home'>, boolean> = {
  gate: true,
  wallet: true,
  dex: DEX_ENABLED,
  mystery: STAR_VAULT_ENABLED || NEBULA_BIDS_ENABLED,
  lab: ROCKET_LAB_ENABLED,
  leaderboard: true,
};

export default function ShellNav({ page, onNavigate }: ShellNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wallet = useWallet();
  const game = useGameState();

  const isHome = page === 'home';

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  // Close mobile menu on page change
  useEffect(() => {
    setMobileOpen(false);
  }, [page]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isHome
          ? scrolled || mobileOpen
            ? 'bg-bg-base/95 backdrop-blur-md border-b border-border-subtle'
            : 'bg-transparent'
          : 'bg-bg-base/95 backdrop-blur-md border-b border-border-subtle'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left side */}
          {isHome ? (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 flex items-center justify-center"
                style={{ background: 'var(--color-text-primary)' }}
              >
                <PhiSymbol size={20} color="var(--color-bg-base)" />
              </div>
              <div>
                <span className="font-mono font-bold text-lg leading-none uppercase tracking-wider text-text-primary">Entropy</span>
                <div className="mt-0.5 text-[10px] font-medium leading-none font-mono tracking-wider text-text-muted">
                  {`TESTNET v${APP_VERSION}`}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group"
              >
                <div className="w-8 h-8 bg-bg-card border border-border-default group-hover:border-border-strong flex items-center justify-center transition-all">
                  <ArrowLeft size={15} className="text-text-secondary group-hover:text-text-primary" />
                </div>
                <span className="text-sm font-mono font-medium hidden sm:inline uppercase tracking-wider">Back</span>
              </button>
              <div className="h-5 w-px bg-border-default" />
              {(() => {
                const meta = PAGE_META[page];
                return (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 flex items-center justify-center"
                      style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.35)' }}
                    >
                      <meta.icon size={16} style={{ color: '#94A3B8' }} />
                    </div>
                    <div>
                      <span className="font-mono font-bold text-text-primary text-base leading-none uppercase tracking-wider">{meta.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono font-medium text-text-muted leading-none uppercase tracking-wider">{meta.subtitle}</span>
                        {!pageEnabled[page] && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-wider bg-text-muted text-bg-base leading-none">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-1">
            <a
              href="https://explorer.o.day/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-mono font-medium text-sm px-3 py-2 border mr-1 transition-all duration-200 bg-bg-card/50 border-border-subtle text-text-secondary hover:bg-bg-card hover:text-text-primary"
            >
              <Compass size={14} />
              <span className="uppercase tracking-wider">Explorer</span>
            </a>
            <button
              onClick={() => onNavigate('wallet')}
              className={`flex items-center gap-2 font-mono font-medium text-sm px-3 py-2 border mr-1 transition-all duration-200 ${
                page === 'wallet'
                  ? 'bg-bg-card border-border-strong text-text-primary'
                  : 'bg-bg-card/50 border-border-subtle text-text-secondary hover:bg-bg-card hover:text-text-primary'
              }`}
            >
              <Wallet size={14} />
              <span className="uppercase tracking-wider">Wallet</span>
              {wallet.isConnected && (
                <>
                  <span className="text-text-muted">/</span>
                  <PhiSymbol size={13} color="var(--color-text-primary)" />
                  <span className="font-bold text-text-primary">{game.fluxBalance}</span>
                </>
              )}
            </button>
            {wallet.isConnected ? (
              <div className="ml-2 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-bg-card border border-border-subtle px-3 py-2">
                  <div className="glow-dot" />
                  <span className="text-xs font-mono font-semibold text-text-primary">{wallet.displayAddress}</span>
                </div>
                <button
                  onClick={() => void wallet.disconnect()}
                  disabled={wallet.isConnecting}
                  className="w-9 h-9 bg-bg-card border border-border-subtle flex items-center justify-center hover:border-border-strong transition-all"
                >
                  <LogOut size={14} className="text-text-secondary" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => void wallet.connect()}
                disabled={wallet.isConnecting}
                className="ml-2 btn-primary text-sm py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={14} />
                {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-bg-card transition-colors"
          >
            {mobileOpen ? <X size={20} className="text-text-primary" /> : <Menu size={20} className="text-text-primary" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-border-subtle pt-4 bg-bg-base/95 backdrop-blur-md">
            <a
              href="https://explorer.o.day/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2 text-text-secondary font-mono font-medium text-sm px-4 py-3 hover:bg-bg-card"
            >
              <Compass size={15} />
              <span className="uppercase tracking-wider">Explorer</span>
            </a>
            <button
              onClick={() => { onNavigate('wallet'); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 text-text-secondary font-mono font-medium text-sm px-4 py-3 hover:bg-bg-card"
            >
              <Wallet size={15} />
              <span className="uppercase tracking-wider">Wallet</span>
              {wallet.isConnected && (
                <>
                  <span className="text-text-muted">/</span>
                  <PhiSymbol size={13} color="var(--color-text-primary)" />
                  <span className="font-bold text-text-primary">{game.fluxBalance}</span>
                  <span className="text-xs text-text-muted font-mono">Φ</span>
                </>
              )}
            </button>
            <div className="pt-2 px-2">
              {wallet.isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-bg-card border border-border-subtle px-3 py-2.5">
                    <div className="glow-dot" />
                    <span className="text-xs font-mono font-semibold text-text-primary">{wallet.displayAddress}</span>
                  </div>
                  <button
                    onClick={() => void wallet.disconnect()}
                    disabled={wallet.isConnecting}
                    className="w-10 h-10 bg-bg-card border border-border-subtle flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut size={14} className="text-text-secondary" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => void wallet.connect()}
                  disabled={wallet.isConnecting}
                  className="btn-primary w-full justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={14} />
                  {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

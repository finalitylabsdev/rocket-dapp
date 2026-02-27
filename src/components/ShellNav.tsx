import { useState, useEffect } from 'react';
import {
  Menu, X, Trophy, FileText, Zap, LogOut, Sun, Moon, ArrowLeft,
  ArrowLeftRight, Gift, FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import PhiSymbol from './brand/PhiSymbol';
import { useWallet } from '../hooks/useWallet';
import { useGameState } from '../context/GameState';
import { useTheme } from '../context/ThemeContext';
import type { Page } from '../App';

interface ShellNavProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

const PAGE_META: Record<Exclude<Page, 'home'>, { title: string; subtitle: string; icon: typeof Zap }> = {
  dex:         { title: 'Entropy Exchange',         subtitle: 'Constant-Product AMM · ɸ-net', icon: ArrowLeftRight },
  mystery:     { title: 'Star Vault & Nebula Bids', subtitle: 'App 3 · ɸ-net Testnet',        icon: Gift },
  lab:         { title: 'Rocket Lab',               subtitle: 'Build & Launch',                icon: FlaskConical },
  leaderboard: { title: 'Cosmic Jackpot',           subtitle: 'Season 1 · Rankings',           icon: Trophy },
};

export default function ShellNav({ page, onNavigate }: ShellNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wallet = useWallet();
  const game = useGameState();
  const { theme, toggleTheme } = useTheme();

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
      className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4"
    >
      <div className="max-w-7xl mx-auto">
        <div
          className={`app-window px-4 sm:px-5 lg:px-6 transition-all duration-300 ${
            isHome && !scrolled ? 'bg-bg-card/72' : ''
          }`}
        >
          <div className="flex items-center justify-between h-16 md:h-[4.6rem]">
          {/* Left side */}
          {isHome ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent-lime) 0%, #d7ff8f 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 12px 24px rgba(184,255,85,0.18)',
                }}
              >
                <PhiSymbol size={20} color="#081008" />
              </div>
              <div>
                <span className="font-mono font-bold text-lg leading-none tracking-tight text-text-primary">Entropy</span>
                <div className="mt-0.5 text-[10px] font-medium leading-none font-mono tracking-wide text-text-muted">
                  ɸ-net • Proof-of-Infinity
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group app-chip px-2 py-2"
              >
                <div className="w-8 h-8 bg-bg-inset border border-border-default group-hover:border-border-strong rounded-xl flex items-center justify-center transition-all">
                  <ArrowLeft size={15} className="text-text-secondary group-hover:text-text-primary" />
                </div>
                <span className="text-sm font-mono font-medium hidden sm:inline">Back</span>
              </button>
              <div className="h-5 w-px bg-border-default" />
              {(() => {
                const meta = PAGE_META[page];
                return (
                  <div className="flex items-center gap-3">
                    <div
                      className={page === 'lab' ? 'w-9 h-9 flex items-center justify-center rounded-2xl' : 'w-9 h-9 flex items-center justify-center rounded-2xl'}
                      style={
                        page === 'lab'
                          ? { background: 'rgba(148,163,184,0.14)', border: '1px solid rgba(148,163,184,0.28)' }
                          : {
                            background: 'linear-gradient(135deg, var(--color-accent-lime) 0%, #d7ff8f 100%)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 24px rgba(184,255,85,0.18)',
                          }
                      }
                    >
                      {page === 'lab'
                        ? <meta.icon size={16} style={{ color: '#94A3B8' }} />
                        : page === 'leaderboard'
                          ? <meta.icon size={15} className="text-black" />
                          : <meta.icon size={16} className="text-black" fill="black" />
                      }
                    </div>
                    <div>
                      <span className="font-mono font-bold text-text-primary text-base leading-none tracking-tight">{meta.title}</span>
                      <div className="text-[10px] font-mono font-medium text-text-muted leading-none mt-0.5 tracking-wide">{meta.subtitle}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-2">
            {wallet.isConnected && (
              <div className="flex items-center gap-1.5 text-text-secondary font-mono font-medium text-sm px-3 py-2 app-chip mr-1">
                <PhiSymbol size={13} color="var(--color-text-primary)" />
                <span className="font-bold text-text-primary">{game.fluxBalance}</span>
              </div>
            )}
            {isHome && (
              <>
                <button
                  onClick={() => toast.info('Documentation coming soon')}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary font-mono font-medium text-sm px-4 py-2 app-chip"
                >
                  <FileText size={15} />
                  DOCS
                </button>
                <button
                  onClick={() => onNavigate('leaderboard')}
                  className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary font-mono font-medium text-sm px-4 py-2 app-chip"
                >
                  <Trophy size={15} />
                  JACKPOT
                </button>
              </>
            )}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 text-text-secondary hover:text-text-primary app-chip"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {wallet.isConnected ? (
              <div className="ml-2 flex items-center gap-2">
                <div className="flex items-center gap-2 app-chip px-3 py-2">
                  <div className="glow-dot" />
                  <span className="text-xs font-mono font-semibold text-text-primary">{wallet.displayAddress}</span>
                </div>
                <button
                  onClick={() => void wallet.disconnect()}
                  disabled={wallet.isConnecting}
                  className="w-10 h-10 app-chip flex items-center justify-center hover:border-border-strong transition-all"
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
            className="md:hidden w-10 h-10 flex items-center justify-center app-chip"
          >
            {mobileOpen ? <X size={20} className="text-text-primary" /> : <Menu size={20} className="text-text-primary" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-border-subtle pt-4">
            {wallet.isConnected && (
              <div className="flex items-center gap-2 px-4 py-2 app-chip">
                <PhiSymbol size={13} color="var(--color-text-primary)" />
                <span className="font-bold text-text-primary text-sm font-mono">{game.fluxBalance}</span>
                <span className="text-xs text-text-muted font-mono">FLUX</span>
              </div>
            )}
            {isHome && (
              <>
                <button
                  onClick={() => { toast.info('Documentation coming soon'); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 text-text-secondary font-mono font-medium text-sm px-4 py-3 app-chip"
                >
                  <FileText size={15} />
                  DOCS
                </button>
                <button
                  onClick={() => { onNavigate('leaderboard'); setMobileOpen(false); }}
                  className="w-full flex items-center gap-2 text-text-secondary font-mono font-medium text-sm px-4 py-3 app-chip"
                >
                  <Trophy size={15} />
                  JACKPOT
                </button>
              </>
            )}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 text-text-secondary font-mono font-medium text-sm px-4 py-3 app-chip"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
            </button>
            <div className="pt-2 px-2">
              {wallet.isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 app-chip px-3 py-2.5">
                    <div className="glow-dot" />
                    <span className="text-xs font-mono font-semibold text-text-primary">{wallet.displayAddress}</span>
                  </div>
                  <button
                    onClick={() => void wallet.disconnect()}
                    disabled={wallet.isConnecting}
                    className="w-10 h-10 app-chip flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </nav>
  );
}

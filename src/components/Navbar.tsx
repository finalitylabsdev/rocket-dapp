import { useState, useEffect } from 'react';
import { Menu, X, Trophy, FileText, Zap, LogOut, Sun, Moon } from 'lucide-react';
import PhiSymbol from './brand/PhiSymbol';
import { useWallet } from '../hooks/useWallet';
import { useGameState } from '../context/GameState';
import { useTheme } from '../context/ThemeContext';
import type { Page } from '../App';

interface NavbarProps {
  onNavigate?: (page: Page) => void;
}

export default function Navbar({ onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wallet = useWallet();
  const game = useGameState();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-bg-base/95 backdrop-blur-md border-b border-border-subtle'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{ background: 'var(--color-text-primary)' }}
            >
              <PhiSymbol size={20} color="var(--color-bg-base)" />
            </div>
            <div>
              <span className="font-mono font-bold text-lg leading-none uppercase tracking-wider text-text-primary">Entropy</span>
              <div className="text-[10px] font-medium leading-none mt-0.5 font-mono tracking-wider text-text-muted">ɸ-net · PROOF-OF-INFINITY</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {wallet.isConnected && (
              <div className="flex items-center gap-1.5 text-text-secondary font-mono font-medium text-sm px-3 py-2 bg-bg-card/50 border border-border-subtle mr-1">
                <PhiSymbol size={13} color="var(--color-text-primary)" />
                <span className="font-bold text-text-primary">{game.fluxBalance}</span>
              </div>
            )}
            <a
              href="#"
              className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary font-mono font-medium text-sm px-4 py-2 hover:bg-bg-card transition-all duration-200"
            >
              <FileText size={15} />
              DOCS
            </a>
            <button
              onClick={() => onNavigate?.('leaderboard')}
              className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary font-mono font-medium text-sm px-4 py-2 hover:bg-bg-card transition-all duration-200"
            >
              <Trophy size={15} />
              JACKPOT
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
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

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-bg-card transition-colors"
          >
            {mobileOpen ? <X size={20} className="text-text-primary" /> : <Menu size={20} className="text-text-primary" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-border-subtle pt-4">
            {wallet.isConnected && (
              <div className="flex items-center gap-2 px-4 py-2">
                <PhiSymbol size={13} color="var(--color-text-primary)" />
                <span className="font-bold text-text-primary text-sm font-mono">{game.fluxBalance}</span>
                <span className="text-xs text-text-muted font-mono">FLUX</span>
              </div>
            )}
            <a href="#" className="flex items-center gap-2 text-text-secondary font-mono font-medium text-sm px-4 py-3 hover:bg-bg-card">
              <FileText size={15} />
              DOCS
            </a>
            <button
              onClick={() => { onNavigate?.('leaderboard'); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 text-text-secondary font-mono font-medium text-sm px-4 py-3 hover:bg-bg-card"
            >
              <Trophy size={15} />
              JACKPOT
            </button>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 text-text-secondary font-mono font-medium text-sm px-4 py-3 hover:bg-bg-card"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              {theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}
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

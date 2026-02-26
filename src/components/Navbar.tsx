import { useState, useEffect } from 'react';
import { Menu, X, Trophy, FileText, Zap, LogOut } from 'lucide-react';
import PhiSymbol from './brand/PhiSymbol';
import { useWallet } from '../hooks/useWallet';
import { useGameState } from '../context/GameState';
import type { Page } from '../App';

interface NavbarProps {
  onNavigate?: (page: Page) => void;
}

export default function Navbar({ onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wallet = useWallet();
  const game = useGameState();

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
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#E8ECF4' }}
            >
              <PhiSymbol size={20} color="#06080F" />
            </div>
            <div>
              <span className="font-poppins font-bold text-lg leading-none" style={{ color: '#E8ECF4' }}>Entropy</span>
              <div className="text-[10px] font-medium leading-none mt-0.5" style={{ color: '#4A5468' }}>E-Net · Proof-of-Infinity</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {wallet.isConnected && (
              <div className="flex items-center gap-1.5 text-zinc-400 font-medium text-sm px-3 py-2 rounded-xl bg-zinc-900/50 mr-1">
                <PhiSymbol size={13} color="#E8ECF4" />
                <span className="font-bold text-white">{game.fluxBalance}</span>
              </div>
            )}
            <a
              href="#"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white font-medium text-sm px-4 py-2 rounded-xl hover:bg-zinc-900 transition-all duration-200"
            >
              <FileText size={15} />
              Docs
            </a>
            <button
              onClick={() => onNavigate?.('leaderboard')}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white font-medium text-sm px-4 py-2 rounded-xl hover:bg-zinc-900 transition-all duration-200"
            >
              <Trophy size={15} />
              Cosmic Jackpot
            </button>
            {wallet.isConnected ? (
              <div className="ml-2 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-zinc-900 border border-border-subtle rounded-2xl px-3 py-2">
                  <div className="glow-dot" />
                  <span className="text-xs font-semibold text-zinc-300">{wallet.displayAddress}</span>
                </div>
                <button
                  onClick={wallet.disconnect}
                  className="w-9 h-9 rounded-xl bg-zinc-900 border border-border-subtle flex items-center justify-center hover:border-border-strong transition-all"
                >
                  <LogOut size={14} className="text-zinc-400" />
                </button>
              </div>
            ) : (
              <button onClick={wallet.connect} className="ml-2 btn-primary text-sm py-2.5 px-5">
                <Zap size={14} fill="black" />
                Connect Wallet
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-900 transition-colors"
          >
            {mobileOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-border-subtle pt-4">
            {wallet.isConnected && (
              <div className="flex items-center gap-2 px-4 py-2">
                <PhiSymbol size={13} color="#E8ECF4" />
                <span className="font-bold text-white text-sm">{game.fluxBalance}</span>
                <span className="text-xs text-zinc-500">FLUX</span>
              </div>
            )}
            <a href="#" className="flex items-center gap-2 text-zinc-400 font-medium text-sm px-4 py-3 rounded-xl hover:bg-zinc-900">
              <FileText size={15} />
              Docs
            </a>
            <button
              onClick={() => { onNavigate?.('leaderboard'); setMobileOpen(false); }}
              className="w-full flex items-center gap-2 text-zinc-400 font-medium text-sm px-4 py-3 rounded-xl hover:bg-zinc-900"
            >
              <Trophy size={15} />
              Cosmic Jackpot
            </button>
            <div className="pt-2 px-2">
              {wallet.isConnected ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-border-subtle rounded-2xl px-3 py-2.5">
                    <div className="glow-dot" />
                    <span className="text-xs font-semibold text-zinc-300">{wallet.displayAddress}</span>
                  </div>
                  <button
                    onClick={wallet.disconnect}
                    className="w-10 h-10 rounded-xl bg-zinc-900 border border-border-subtle flex items-center justify-center"
                  >
                    <LogOut size={14} className="text-zinc-400" />
                  </button>
                </div>
              ) : (
                <button onClick={wallet.connect} className="btn-primary w-full justify-center text-sm">
                  <Zap size={14} fill="black" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

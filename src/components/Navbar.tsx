import { useState, useEffect } from 'react';
import { Menu, X, Trophy, FileText, Zap } from 'lucide-react';
import PhiSymbol from './brand/PhiSymbol';
import type { Page } from '../App';

interface NavbarProps {
  onNavigate?: (page: Page) => void;
}

export default function Navbar({ onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <button className="ml-2 btn-primary text-sm py-2.5 px-5">
              <Zap size={14} fill="black" />
              Connect Wallet
            </button>
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
              <button className="btn-primary w-full justify-center text-sm">
                <Zap size={14} fill="black" />
                Connect Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

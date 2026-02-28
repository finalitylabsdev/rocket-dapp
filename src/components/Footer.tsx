import { Zap } from 'lucide-react';
import type { Page } from '../App';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

export default function Footer({ onNavigate }: FooterProps) {

  return (
    <footer className="bg-bg-card border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 flex items-center justify-center" style={{ background: 'var(--color-text-primary)' }}>
                <Zap size={14} style={{ color: 'var(--color-bg-base)' }} fill="var(--color-bg-base)" />
              </div>
              <div>
                <span className="font-mono font-bold text-text-primary text-sm leading-none uppercase tracking-wider">Entropy</span>
                <div className="text-[9px] font-mono font-medium text-text-muted mt-0.5 uppercase tracking-wider">ɸ-net Testnet</div>
              </div>
            </div>
            <p className="text-text-muted text-xs leading-relaxed max-w-xs">
              Permissionless. Immutable. Proof of Infinity.
            </p>
            <p className="text-text-muted text-xs leading-relaxed max-w-xs mt-1">
              Acquire Φ. Build. Compete. Strengthen the network.
            </p>
          </div>

          <div className="flex gap-10">
            <div>
              <h4 className="font-mono font-bold text-text-secondary text-xs mb-2 uppercase tracking-wider">Join Us</h4>
              <ul className="space-y-1">
                <li>
                  <a href="https://x.com/entropy" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    X
                  </a>
                </li>
                <li>
                  <a href="https://t.me/entropy" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    Telegram
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono font-bold text-text-secondary text-xs mb-2 uppercase tracking-wider">Learn More</h4>
              <ul className="space-y-1">
                <li>
                  <a href="https://uvd.xyz/" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    Universe Dollar
                  </a>
                </li>
                <li>
                  <a href="https://ordo.foundation/" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    Ordo Foundation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono font-bold text-text-secondary text-xs mb-2 uppercase tracking-wider">Apps</h4>
              <ul className="space-y-1">
                <li>
                  <button onClick={() => onNavigate('gate')} className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    Gate
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('mystery')} className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    Vault
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('lab')} className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    Lab
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono font-bold text-text-secondary text-xs mb-2 uppercase tracking-wider">Fun</h4>
              <ul className="space-y-1">
                <li>
                  <button onClick={() => onNavigate('mystery')} className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    Auction
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('leaderboard')} className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    Launch
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('leaderboard')} className="text-text-muted hover:text-text-primary text-xs transition-colors duration-150">
                    Leaderboard
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle">
          <p className="text-text-muted text-xs font-mono">
            © 2026 Entropy Network. Experimental infrastructure.
          </p>
        </div>
      </div>
    </footer>
  );
}

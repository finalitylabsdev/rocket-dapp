import { Zap } from 'lucide-react';
import { APP_VERSION } from '../config/app';
import { useTheme } from '../context/ThemeContext';
import type { Page } from '../App';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { ambientFxEnabled, toggleAmbientFx } = useTheme();

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
              Permission-less. Immutable. Proof-of-Infinity. Lock ETH. Claim Flux. Build rockets. Win real ETH on-chain.
            </p>
          </div>

          <div className="flex gap-10">
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
                    Jackpot
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-xs font-mono">
            © 2026 Entropy Protocol. This is a <b>Testnet</b> — not financial advice.
          </p>
          <button
            type="button"
            onClick={toggleAmbientFx}
            className="group flex cursor-default items-center gap-2 border-0 bg-transparent p-0 hover:cursor-pointer"
            aria-label={ambientFxEnabled ? 'Disable ambient cosmic background' : 'Enable ambient cosmic background'}
            aria-pressed={ambientFxEnabled}
          >
            <span
              className="relative block h-2.5 w-2.5 border transition-all duration-200"
              style={{
                background: ambientFxEnabled ? '#4ADE80' : 'var(--color-border-strong)',
                borderColor: ambientFxEnabled ? 'rgba(74,222,128,0.45)' : 'var(--color-border-default)',
                boxShadow: ambientFxEnabled
                  ? '0 0 0 1px rgba(74,222,128,0.08)'
                  : '0 0 0 1px rgba(58,74,96,0)',
              }}
            >
              <span
                className="absolute inset-[2px] opacity-0 transition-all duration-200 group-hover:opacity-100"
                style={{
                  background: ambientFxEnabled ? 'rgba(6,8,15,0.55)' : 'rgba(248,250,252,0.55)',
                  transform: ambientFxEnabled ? 'translate(1px, -1px)' : 'translate(-1px, 1px)',
                }}
              />
            </span>
            <span className="text-[10px] font-mono font-medium text-text-muted">{`ɸ-net v${APP_VERSION} — SEASON 1 ACTIVE`}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

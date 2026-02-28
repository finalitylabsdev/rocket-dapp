import { Zap, Github, Twitter, FileText } from 'lucide-react';
import { APP_VERSION } from '../config/app';
import { useTheme } from '../context/ThemeContext';
import type { Page } from '../App';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

type FooterLink = { label: string; action?: () => void; comingSoon?: boolean };

export default function Footer({ onNavigate }: FooterProps) {
  const { ambientFxEnabled, toggleAmbientFx } = useTheme();

  const links: Record<string, FooterLink[]> = {
    Protocol: [
      { label: 'Whitepaper', comingSoon: true },
      { label: 'Docs', comingSoon: true },
      { label: 'GitHub', comingSoon: true },
      { label: 'Audit Report', comingSoon: true },
    ],
    Apps: [
      { label: 'Entropy Gate', action: () => onNavigate('gate') },
      { label: 'Entropy Exchange', action: () => onNavigate('dex') },
      { label: 'Star Vault & Nebula Bids', action: () => onNavigate('mystery') },
      { label: 'Celestial Assembler', comingSoon: true },
    ],
    Jackpot: [
      { label: 'Quantum Lift-Off', action: () => onNavigate('leaderboard') },
      { label: 'Cosmic Jackpot', action: () => onNavigate('leaderboard') },
      { label: 'Season 1 Prizes', comingSoon: true },
      { label: 'Prize Claim', comingSoon: true },
    ],
    Community: [
      { label: 'Twitter / X', comingSoon: true },
      { label: 'Discord', comingSoon: true },
      { label: 'Telegram', comingSoon: true },
      { label: 'Blog', comingSoon: true },
    ],
  };

  return (
    <footer className="bg-bg-card border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 flex items-center justify-center" style={{ background: 'var(--color-text-primary)' }}>
                <Zap size={18} style={{ color: 'var(--color-bg-base)' }} fill="var(--color-bg-base)" />
              </div>
              <div>
                <span className="font-mono font-bold text-text-primary text-lg leading-none uppercase tracking-wider">Entropy</span>
                <div className="text-[10px] font-mono font-medium text-text-muted mt-0.5 uppercase tracking-wider">ɸ-net Testnet</div>
              </div>
            </div>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs mb-6">
              Permission-less. Immutable. Proof-of-Infinity. Lock ETH. Claim Flux. Build rockets. Win real ETH on-chain.
            </p>
            <div className="flex items-center gap-2.5">
              {[
                { icon: <Twitter size={15} />, label: 'Twitter' },
                { icon: <Github size={15} />, label: 'GitHub' },
                { icon: <FileText size={15} />, label: 'Docs' },
              ].map((social, i) => (
                <span
                  key={i}
                  className="w-9 h-9 bg-bg-inset border border-border-default flex items-center justify-center text-text-muted/50 cursor-default"
                  aria-label={`${social.label} (coming soon)`}
                >
                  {social.icon}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-mono font-bold text-text-secondary text-sm mb-4 uppercase tracking-wider">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {item.comingSoon ? (
                      <span className="text-text-muted/50 text-sm cursor-default">
                        {item.label} <span className="text-[10px] font-mono uppercase tracking-wider">(Soon)</span>
                      </span>
                    ) : (
                      <button
                        onClick={item.action}
                        className="text-text-muted hover:text-text-primary text-sm transition-colors duration-150"
                      >
                        {item.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm font-mono">
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
              className="relative block h-3.5 w-3.5 border transition-all duration-200"
              style={{
                background: ambientFxEnabled ? '#4ADE80' : 'var(--color-border-strong)',
                borderColor: ambientFxEnabled ? 'rgba(74,222,128,0.45)' : 'var(--color-border-default)',
                boxShadow: ambientFxEnabled
                  ? '0 0 0 1px rgba(74,222,128,0.08)'
                  : '0 0 0 1px rgba(58,74,96,0)',
              }}
            >
              <span
                className="absolute inset-[3px] opacity-0 transition-all duration-200 group-hover:opacity-100"
                style={{
                  background: ambientFxEnabled ? 'rgba(6,8,15,0.55)' : 'rgba(248,250,252,0.55)',
                  transform: ambientFxEnabled ? 'translate(1px, -1px)' : 'translate(-1px, 1px)',
                }}
              />
            </span>
            <span className="text-sm font-mono font-medium text-text-muted">{`ɸ-net v${APP_VERSION} — SEASON 1 ACTIVE`}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

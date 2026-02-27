import { Zap, Github, Twitter, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { APP_VERSION } from '../config/app';
import { useTheme } from '../context/ThemeContext';
import type { Page } from '../App';

interface FooterProps {
  onNavigate: (page: Page) => void;
}

type FooterLink = { label: string; action: () => void };

export default function Footer({ onNavigate }: FooterProps) {
  const { ambientFxEnabled, toggleAmbientFx } = useTheme();

  const comingSoon = () => toast.info('Coming soon');

  const links: Record<string, FooterLink[]> = {
    Protocol: [
      { label: 'Whitepaper', action: comingSoon },
      { label: 'Docs', action: comingSoon },
      { label: 'GitHub', action: comingSoon },
      { label: 'Audit Report', action: comingSoon },
    ],
    Apps: [
      { label: 'Entropy Gate', action: () => onNavigate('home') },
      { label: 'Entropy Exchange', action: () => onNavigate('dex') },
      { label: 'Star Vault & Nebula Bids', action: () => onNavigate('mystery') },
      { label: 'Celestial Assembler', action: comingSoon },
    ],
    Jackpot: [
      { label: 'Quantum Lift-Off', action: () => onNavigate('leaderboard') },
      { label: 'Cosmic Jackpot', action: () => onNavigate('leaderboard') },
      { label: 'Season 1 Prizes', action: comingSoon },
      { label: 'Prize Claim', action: comingSoon },
    ],
    Community: [
      { label: 'Twitter / X', action: comingSoon },
      { label: 'Discord', action: comingSoon },
      { label: 'Telegram', action: comingSoon },
      { label: 'Blog', action: comingSoon },
    ],
  };

  return (
    <footer className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto app-window px-6 py-10 sm:px-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 flex items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent-lime) 0%, #d7ff8f 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 12px 24px rgba(184,255,85,0.18)',
                }}
              >
                <Zap size={18} style={{ color: '#09100a' }} fill="#09100a" />
              </div>
              <div>
                <span className="font-mono font-bold text-text-primary text-lg leading-none tracking-tight">Entropy</span>
                <div className="text-[10px] font-mono font-medium text-text-muted mt-0.5 tracking-wide">ɸ-net Testnet</div>
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
                <button
                  key={i}
                  onClick={comingSoon}
                  className="w-10 h-10 app-chip flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-strong transition-all duration-200"
                  aria-label={social.label}
                >
                  {social.icon}
                </button>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-mono font-bold text-text-secondary text-sm mb-4 tracking-tight">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-text-muted hover:text-text-primary text-sm transition-colors duration-150"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm font-mono">
            © 2026 Entropy Protocol. This is a <b>Testnet</b> and not financial advice.
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
                background: ambientFxEnabled ? 'var(--color-accent-lime)' : 'var(--color-border-strong)',
                borderColor: ambientFxEnabled ? 'rgba(184,255,85,0.5)' : 'var(--color-border-default)',
                boxShadow: ambientFxEnabled
                  ? '0 0 0 1px rgba(184,255,85,0.08)'
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

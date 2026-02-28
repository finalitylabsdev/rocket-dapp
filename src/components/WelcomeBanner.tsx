import { useState } from 'react';
import { X, Lock, Zap, Gift, Rocket } from 'lucide-react';
import { safeGetStorageItem, safeSetStorageItem } from '../lib/safeStorage';

const STORAGE_KEY = 'entropy-onboarding-dismissed';

const STEPS = [
  {
    icon: <Lock size={18} />,
    title: 'Lock ETH',
    desc: 'Whitelist your wallet at the Entropy Gate.',
  },
  {
    icon: <Zap size={18} />,
    title: 'Earn FLUX',
    desc: 'Claim FLUX daily — the protocol currency.',
  },
  {
    icon: <Gift size={18} />,
    title: 'Collect Parts',
    desc: 'Open Star Vault boxes or win Nebula Bids auctions.',
  },
  {
    icon: <Rocket size={18} />,
    title: 'Build & Launch',
    desc: 'Equip parts in Rocket Lab and launch for Grav Score.',
  },
] as const;

export default function WelcomeBanner() {
  const [visible, setVisible] = useState(() => !safeGetStorageItem(STORAGE_KEY));

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    safeSetStorageItem(STORAGE_KEY, '1');
  };

  return (
    <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-4">
      <div
        className="relative p-6 animate-fade-in"
        style={{
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(74,222,128,0.2)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Close welcome guide"
        >
          <X size={16} />
        </button>

        <p className="font-mono font-black text-sm uppercase tracking-[0.2em] text-dot-green mb-1">
          Welcome to Entropy
        </p>
        <p className="text-text-muted text-sm mb-5 max-w-lg">
          Four apps, one loop. Here's how the journey works:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="p-3 flex flex-col gap-2"
              style={{
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-dot-green">{step.icon}</span>
                <span className="font-mono font-bold text-xs uppercase tracking-wider text-text-primary">
                  {i + 1}. {step.title}
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={dismiss}
            className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-dot-green hover:bg-dot-green/10 transition-colors"
            style={{ border: '1px solid rgba(74,222,128,0.25)' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

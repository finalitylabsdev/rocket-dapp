import { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface JourneyCueProps {
  icon: React.ReactNode;
  message: string;
  actionLabel: string;
  onAction: () => void;
  tone?: 'green' | 'gold' | 'purple';
}

const TONE_STYLES = {
  green: {
    bg: 'rgba(74,222,128,0.06)',
    border: 'rgba(74,222,128,0.25)',
    accent: '#4ADE80',
    buttonBg: 'rgba(74,222,128,0.12)',
    buttonBorder: 'rgba(74,222,128,0.3)',
  },
  gold: {
    bg: 'rgba(246,197,71,0.06)',
    border: 'rgba(246,197,71,0.25)',
    accent: '#F6C547',
    buttonBg: 'rgba(246,197,71,0.12)',
    buttonBorder: 'rgba(246,197,71,0.3)',
  },
  purple: {
    bg: 'rgba(168,85,247,0.06)',
    border: 'rgba(168,85,247,0.25)',
    accent: '#A855F7',
    buttonBg: 'rgba(168,85,247,0.12)',
    buttonBorder: 'rgba(168,85,247,0.3)',
  },
} as const;

export default function JourneyCue({
  icon,
  message,
  actionLabel,
  onAction,
  tone = 'green',
}: JourneyCueProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const s = TONE_STYLES[tone];

  return (
    <div
      className="flex items-center gap-3 p-3 font-mono text-sm animate-fade-in"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <span className="shrink-0" style={{ color: s.accent }}>{icon}</span>
      <span className="flex-1 text-text-secondary">{message}</span>
      <button
        onClick={onAction}
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors"
        style={{
          color: s.accent,
          background: s.buttonBg,
          border: `1px solid ${s.buttonBorder}`,
        }}
      >
        {actionLabel}
        <ChevronRight size={12} />
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 text-text-muted hover:text-text-primary transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

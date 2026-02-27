import { ExternalLink, Lock, RefreshCw, Zap } from 'lucide-react';
import { useEthLockState } from '../context/EthLockState';
import { useWallet } from '../hooks/useWallet';

interface EntropyGateBannerProps {
  isHome: boolean;
  onNavigateHome: () => void;
}

type BannerTone = 'neutral' | 'warning' | 'danger' | 'success';

function getToneStyles(tone: BannerTone): { borderColor: string; color: string; background: string } {
  switch (tone) {
    case 'success':
      return {
        borderColor: 'rgba(74, 222, 128, 0.22)',
        color: '#4ADE80',
        background: 'rgba(74, 222, 128, 0.08)',
      };
    case 'danger':
      return {
        borderColor: 'rgba(251, 113, 133, 0.26)',
        color: '#FB7185',
        background: 'rgba(251, 113, 133, 0.08)',
      };
    case 'warning':
      return {
        borderColor: 'rgba(250, 204, 21, 0.24)',
        color: '#FACC15',
        background: 'rgba(250, 204, 21, 0.08)',
      };
    default:
      return {
        borderColor: 'rgba(148, 163, 184, 0.18)',
        color: '#CBD5F5',
        background: 'rgba(148, 163, 184, 0.08)',
      };
  }
}

export default function EntropyGateBanner({ isHome, onNavigateHome }: EntropyGateBannerProps) {
  const wallet = useWallet();
  const ethLock = useEthLockState();
  const hasConfigError = wallet.isConnected && !ethLock.isLocked && !ethLock.lockRecipient;

  let tone: BannerTone = 'neutral';
  let statusLabel = 'WALLET REQUIRED';
  let detail = wallet.error && !wallet.isConnected
    ? wallet.error
    : 'Connect a wallet to check your ETH lock status and unlock daily FLUX claims.';

  if (wallet.isConnected) {
    const nextStep = isHome
      ? ''
      : ethLock.isLocked
        ? ' Return home to claim daily FLUX.'
        : ' Open the home gate to continue.';
    const baseDetail = ethLock.isLoading
      ? 'Checking current ETH lock status...'
      : ethLock.statusDetail;

    if (hasConfigError) {
      tone = 'danger';
      statusLabel = 'CONFIG ERROR';
      detail = 'ETH lock submissions are disabled until VITE_ETH_LOCK_RECIPIENT is configured.';
    } else if (ethLock.status === 'confirmed') {
      tone = 'success';
      statusLabel = 'GATE OPEN';
      detail = `${baseDetail}${nextStep}`;
    } else if (ethLock.status === 'error') {
      tone = 'danger';
      statusLabel = 'ACTION NEEDED';
      detail = `${baseDetail}${nextStep}`;
    } else if (ethLock.status === 'verifying') {
      tone = 'warning';
      statusLabel = 'VERIFYING';
      detail = `${baseDetail}${nextStep}`;
    } else if (ethLock.status === 'sent') {
      tone = 'warning';
      statusLabel = 'TX SENT';
      detail = `${baseDetail}${nextStep}`;
    } else {
      tone = 'warning';
      statusLabel = ethLock.isLoading ? 'CHECKING' : 'GATE LOCKED';
      detail = `${baseDetail}${nextStep}`;
    }
  }

  const toneStyles = getToneStyles(tone);

  return (
    <div className="fixed left-0 right-0 top-16 md:top-20 z-40 border-b border-border-subtle bg-bg-card/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-12 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        <div
          className="hidden sm:flex items-center gap-2 px-2.5 py-1 border"
          style={toneStyles}
        >
          <Lock size={12} />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
            {statusLabel}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-mono font-semibold text-text-primary uppercase tracking-[0.16em]">
            Entropy Gate
          </p>
          <p className="text-[11px] sm:text-xs text-text-muted truncate">
            {detail}
          </p>
        </div>
        {wallet.isConnected && (ethLock.isLoading || ethLock.isVerifying) && (
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-text-muted">
            <RefreshCw size={12} className="animate-spin" />
            {ethLock.isLoading ? 'Checking' : 'Live Verify'}
          </div>
        )}
        {!wallet.isConnected ? (
          <button
            onClick={() => void wallet.connect()}
            disabled={wallet.isConnecting}
            className="shrink-0 flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-text-primary hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={12} />
            {wallet.isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        ) : !isHome && !hasConfigError ? (
          <button
            onClick={onNavigateHome}
            className="shrink-0 flex items-center gap-1.5 border border-border-default px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-text-primary hover:border-border-strong"
          >
            <ExternalLink size={12} />
            {ethLock.isLocked ? 'Home' : 'Open Gate'}
          </button>
        ) : null}
      </div>
    </div>
  );
}

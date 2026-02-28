import { useEffect, useRef, useState } from 'react';
import { Clock, Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useEthLockState } from '../context/EthLockState';
import { useGameState } from '../context/GameState';
import { useWallet } from '../hooks/useWallet';
import PhiSymbol from './brand/PhiSymbol';
import JourneyCue from './JourneyCue';
import {
  EFFECTIVE_DAILY_CLAIM_FLUX,
  FAUCET_INTERVAL_MS,
  FAUCET_INTERVAL_SECONDS,
} from '../config/spec';
import { PREVIEW_READ_ONLY_ENABLED } from '../config/flags';
import { getPreviewActionButtonProps, runPreviewGuardedAction } from '../lib/launchPreview';

const ETH_LOCK_FLOW_TOAST_ID = 'eth-lock-flow';
const WALLET_ERROR_TOAST_ID = 'wallet-error';

function formatCooldown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  if (totalSeconds < 3600) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatClaimWindow(seconds: number): string {
  if (seconds % 3600 === 0) return `${seconds / 3600}H`;
  if (seconds % 60 === 0) return `${seconds / 60}M`;
  return `${seconds}S`;
}

function formatTxHash(txHash: string): string {
  return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
}

function getEtherscanTxUrl(txHash: string, chainId: number | null): string {
  let host = 'etherscan.io';

  if (chainId === 11155111) {
    host = 'sepolia.etherscan.io';
  } else if (chainId === 17000) {
    host = 'holesky.etherscan.io';
  } else if (chainId === 5) {
    host = 'goerli.etherscan.io';
  }

  return `https://${host}/tx/${txHash}`;
}

function openExternalUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function EntropyGatePanel() {
  const game = useGameState();
  const wallet = useWallet();
  const ethLock = useEthLockState();
  const [now, setNow] = useState(() => Date.now());
  const submittedLockRef = useRef(false);
  const lastWalletErrorRef = useRef<string | null>(null);
  const lastEthLockErrorRef = useRef<string | null>(null);
  const lastEthLockStatusRef = useRef(ethLock.status);
  const lastEthLockTxHashRef = useRef<string | null>(ethLock.submission?.txHash ?? null);

  useEffect(() => {
    if (!game.lastDailyClaim) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [game.lastDailyClaim]);

  const cooldownRemaining = game.lastDailyClaim
    ? Math.max(0, FAUCET_INTERVAL_MS - (now - game.lastDailyClaim))
    : 0;
  const canClaim = ethLock.isLocked && (!game.lastDailyClaim || cooldownRemaining === 0);
  const isWaitingForVerification = ethLock.status === 'sent' || ethLock.status === 'verifying';

  const lockCallToActionDisabled =
    ethLock.isSubmitting
    || ethLock.isLoading
    || isWaitingForVerification
    || !ethLock.lockRecipient;
  const claimCallToActionDisabled =
    !canClaim
    || game.isClaimingFlux
    || game.isFluxSyncing;

  const handleSubmitLock = async () => {
    if (PREVIEW_READ_ONLY_ENABLED) {
      return;
    }

    submittedLockRef.current = true;
    toast.loading('Transaction submitted', {
      id: ETH_LOCK_FLOW_TOAST_ID,
      description: 'Waiting for wallet confirmation...',
      duration: Number.POSITIVE_INFINITY,
    });
    const didSubmit = await ethLock.submitLock();

    if (!didSubmit) {
      submittedLockRef.current = false;
    }
  };

  const handleClaimFlux = async () => {
    if (PREVIEW_READ_ONLY_ENABLED) {
      return;
    }

    const claimResult = await game.claimDailyFlux();

    if (claimResult.status === 'claimed') {
      toast.success('Φ claimed', {
        description: `Added ${claimResult.creditedAmount} Φ to your balance.`,
      });
      return;
    }

    if (claimResult.status === 'cooldown' || claimResult.status === 'unchanged') {
      const retryDelay = cooldownRemaining > 0
        ? ` Try again in ${formatCooldown(cooldownRemaining)}.`
        : '';
      toast('Φ already claimed', {
        description: `This faucet window was already recorded and your balance did not change.${retryDelay}`,
      });
      return;
    }

    if (claimResult.status === 'failed' && canClaim) {
      toast.error('Φ claim failed', {
        description: 'The signed claim could not be recorded.',
      });
    }
  };

  useEffect(() => {
    if (!ethLock.isLocked || !wallet.address) {
      return;
    }

    void game.refreshFluxBalance();
  }, [ethLock.isLocked, game.refreshFluxBalance, wallet.address]);

  useEffect(() => {
    if (!wallet.error) {
      lastWalletErrorRef.current = null;
      return;
    }

    if (lastWalletErrorRef.current === wallet.error) {
      return;
    }

    toast.error('Wallet action failed', {
      id: WALLET_ERROR_TOAST_ID,
      description: wallet.error,
    });
    lastWalletErrorRef.current = wallet.error;
  }, [wallet.error]);

  useEffect(() => {
    if (!ethLock.error) {
      lastEthLockErrorRef.current = null;
      return;
    }

    if (lastEthLockErrorRef.current === ethLock.error) {
      return;
    }

    toast.error('ETH lock failed', {
      id: ETH_LOCK_FLOW_TOAST_ID,
      description: ethLock.error,
      duration: 8000,
    });
    lastEthLockErrorRef.current = ethLock.error;
  }, [ethLock.error]);

  useEffect(() => {
    const previousStatus = lastEthLockStatusRef.current;
    const previousTxHash = lastEthLockTxHashRef.current;
    const currentTxHash = ethLock.submission?.txHash ?? null;
    const currentChainId = ethLock.submission?.chainId ?? null;

    if (!wallet.isConnected) {
      toast.dismiss(ETH_LOCK_FLOW_TOAST_ID);
      submittedLockRef.current = false;
      lastEthLockStatusRef.current = ethLock.status;
      lastEthLockTxHashRef.current = currentTxHash;
      return;
    }

    if (ethLock.error && ethLock.status !== 'confirmed') {
      lastEthLockStatusRef.current = ethLock.status;
      lastEthLockTxHashRef.current = currentTxHash;
      return;
    }

    if ((ethLock.status === 'sent' || ethLock.status === 'verifying') && currentTxHash) {
      if (previousStatus !== ethLock.status || previousTxHash !== currentTxHash) {
        toast.loading(
          ethLock.status === 'sent' ? 'Transaction pending' : 'Verifying transaction',
          {
            id: ETH_LOCK_FLOW_TOAST_ID,
            description: ethLock.status === 'sent'
              ? `${formatTxHash(currentTxHash)} was submitted. Waiting for confirmations.`
              : `${formatTxHash(currentTxHash)} is being verified on-chain.`,
            duration: Number.POSITIVE_INFINITY,
          },
        );
      }
    } else if (
      ethLock.status === 'confirmed'
      && currentTxHash
      && (
        previousStatus === 'sent'
        || previousStatus === 'verifying'
        || previousStatus === 'error'
        || (previousStatus === 'pending' && submittedLockRef.current)
      )
    ) {
      toast.success('ETH locked', {
        id: ETH_LOCK_FLOW_TOAST_ID,
        description: 'Φ claims are now enabled.',
        duration: 12000,
        action: {
          label: 'View on Etherscan',
          onClick: () => openExternalUrl(getEtherscanTxUrl(currentTxHash, currentChainId)),
        },
      });
      submittedLockRef.current = false;
    } else if (ethLock.status === 'pending' && previousStatus !== 'pending' && !ethLock.error) {
      toast.dismiss(ETH_LOCK_FLOW_TOAST_ID);
      submittedLockRef.current = false;
    }

    lastEthLockStatusRef.current = ethLock.status;
    lastEthLockTxHashRef.current = currentTxHash;
  }, [
    wallet.isConnected,
    ethLock.error,
    ethLock.status,
    ethLock.submission?.chainId,
    ethLock.submission?.txHash,
  ]);

  const lockPreviewAction = getPreviewActionButtonProps('gateLock', lockCallToActionDisabled);
  const claimPreviewAction = getPreviewActionButtonProps('gateClaim', claimCallToActionDisabled);

  const primaryAction = PREVIEW_READ_ONLY_ENABLED ? (
    !wallet.isConnected ? (
      <button
        onClick={() => void wallet.connect()}
        disabled={wallet.isConnecting}
        className="btn-primary w-full sm:w-auto justify-center text-sm sm:text-base px-6 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap size={16} />
        {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    ) : !ethLock.isLocked ? (
      <button
        onClick={runPreviewGuardedAction('gateLock', () => void handleSubmitLock())}
        disabled={lockPreviewAction.disabled}
        aria-disabled={lockPreviewAction['aria-disabled']}
        title={lockPreviewAction.title}
        data-click-denied={lockPreviewAction['data-click-denied']}
        className="btn-primary w-full sm:w-auto justify-center text-sm sm:text-base px-6 py-3.5"
      >
        <Lock size={16} />
        {`Lock ${ethLock.lockAmountLabel} ETH`}
      </button>
    ) : (
      <button
        onClick={runPreviewGuardedAction('gateClaim', () => void handleClaimFlux())}
        disabled={claimPreviewAction.disabled}
        aria-disabled={claimPreviewAction['aria-disabled']}
        title={claimPreviewAction.title}
        data-click-denied={claimPreviewAction['data-click-denied']}
        className="btn-primary w-full sm:w-auto justify-center text-sm sm:text-base px-6 py-3.5"
      >
        <Zap size={16} />
        {`Claim ${EFFECTIVE_DAILY_CLAIM_FLUX} Φ`}
      </button>
    )
  ) : !wallet.isConnected ? (
    <button
      onClick={() => void wallet.connect()}
      disabled={wallet.isConnecting}
      className="btn-primary w-full sm:w-auto justify-center text-sm sm:text-base px-6 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Zap size={16} />
      {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  ) : !ethLock.isLocked ? (
    <button
      onClick={() => void handleSubmitLock()}
      disabled={lockCallToActionDisabled}
      className="btn-primary w-full sm:w-auto justify-center text-sm sm:text-base px-6 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Lock size={16} />
      {ethLock.isSubmitting
        ? 'Submitting ETH lock...'
        : ethLock.status === 'sent'
          ? 'Transaction sent...'
          : ethLock.status === 'verifying'
            ? 'Verifying on-chain...'
            : ethLock.status === 'error'
              ? `Retry ${ethLock.lockAmountLabel} ETH`
              : ethLock.isLoading
                ? 'Checking lock status...'
                : `Lock ${ethLock.lockAmountLabel} ETH`}
    </button>
  ) : (
    <button
      onClick={() => void handleClaimFlux()}
      disabled={claimCallToActionDisabled}
      className="btn-primary w-full sm:w-auto justify-center text-sm sm:text-base px-6 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {game.isClaimingFlux ? (
        <>
          <Zap size={16} />
          Claiming Φ...
        </>
      ) : canClaim ? (
        <>
          <Zap size={16} />
          {`Claim ${EFFECTIVE_DAILY_CLAIM_FLUX} Φ`}
        </>
      ) : (
        <>
          <Clock size={16} />
          {formatCooldown(cooldownRemaining)}
        </>
      )}
    </button>
  );

  return (
    <section className="bg-bg-card border border-border-default p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="tag">
          <Lock size={11} />
          Gate Access
        </span>
        <span className="tag">
          <Zap size={11} className="text-dot-green" />
          Daily Faucet
        </span>
        <span className="tag">
          Prize Pool Funding
        </span>
      </div>

      <div className="space-y-3">
        <h2 className="font-mono font-black text-2xl md:text-3xl text-text-primary leading-tight uppercase tracking-tight">
          Unlock the Entropy Gate
        </h2>
        <p className="text-sm text-text-muted font-mono leading-relaxed max-w-2xl">
          {PREVIEW_READ_ONLY_ENABLED
            ? `Wallet authentication is live here, but ETH lock and Φ claim stay blocked in preview. The controls remain visible so the launch flow is still legible before March 3, 2026 at 23:11 UTC.`
            : (
              <>
                Lock {ethLock.lockAmountLabel} ETH once to whitelist this wallet. After the lock confirms,
                you can return every {formatClaimWindow(FAUCET_INTERVAL_SECONDS).toLowerCase()} to claim{' '}
                {EFFECTIVE_DAILY_CLAIM_FLUX} Φ and push deeper into the network.
              </>
            )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-inset p-3 text-center border border-border-subtle">
          <p className="font-mono font-bold text-text-primary text-lg">{ethLock.lockAmountLabel}</p>
          <p className="text-[10px] text-text-muted mt-0.5 font-mono uppercase tracking-wider">ETH to Lock</p>
        </div>
        <div className="bg-bg-inset p-3 text-center border border-border-subtle">
          <p className="font-mono font-bold text-text-primary text-lg">{EFFECTIVE_DAILY_CLAIM_FLUX}</p>
          <p className="text-[10px] text-text-muted mt-0.5 font-mono uppercase tracking-wider">Φ / Day</p>
        </div>
        <div className="bg-bg-inset p-3 text-center border border-border-subtle">
          <p className="font-mono font-bold text-text-primary text-lg">{formatClaimWindow(FAUCET_INTERVAL_SECONDS)}</p>
          <p className="text-[10px] text-text-muted mt-0.5 font-mono uppercase tracking-wider">Claim Window</p>
        </div>
      </div>

      {PREVIEW_READ_ONLY_ENABLED ? (
        <div
          className="p-3 border flex flex-wrap items-center gap-2"
          style={{
            background: 'rgba(245,158,11,0.08)',
            borderColor: 'rgba(245,158,11,0.22)',
          }}
        >
          <Lock size={14} className="text-text-primary" />
          <span className="text-sm font-mono font-bold text-text-primary">
            PREVIEW READ ONLY
          </span>
          <span className="text-xs text-text-muted font-mono sm:ml-auto">
            {wallet.isConnected
              ? 'Authenticated wallets can browse, but lock and claim stay disabled here.'
              : 'Browse freely or connect a wallet. Lock and claim stay disabled until launch.'}
          </span>
        </div>
      ) : ethLock.isLocked ? (
        <div
          className="flex flex-wrap items-center gap-2 p-3 border"
          style={{ background: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.2)' }}
        >
          <Lock size={14} style={{ color: '#4ADE80' }} />
          <span className="text-sm font-mono font-bold" style={{ color: '#4ADE80' }}>ETH LOCKED</span>
          <span className="text-xs text-text-muted font-mono sm:ml-auto">
            {canClaim ? 'Claim ready now' : `Next claim in ${formatCooldown(cooldownRemaining)}`}
          </span>
        </div>
      ) : (
        <div
          className="p-3 border flex flex-wrap items-center gap-2"
          style={{
            background: ethLock.status === 'error' ? 'rgba(251,113,133,0.08)' : 'rgba(250,204,21,0.06)',
            borderColor: ethLock.status === 'error' ? 'rgba(251,113,133,0.28)' : 'rgba(250,204,21,0.24)',
          }}
        >
          <Lock size={14} style={{ color: ethLock.status === 'error' ? '#FB7185' : '#FACC15' }} />
          <span className="text-sm font-mono font-bold" style={{ color: ethLock.status === 'error' ? '#FB7185' : '#FACC15' }}>
            {ethLock.status === 'error'
              ? 'ETH LOCK ERROR'
              : ethLock.status === 'verifying'
                ? 'ETH LOCK VERIFYING'
                : ethLock.status === 'sent'
                  ? 'ETH TX SENT'
                  : 'ETH LOCK PENDING'}
          </span>
          <span className="text-xs text-text-muted font-mono sm:ml-auto">
            {wallet.isConnected ? ethLock.statusDetail : 'Connect wallet to continue'}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {primaryAction}
      </div>

      {!PREVIEW_READ_ONLY_ENABLED && wallet.isConnected && !ethLock.isLocked && !ethLock.lockRecipient && (
        <p className="text-xs font-mono text-amber-300">
          Configure <code>VITE_ETH_LOCK_RECIPIENT</code> to enable ETH lock submissions.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-bg-inset border border-border-subtle p-4">
          <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.16em]">
            Wallet
          </p>
          {wallet.isConnected ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="glow-dot" />
              <span className="font-mono font-semibold text-text-primary">{wallet.displayAddress}</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-text-muted">Connect to check lock status and claim Φ.</p>
          )}
        </div>
        <div className="bg-bg-inset border border-border-subtle p-4">
          <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.16em]">
            Φ Balance
          </p>
          <div className="mt-2 flex items-center gap-2">
            <PhiSymbol size={16} color="var(--color-text-primary)" />
            <span className="font-mono font-bold text-text-primary text-lg">
              {wallet.isConnected ? game.fluxBalance : '--'}
            </span>
            <span className="text-xs text-text-muted font-mono">Φ</span>
            {wallet.isConnected && game.isFluxSyncing && (
              <span className="ml-auto text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
                Syncing
              </span>
            )}
          </div>
        </div>
      </div>

      {!PREVIEW_READ_ONLY_ENABLED && ethLock.isLocked && canClaim && game.fluxBalance === 0 && (
        <JourneyCue
          icon={<Zap size={16} />}
          message="ETH locked. Claim your first Φ to open the rest of the app economy."
          actionLabel="Claim Now"
          onAction={() => void handleClaimFlux()}
          tone="green"
        />
      )}
    </section>
  );
}

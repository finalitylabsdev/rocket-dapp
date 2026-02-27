import { useEffect, useRef, useState } from 'react';
import { Zap, ExternalLink, ChevronDown, Lock, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useGameState } from '../context/GameState';
import { useEthLock } from '../hooks/useEthLock';
import { useWallet } from '../hooks/useWallet';
import PhiSymbol from './brand/PhiSymbol';
import {
  EFFECTIVE_DAILY_CLAIM_FLUX,
  FAUCET_INTERVAL_MS,
  FAUCET_INTERVAL_SECONDS,
} from '../config/spec';

interface HeroProps {
  onOpenDex: () => void;
}

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

export default function Hero({ onOpenDex }: HeroProps) {
  const game = useGameState();
  const wallet = useWallet();
  const ethLock = useEthLock(wallet.address);
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
    const didClaim = await game.claimDailyFlux();

    if (didClaim) {
      toast.success('Flux claimed', {
        description: `Added ${EFFECTIVE_DAILY_CLAIM_FLUX} FLUX to your balance.`,
      });
      return;
    }

    if (canClaim) {
      toast.error('Flux claim failed', {
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
        description: 'Flux claims are now enabled.',
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

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden pt-20">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full py-16 lg:py-0">
          <div className="space-y-8 animate-slide-up">
            <div className="flex flex-wrap gap-2">
              <span className="tag">
                <div className="glow-dot" />
                Testnet Live
              </span>
              <span className="tag">
                <Zap size={11} className="text-dot-green" />
                Proof-of-Infinity
              </span>
              <span className="tag">
                Permission-less
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="font-mono font-black text-4xl sm:text-5xl lg:text-6xl text-text-primary leading-[1.08] uppercase tracking-tight">
                Welcome to the{' '}
                <span className="text-dot-green">Entropy Network</span>
              </h1>
              <p className="font-mono font-semibold text-xl text-text-muted tracking-widest uppercase">
                Deterministic. Immutable. Gamified.
              </p>
              <p className="text-text-muted text-lg leading-relaxed max-w-lg">
                Lock ETH. Claim Flux daily. Trade, build rockets, and{' '}
                <span className="font-semibold text-text-primary">win real ETH rewards.</span>
              </p>
            </div>

            <div className="flex flex-nowrap gap-4">
              {!wallet.isConnected ? (
                <button
                  onClick={() => void wallet.connect()}
                  disabled={wallet.isConnecting}
                  className="btn-primary text-base px-7 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap size={16} />
                  {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              ) : !ethLock.isLocked ? (
                <button
                  onClick={() => void handleSubmitLock()}
                  disabled={lockCallToActionDisabled}
                  className="btn-primary text-base px-7 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="btn-primary text-base px-7 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {game.isClaimingFlux ? (
                    <>
                      <Zap size={16} />
                      Claiming Flux...
                    </>
                  ) : canClaim ? (
                    <>
                      <Zap size={16} />
                      {`Claim ${EFFECTIVE_DAILY_CLAIM_FLUX} Flux`}
                    </>
                  ) : (
                    <>
                      <Clock size={16} />
                      {formatCooldown(cooldownRemaining)}
                    </>
                  )}
                </button>
              )}
              <button onClick={onOpenDex} className="btn-secondary text-base px-7 py-3.5">
                Entropy Exchange
                <ExternalLink size={15} />
              </button>
            </div>
            {wallet.isConnected && !ethLock.isLocked && !ethLock.lockRecipient && (
              <p className="text-xs font-mono text-amber-300">
                Configure <code>VITE_ETH_LOCK_RECIPIENT</code> to enable ETH lock submissions.
              </p>
            )}

            <div className="flex items-center gap-6 pt-2">
              {wallet.isConnected && (
                <>
                  <div className="flex items-center gap-2">
                    <PhiSymbol size={18} color="var(--color-text-primary)" />
                    <p className="font-mono font-bold text-text-primary text-lg">{game.fluxBalance}</p>
                    <p className="text-xs text-text-muted font-mono">FLUX</p>
                  </div>
                  <div className="h-8 w-px bg-border-subtle" />
                </>
              )}
              <div>
                <p className="text-sm font-mono font-semibold text-text-primary uppercase tracking-wider">Season 1</p>
                <p className="text-xs text-text-muted font-mono">Cosmic Jackpot open</p>
              </div>
              {game.scores.length > 0 && (
                <>
                  <div className="h-8 w-px bg-border-subtle" />
                  <div>
                    <p className="text-sm font-mono font-semibold text-text-primary">{Math.max(...game.scores).toLocaleString()}</p>
                    <p className="text-xs text-text-muted font-mono">Best Grav Score</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="relative w-full max-w-lg">
              <div className="bg-bg-card border border-border-default p-8 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-bg-inset border border-border-default flex items-center justify-center mx-auto mb-4">
                    <Zap size={28} className="text-dot-green" />
                  </div>
                  <p className="font-mono font-bold text-text-primary text-lg uppercase tracking-wider">Entropy Gate</p>
                  <p className="text-sm text-text-muted mt-1">Lock ETH to begin. Claim Flux daily.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-bg-inset p-3 text-center border border-border-subtle">
                    <p className="font-mono font-bold text-text-primary text-lg">{ethLock.lockAmountLabel}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 font-mono">ETH TO LOCK</p>
                  </div>
                  <div className="bg-bg-inset p-3 text-center border border-border-subtle">
                    <p className="font-mono font-bold text-text-primary text-lg">{EFFECTIVE_DAILY_CLAIM_FLUX}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 font-mono">FLUX / DAY</p>
                  </div>
                  <div className="bg-bg-inset p-3 text-center border border-border-subtle">
                    <p className="font-mono font-bold text-text-primary text-lg">{formatClaimWindow(FAUCET_INTERVAL_SECONDS)}</p>
                    <p className="text-[10px] text-text-muted mt-0.5 font-mono">CLAIM WINDOW</p>
                  </div>
                </div>
                {ethLock.isLocked ? (
                  <div className="flex items-center justify-center gap-2 p-3 border" style={{ background: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.2)' }}>
                    <Lock size={14} style={{ color: '#4ADE80' }} />
                    <span className="text-sm font-mono font-bold" style={{ color: '#4ADE80' }}>ETH LOCKED</span>
                    <span className="text-xs text-text-muted ml-auto font-mono">{game.fluxBalance} Flux available</span>
                  </div>
                ) : (
                  <div
                    className="p-3 border flex items-center gap-2"
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
                    {wallet.isConnected ? (
                      <button
                        onClick={() => void handleSubmitLock()}
                        disabled={lockCallToActionDisabled}
                        className="ml-auto border border-amber-300/30 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ethLock.isSubmitting
                          ? 'Submitting...'
                          : isWaitingForVerification
                            ? 'Verifying...'
                            : ethLock.status === 'error'
                              ? `Retry ${ethLock.lockAmountLabel} ETH`
                              : `Submit ${ethLock.lockAmountLabel} ETH`}
                      </button>
                    ) : (
                      <span className="text-xs text-text-muted ml-auto font-mono">Connect wallet to continue</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex justify-center pb-8">
        <a
          href="#status"
          className="flex flex-col items-center gap-1 text-text-muted hover:text-text-secondary transition-colors"
        >
          <span className="text-xs font-mono font-medium uppercase tracking-wider">Explore</span>
          <ChevronDown size={18} />
        </a>
      </div>
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { FlaskConical, Star, Rocket } from 'lucide-react';
import RocketPreview from '../components/lab/RocketPreview';
import PartsGrid from '../components/lab/PartsGrid';
import StatsPanel from '../components/lab/StatsPanel';
import LaunchSequence from '../components/lab/LaunchSequence';
import { useGameState } from '../context/GameState';
import {
  buildRocketLabSlots,
  computeRocketLabMetrics,
} from '../components/lab/rocketLabAdapter';
import { LAUNCH_FEE_RATE } from '../config/spec';
import {
  launchRocket,
  getLaunchHistory,
  formatLaunchError,
  type LaunchResult,
  type LaunchHistoryEntry,
} from '../lib/rocketLaunch';
import { useWallet } from '../hooks/useWallet';

interface LaunchSequenceResult {
  score: number;
  bonus: string;
  multiplier: string;
}

export default function RocketLabPage() {
  const selectedModel = 'standard' as const;
  const wallet = useWallet();
  const { inventory, isInventorySyncing, fluxBalance, applyServerSnapshot } = useGameState();
  const [history, setHistory] = useState<LaunchHistoryEntry[]>([]);
  const [launching, setLaunching] = useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [launchResult, setLaunchResult] = useState<LaunchSequenceResult | null>(null);
  const [launchPower, setLaunchPower] = useState(0);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const launchPromiseRef = useRef<Promise<LaunchResult> | null>(null);

  const slots = buildRocketLabSlots(inventory);
  const metrics = computeRocketLabMetrics(slots, selectedModel);

  const totalPartValue = inventory
    .filter((part) => !part.isLocked)
    .reduce((sum, part) => {
      const slotView = slots[part.slot];
      if (slotView?.status === 'ready' && slotView.part?.id === part.id) {
        return sum + part.partValue;
      }
      return sum;
    }, 0);

  const launchFee = Math.round(totalPartValue * LAUNCH_FEE_RATE * 100) / 100;

  // Fetch server history on wallet connect
  useEffect(() => {
    if (!wallet.address) {
      setHistory([]);
      return;
    }

    let cancelled = false;

    void getLaunchHistory(wallet.address)
      .then((entries) => {
        if (!cancelled) {
          setHistory(entries);
        }
      })
      .catch((error) => {
        console.error('Failed to load launch history:', formatLaunchError(error, 'Failed to load launch history.'));
      });

    return () => {
      cancelled = true;
    };
  }, [wallet.address]);

  const handleLaunch = useCallback(() => {
    if (launching || !metrics.canLaunch || !wallet.address) {
      return;
    }

    setLaunching(true);
    setLaunchResult(null);
    setLaunchError(null);

    // Fire RPC immediately — animation will play in parallel
    launchPromiseRef.current = launchRocket(wallet.address);
  }, [launching, metrics.canLaunch, wallet.address]);

  const handleLaunchComplete = useCallback(async () => {
    const promise = launchPromiseRef.current;
    if (!promise) {
      setLaunching(false);
      return;
    }

    try {
      const result = await promise;

      // Update history
      setHistory((current) => [
        {
          launchId: result.launchId,
          gravScore: result.gravScore,
          eventBonus: result.eventBonus,
          finalMultiplier: result.finalMultiplier,
          power: result.power,
          launchFeeFlux: result.launchFeeFlux,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);

      // Apply returned balance
      applyServerSnapshot({ balance: result.balance });

      setLaunchPower(result.power);
      setLaunchResult({
        score: result.gravScore,
        bonus: result.eventBonus,
        multiplier: result.finalMultiplier.toFixed(2),
      });
      setLaunchError(null);
    } catch (error) {
      const message = formatLaunchError(error, 'Launch failed.');
      setLaunchError(message);
      console.error('Launch RPC failed:', message);
    } finally {
      launchPromiseRef.current = null;
      setLaunching(false);
      setShowSequence(true);
    }
  }, [applyServerSnapshot]);

  const handleDismiss = () => {
    setShowSequence(false);
    setLaunchResult(null);
  };

  const bestScore = history.length > 0 ? Math.max(...history.map((entry) => entry.gravScore)) : 0;

  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10 pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-3">
              <span className="tag">
                <FlaskConical size={11} />
                Assembler
              </span>
            </div>
            <h1 className="font-mono font-black text-3xl md:text-5xl lg:text-6xl mb-3 leading-[1.08] uppercase tracking-wider text-text-primary">
              Rocket Lab
            </h1>
            <p className="text-lg font-mono text-text-muted">
              Equip 8 parts, pay the launch fee, earn GravScore.
            </p>

            {(bestScore > 0 || metrics.readySlots > 0 || metrics.lockedSlots > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                  <Rocket size={14} style={{ color: '#F97316' }} />
                  <span className="font-mono font-bold text-sm text-text-primary">{metrics.readySlots}/{metrics.totalSlots}</span>
                  <span className="text-xs font-mono text-text-muted">READY SLOTS</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                  <Rocket size={14} style={{ color: '#F59E0B' }} />
                  <span className="font-mono font-bold text-sm text-text-primary">{history.length}</span>
                  <span className="text-xs font-mono text-text-muted">LAUNCHES</span>
                </div>
                {bestScore > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                    <Star size={14} style={{ color: '#FACC15' }} />
                    <span className="font-mono font-bold text-sm text-text-primary">{bestScore.toLocaleString()}</span>
                    <span className="text-xs font-mono text-text-muted">BEST GS</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-5 items-start">
            <div className="overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
              <div className="px-5 pt-5 pb-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold text-sm uppercase tracking-wider text-text-primary">Preview</p>
                  <div className="flex items-center gap-1.5">
                    <Star size={11} className="text-text-muted" />
                    <span className="font-mono text-xs text-text-muted">
                      {metrics.readySlots}/{metrics.totalSlots}
                    </span>
                  </div>
                </div>
              </div>
              <RocketPreview
                slots={slots}
                model={selectedModel}
                launching={launching}
                onLaunchComplete={handleLaunchComplete}
              />
            </div>

            <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
              <PartsGrid
                slots={slots}
                isSyncing={isInventorySyncing}
              />
            </div>

            <div className="space-y-4">
              <StatsPanel
                metrics={metrics}
                model={selectedModel}
                onLaunch={handleLaunch}
                launching={launching}
                launchFee={launchFee}
                fluxBalance={fluxBalance}
                launchError={launchError}
              />

              <div className="p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                <p className="font-mono text-xs font-bold mb-3 uppercase tracking-widest text-text-muted">LAUNCH HISTORY</p>
                {history.length === 0 ? (
                  <p className="text-xs py-2 font-mono text-text-muted">
                    No launches yet. Fill all 8 unlocked slots to launch.
                  </p>
                ) : (
                  history.slice(0, 5).map((entry, index) => (
                    <div
                      key={`${entry.launchId}-${index}`}
                      className="flex items-start justify-between gap-3 py-2"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-black text-sm w-5 text-center" style={{ color: index === 0 ? '#FACC15' : 'var(--color-text-muted)' }}>
                            {history.length - index}
                          </span>
                          <span className="font-mono text-xs uppercase text-text-muted">Launch</span>
                        </div>
                        <p className="mt-1 pl-7 text-[10px] font-mono text-text-muted truncate">
                          {entry.eventBonus}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="font-mono font-bold text-xs text-text-primary">{entry.gravScore.toLocaleString()}</span>
                        <span className="font-mono text-[10px] text-text-muted">GS</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSequence && (
        <LaunchSequence
          model={selectedModel}
          result={launchResult}
          power={launchPower}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}

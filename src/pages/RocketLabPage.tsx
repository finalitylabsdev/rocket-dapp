import { useCallback, useEffect, useRef, useState } from 'react';
import { Rocket, ShieldCheck, Star } from 'lucide-react';
import RocketPreview from '../components/lab/RocketPreview';
import PartsGrid from '../components/lab/PartsGrid';
import StatsPanel from '../components/lab/StatsPanel';
import LaunchSequence from '../components/lab/LaunchSequence';
import PreviewReadOnlyBanner from '../components/PreviewReadOnlyBanner';
import { useGameState } from '../context/GameState';
import { buildRocketLabSlots, computeRocketLabMetrics } from '../components/lab/rocketLabAdapter';
import {
  equipInventoryPart,
  formatRocketLabError,
  getLaunchHistory,
  launchRocket,
  repairInventoryPart,
  type RocketLaunchHistoryEntry,
  type RocketLaunchResult,
  unequipInventoryPart,
} from '../lib/rocketLab';
import { useWallet } from '../hooks/useWallet';
import { PREVIEW_READ_ONLY_ENABLED } from '../config/flags';
import { getPreviewFluxBalance, getPreviewInventory, getPreviewLaunchHistory } from '../lib/launchPreview';
import { formatPhiAmount } from '../lib/tokenDisplay';
import type { RocketSection } from '../types/domain';

interface LaunchSequenceResult {
  scoreBreakdown: RocketLaunchResult['scoreBreakdown'];
  fuelCostFlux: number;
  meteoriteDamagePct: number;
}

function formatLaunchTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RocketLabPage() {
  const selectedModel = 'standard' as const;
  const wallet = useWallet();
  const { inventory, isInventorySyncing, fluxBalance, applyServerSnapshot } = useGameState();
  const [history, setHistory] = useState<RocketLaunchHistoryEntry[]>([]);
  const [launching, setLaunching] = useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [launchResult, setLaunchResult] = useState<LaunchSequenceResult | null>(null);
  const [launchPower, setLaunchPower] = useState(0);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const launchPromiseRef = useRef<Promise<RocketLaunchResult> | null>(null);

  const displayInventory = getPreviewInventory(inventory);
  const displayHistory = getPreviewLaunchHistory(history);
  const displayFluxBalance = getPreviewFluxBalance(fluxBalance);
  const slots = buildRocketLabSlots(displayInventory);
  const metrics = computeRocketLabMetrics(slots);

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
        console.error('Failed to load launch history:', formatRocketLabError(error, 'Failed to load launch history.'));
      });

    return () => {
      cancelled = true;
    };
  }, [wallet.address]);

  const runInventoryMutation = useCallback(async (
    nextActionKey: string,
    mutation: () => Promise<{ inventory: typeof inventory; balance?: RocketLaunchResult['balance'] }>,
  ) => {
    if (PREVIEW_READ_ONLY_ENABLED) {
      return;
    }

    if (!wallet.address) {
      setLaunchError('Connect your wallet to manage the Rocket Lab.');
      return;
    }

    setActionKey(nextActionKey);
    setLaunchError(null);

    try {
      const result = await mutation();
      applyServerSnapshot({
        inventory: result.inventory,
        balance: result.balance ?? null,
      });
    } catch (error) {
      setLaunchError(formatRocketLabError(error, 'Rocket Lab action failed.'));
    } finally {
      setActionKey(null);
    }
  }, [applyServerSnapshot, inventory, wallet.address]);

  const handleEquip = useCallback((partId: string, section: RocketSection) => {
    void runInventoryMutation(
      `equip:${partId}`,
      async () => equipInventoryPart(wallet.address!, partId, section),
    );
  }, [runInventoryMutation, wallet.address]);

  const handleUnequip = useCallback((section: RocketSection) => {
    void runInventoryMutation(
      `unequip:${section}`,
      async () => unequipInventoryPart(wallet.address!, section),
    );
  }, [runInventoryMutation, wallet.address]);

  const handleRepair = useCallback((partId: string) => {
    void runInventoryMutation(
      `repair:${partId}`,
      async () => repairInventoryPart(wallet.address!, partId),
    );
  }, [runInventoryMutation, wallet.address]);

  const handleLaunch = useCallback(() => {
    if (PREVIEW_READ_ONLY_ENABLED) {
      return;
    }

    if (launching || !metrics.canLaunch || !wallet.address) {
      return;
    }

    setLaunching(true);
    setLaunchError(null);
    setLaunchResult(null);

    launchPromiseRef.current = launchRocket(wallet.address);
  }, [launching, metrics.canLaunch, wallet.address]);

  const handleLaunchComplete = useCallback(async () => {
    const pendingLaunch = launchPromiseRef.current;

    if (!pendingLaunch) {
      setLaunching(false);
      return;
    }

    try {
      const result = await pendingLaunch;

      const nextEntry: RocketLaunchHistoryEntry = {
        launchId: result.launchId,
        totalPower: result.totalPower,
        fuelCostFlux: result.fuelCostFlux,
        meteoriteDamagePct: result.meteoriteDamagePct,
        scoreBreakdown: result.scoreBreakdown,
        damageReport: result.damageReport,
        createdAt: result.createdAt,
      };

      applyServerSnapshot({
        inventory: result.inventory,
        balance: result.balance,
      });

      setHistory((current) => [nextEntry, ...current.filter((entry) => entry.launchId !== nextEntry.launchId)]);
      setLaunchPower(Math.round(result.totalPower / 8));
      setLaunchResult({
        scoreBreakdown: result.scoreBreakdown,
        fuelCostFlux: result.fuelCostFlux,
        meteoriteDamagePct: result.meteoriteDamagePct,
      });
      setShowSequence(true);
    } catch (error) {
      const message = formatRocketLabError(error, 'Launch failed.');
      setLaunchError(message);
      console.error('Launch failed:', message);
    } finally {
      launchPromiseRef.current = null;
      setLaunching(false);
    }
  }, [applyServerSnapshot]);

  const handleDismiss = useCallback(() => {
    setShowSequence(false);
    setLaunchResult(null);
  }, []);

  const bestScore = displayHistory.length > 0
    ? Math.max(...displayHistory.map((entry) => entry.scoreBreakdown.total))
    : 0;
  const latestLaunch = displayHistory[0] ?? null;

  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10 pt-20 md:pt-24 pb-16">
        <div className="max-w-[92rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="font-mono font-black text-3xl md:text-5xl lg:text-6xl mb-3 leading-[1.08] uppercase tracking-wider text-text-primary">
              Rocket Lab
            </h1>
            <p className="text-lg font-mono text-text-muted">
              Manage the equipped loadout, repair meteorite wear, and run server-authoritative launches.
            </p>
            {PREVIEW_READ_ONLY_ENABLED && (
              <PreviewReadOnlyBanner
                title="Preview Hangar"
                message="This branch shows a sample loadout and sample launch history. Equip, repair, and launch actions are click-denied until launch."
              />
            )}

            {(bestScore > 0 || metrics.equippedSlots > 0 || displayHistory.length > 0) && (
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                  <Rocket size={14} style={{ color: '#F97316' }} />
                  <span className="font-mono font-bold text-sm text-text-primary">{metrics.equippedSlots}/{metrics.totalSlots}</span>
                  <span className="text-xs font-mono text-text-muted">EQUIPPED</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                  <ShieldCheck size={14} style={{ color: '#4ADE80' }} />
                  <span className="font-mono font-bold text-sm text-text-primary">{displayHistory.length}</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_280px] xl:grid-cols-[240px_minmax(0,1fr)_300px] gap-5 items-start">
            <div className="overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
              <div className="px-5 pt-5 pb-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center justify-between">
                  <p className="font-mono font-bold text-sm uppercase tracking-wider text-text-primary">Preview</p>
                  <div className="flex items-center gap-1.5">
                    <Star size={11} className="text-text-muted" />
                    <span className="font-mono text-xs text-text-muted">
                      {metrics.equippedSlots}/{metrics.totalSlots}
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

            <div className="min-w-0 p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
              <PartsGrid
                slots={slots}
                isSyncing={isInventorySyncing}
                readOnly={PREVIEW_READ_ONLY_ENABLED}
                disabled={Boolean(actionKey) || launching}
                actionKey={actionKey}
                onEquip={handleEquip}
                onUnequip={handleUnequip}
                onRepair={handleRepair}
              />
            </div>

            <div className="min-w-0 space-y-4">
              <StatsPanel
                metrics={metrics}
                model={selectedModel}
                fluxBalance={displayFluxBalance}
                launching={launching}
                walletConnected={Boolean(wallet.address)}
                launchReadOnly={PREVIEW_READ_ONLY_ENABLED}
                launchError={launchError}
                latestLaunch={latestLaunch}
                onLaunch={handleLaunch}
              />
            </div>
          </div>

          <div className="mt-8 overflow-hidden" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono font-bold text-sm uppercase tracking-wider text-text-primary">Launch History</p>
                  <p className="mt-1 text-xs font-mono text-text-muted">
                    {PREVIEW_READ_ONLY_ENABLED
                      ? 'Sample launch history stays visible while Rocket Lab remains read-only.'
                      : 'Recent server-recorded launches for the connected wallet.'}
                  </p>
                </div>
                <span className="tag text-[10px]">{displayHistory.length} Entries</span>
              </div>
            </div>

            <div className="p-5">
              {displayHistory.length === 0 ? (
                <p className="text-sm font-mono text-text-muted">
                  Launch history will appear here after the first successful Rocket Lab launch.
                </p>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {displayHistory.slice(0, 6).map((entry) => (
                    <div
                      key={entry.launchId}
                      className="p-4"
                      style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono font-bold text-sm text-text-primary">
                            +{entry.scoreBreakdown.total.toLocaleString()} GS
                          </p>
                          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">
                            {formatLaunchTime(entry.createdAt)}
                          </p>
                        </div>
                        <span
                          className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.16em]"
                          style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.2)', color: '#F97316' }}
                        >
                          {formatPhiAmount(entry.fuelCostFlux.toFixed(2))}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {[
                          { label: 'Base', value: entry.scoreBreakdown.base },
                          { label: 'Luck', value: entry.scoreBreakdown.luck },
                          { label: 'Random', value: entry.scoreBreakdown.randomness },
                          { label: 'Power', value: entry.totalPower },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="px-2.5 py-2"
                            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
                          >
                            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                            <p className="mt-1 font-mono font-bold text-xs text-text-primary">{item.value.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-3 text-[11px] font-mono text-text-secondary">
                        Meteorite wear: {entry.meteoriteDamagePct}% base impact across the equipped rocket.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSequence && launchResult && (
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

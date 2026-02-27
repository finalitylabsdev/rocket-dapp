import { useEffect, useState } from 'react';
import { FlaskConical, ShieldCheck, Star, Rocket } from 'lucide-react';
import RocketPreview from '../components/lab/RocketPreview';
import PartsGrid from '../components/lab/PartsGrid';
import StatsPanel from '../components/lab/StatsPanel';
import LaunchSequence from '../components/lab/LaunchSequence';
import { useGameState } from '../context/GameState';
import {
  buildRocketLabSlots,
  computeRocketLabMetrics,
  simulateRocketLabLaunch,
  type RocketLabSimulationResult,
} from '../components/lab/rocketLabAdapter';

type LaunchResult = RocketLabSimulationResult | null;

const STORAGE_KEY = 'rocket-lab-state';

interface SimulationHistoryEntry {
  score: number;
  simulatedAt?: string;
  note: string;
}

interface StoredRocketLabState {
  history?: SimulationHistoryEntry[];
  scores?: number[];
}

function normalizeHistoryEntry(value: unknown): SimulationHistoryEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const entry = value as {
    score?: unknown;
    simulatedAt?: unknown;
    note?: unknown;
  };

  if (typeof entry.score !== 'number' || !Number.isFinite(entry.score)) {
    return null;
  }

  return {
    score: entry.score,
    simulatedAt: typeof entry.simulatedAt === 'string' ? entry.simulatedAt : undefined,
    note: typeof entry.note === 'string' ? entry.note : 'Local compatibility simulation',
  };
}

function loadRocketLabState(): StoredRocketLabState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as StoredRocketLabState;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    if (Array.isArray(parsed.history)) {
      return {
        history: parsed.history
          .map((entry) => normalizeHistoryEntry(entry))
          .filter((entry): entry is SimulationHistoryEntry => entry !== null),
      };
    }

    if (Array.isArray(parsed.scores)) {
      return {
        history: parsed.scores
          .filter((score): score is number => typeof score === 'number' && Number.isFinite(score))
          .map((score) => ({
            score,
            note: 'Legacy local simulation',
          })),
      };
    }

    return {};
  } catch {
    return {};
  }
}

function formatSimulationTime(value?: string) {
  if (!value) {
    return 'Legacy local';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Local sim';
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
  const { inventory, isInventorySyncing } = useGameState();
  const [persistedState] = useState(loadRocketLabState);
  const [history, setHistory] = useState<SimulationHistoryEntry[]>(() => persistedState.history ?? []);
  const [launching, setLaunching] = useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [launchResult, setLaunchResult] = useState<LaunchResult>(null);
  const [launchPower, setLaunchPower] = useState(0);

  const slots = buildRocketLabSlots(inventory);
  const metrics = computeRocketLabMetrics(slots, selectedModel);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        history,
      }));
    } catch {
      // Persistence is optional; keep the simulator usable even when storage is blocked.
    }
  }, [history]);

  const handleLaunch = () => {
    if (launching || !metrics.canLaunch) {
      return;
    }

    setLaunching(true);
    setLaunchResult(null);
  };

  const handleLaunchComplete = () => {
    const result = simulateRocketLabLaunch(slots, selectedModel);

    setHistory((current) => [
      ...current,
      {
        score: result.score,
        simulatedAt: new Date().toISOString(),
        note: result.bonus,
      },
    ]);
    setLaunchPower(result.power);
    setLaunchResult(result);
    setLaunching(false);
    setShowSequence(true);
  };

  const handleDismiss = () => {
    setShowSequence(false);
    setLaunchResult(null);
  };

  const bestScore = history.length > 0 ? Math.max(...history.map((entry) => entry.score)) : 0;

  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10 pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-3">
              <span className="tag">
                <FlaskConical size={11} />
                Compatibility Surface
              </span>
            </div>
            <h1 className="font-mono font-black text-3xl md:text-5xl lg:text-6xl mb-3 leading-[1.08] uppercase tracking-wider text-text-primary">
              Rocket Lab
            </h1>
            <p className="text-lg font-mono text-text-muted">
              Canonical 8-slot inventory adapter with local-only launch simulation.
            </p>

            <div
              className="mt-4 inline-flex max-w-3xl items-start gap-2 px-4 py-3 text-left"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
            >
              <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-text-secondary" />
              <p className="text-xs font-mono leading-relaxed text-text-secondary">
                This branch reads `GameState.inventory` as a compatibility view only. Rocket launches here do not write a
                ledger entry, mint rewards, or claim server authority.
              </p>
            </div>

            {(bestScore > 0 || metrics.readySlots > 0 || metrics.lockedSlots > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                  <Rocket size={14} style={{ color: '#F97316' }} />
                  <span className="font-mono font-bold text-sm text-text-primary">{metrics.readySlots}/{metrics.totalSlots}</span>
                  <span className="text-xs font-mono text-text-muted">READY SLOTS</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                  <ShieldCheck size={14} style={{ color: '#F59E0B' }} />
                  <span className="font-mono font-bold text-sm text-text-primary">{metrics.lockedSlots}</span>
                  <span className="text-xs font-mono text-text-muted">LOCKED SLOTS</span>
                </div>
                {bestScore > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                    <Star size={14} style={{ color: '#FACC15' }} />
                    <span className="font-mono font-bold text-sm text-text-primary">{bestScore.toLocaleString()}</span>
                    <span className="text-xs font-mono text-text-muted">BEST LOCAL GS</span>
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
              />

              <div className="p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                <p className="font-mono text-xs font-bold mb-3 uppercase tracking-widest text-text-muted">LOCAL SIMULATION HISTORY</p>
                {history.length === 0 ? (
                  <p className="text-xs py-2 font-mono text-text-muted">
                    No local simulations yet. Fill all 8 unlocked slots to run one.
                  </p>
                ) : (
                  history.slice(-5).reverse().map((entry, index) => (
                    <div
                      key={`${entry.simulatedAt ?? 'legacy'}-${index}-${entry.score}`}
                      className="flex items-start justify-between gap-3 py-2"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-black text-sm w-5 text-center" style={{ color: index === 0 ? '#FACC15' : 'var(--color-text-muted)' }}>
                            {history.length - index}
                          </span>
                          <span className="font-mono text-xs uppercase text-text-muted">Local Sim</span>
                        </div>
                        <p className="mt-1 pl-7 text-[10px] font-mono text-text-muted truncate">
                          {formatSimulationTime(entry.simulatedAt)} · {entry.note}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="font-mono font-bold text-xs text-text-primary">{entry.score.toLocaleString()}</span>
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

import { useEffect, useState } from 'react';
import { FlaskConical, Star, Rocket } from 'lucide-react';
import RocketPreview from '../components/lab/RocketPreview';
import PartsGrid, {
  type EquippedPartId,
  type EquippedParts,
} from '../components/lab/PartsGrid';
import StatsPanel from '../components/lab/StatsPanel';
import { ROCKET_MODELS } from '../components/lab/RocketModels';
import LaunchSequence from '../components/lab/LaunchSequence';
type LaunchResult = { score: number; bonus: string; multiplier: string } | null;
const STORAGE_KEY = 'rocket-lab-state';

interface StoredRocketLabState {
  equipped?: EquippedParts;
  levels?: Record<EquippedPartId, number>;
  scores?: number[];
}

function loadRocketLabState(): StoredRocketLabState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as StoredRocketLabState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export default function RocketLabPage() {
  const [persistedState] = useState(loadRocketLabState);
  const selectedModel = 'standard' as const;

  const [equipped, setEquipped] = useState<EquippedParts>({
    engine: persistedState.equipped?.engine ?? true,
    fuel: persistedState.equipped?.fuel ?? true,
    body: persistedState.equipped?.body ?? true,
    wings: persistedState.equipped?.wings ?? false,
    booster: persistedState.equipped?.booster ?? false,
  });

  const [levels, setLevels] = useState<Record<EquippedPartId, number>>({
    engine: persistedState.levels?.engine ?? 1,
    fuel: persistedState.levels?.fuel ?? 1,
    body: persistedState.levels?.body ?? 1,
    wings: persistedState.levels?.wings ?? 1,
    booster: persistedState.levels?.booster ?? 1,
  });

  const [scores, setScores] = useState<number[]>(() => persistedState.scores ?? []);
  const [launching, setLaunching] = useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [launchResult, setLaunchResult] = useState<LaunchResult>(null);
  const [launchPower, setLaunchPower] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      equipped,
      levels,
      scores,
    }));
  }, [equipped, levels, scores]);

  const handleToggle = (id: EquippedPartId) => {
    setEquipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpgrade = (id: EquippedPartId) => {
    if (levels[id] >= 3) {
      return;
    }

    setLevels((prev) => ({ ...prev, [id]: Math.min(3, prev[id] + 1) }));
  };

  const handleLaunch = () => {
    if (launching) return;
    setLaunching(true);
    setLaunchResult(null);
  };

  const handleLaunchComplete = () => {
    const modelDef = ROCKET_MODELS.find((m) => m.id === selectedModel)!;
    const equippedCount = Object.values(equipped).filter(Boolean).length;
    const totalParts = Object.keys(equipped).length;
    const totalLevels = Object.entries(levels).reduce(
      (acc, [k, v]) => acc + (equipped[k as keyof EquippedParts] ? v : 0),
      0
    );
    const base = equippedCount / totalParts;
    const levelBonus = totalLevels / (equippedCount * 3 || 1);
    const multiplier = (1 + base * 1.5 + levelBonus * 0.5 + modelDef.bonuses.winBonus / 100).toFixed(2);
    const baseScore = 80 + Math.floor(Math.random() * 140);
    const score = Math.round(baseScore * parseFloat(multiplier));
    const bonuses = [
      'Meteor Shower — Wing-Plate damaged',
      'Solar Flare — Navigation penalty',
      'Alien Probe — Random buff applied',
      'Clear Skies — No penalties',
      'Gravity Slingshot — Bonus multiplier applied',
    ];
    const bonus = bonuses[Math.floor(Math.random() * bonuses.length)];

    const power = Math.min(100, Math.max(0, Math.round(
      (equipped.engine ? 40 : 0) +
      (equipped.booster ? 25 : 0) +
      (equipped.fuel ? 15 : 0) +
      levelBonus * 12 +
      modelDef.bonuses.powerBonus
    )));

    setScores((prev) => [...prev, score]);
    setLaunchPower(power);
    setLaunchResult({
      score,
      multiplier,
      bonus,
    });
    setLaunching(false);
    setShowSequence(true);
  };

  const handleDismiss = () => {
    setShowSequence(false);
    setLaunchResult(null);
  };

  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const totalParts = Object.keys(equipped).length;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10 pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-10">
            <div className="flex justify-center mb-3">
              <span className="tag">
                <FlaskConical size={11} />
                Rocket Lab
              </span>
            </div>
            <h1 className="font-mono font-black text-3xl md:text-5xl lg:text-6xl mb-3 leading-[1.08] uppercase tracking-wider text-text-primary">
              Rocket Lab
            </h1>
            <p className="text-lg font-mono text-text-muted">
              Build. Launch. Dominate the cosmos.
            </p>
            {bestScore > 0 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                  <Rocket size={14} style={{ color: '#F97316' }} />
                  <span className="font-mono font-bold text-sm text-text-primary">{scores.length}</span>
                  <span className="text-xs font-mono text-text-muted">LAUNCHES</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                  <Star size={14} style={{ color: '#FACC15' }} />
                  <span className="font-mono font-bold text-sm text-text-primary">{bestScore.toLocaleString()}</span>
                  <span className="text-xs font-mono text-text-muted">BEST GS</span>
                </div>
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
                      {equippedCount}/{totalParts}
                    </span>
                  </div>
                </div>
              </div>
              <RocketPreview
                equipped={equipped}
                model={selectedModel}
                launching={launching}
                onLaunchComplete={() => { handleLaunchComplete(); }}
              />
            </div>

            <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
              <PartsGrid
                equipped={equipped}
                levels={levels}
                onToggle={handleToggle}
                onUpgrade={handleUpgrade}
              />
            </div>

            <div className="space-y-4">
              <StatsPanel
                equipped={equipped}
                levels={levels}
                model={selectedModel}
                onLaunch={handleLaunch}
                launching={launching}
              />

              <div className="p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
                <p className="font-mono text-xs font-bold mb-3 uppercase tracking-widest text-text-muted">YOUR LAUNCH HISTORY</p>
                {scores.length === 0 ? (
                  <p className="text-xs py-2 font-mono text-text-muted">No launches yet. Equip parts and launch!</p>
                ) : (
                  scores.slice(-5).reverse().map((score, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-sm w-5 text-center" style={{ color: i === 0 ? '#FACC15' : 'var(--color-text-muted)' }}>
                          {scores.length - i}
                        </span>
                        <span className="font-mono text-xs uppercase text-text-muted">Launch</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-xs text-text-primary">{score.toLocaleString()}</span>
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
          equipped={equipped}
          model={selectedModel}
          result={launchResult}
          power={launchPower}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}

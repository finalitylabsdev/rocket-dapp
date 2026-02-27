import { useState } from 'react';
import { ArrowLeft, FlaskConical, Star, Sun, Moon, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import RocketPreview from '../components/lab/RocketPreview';
import PartsGrid, {
  PART_UPGRADE_COSTS,
  type EquippedPartId,
  type EquippedParts,
} from '../components/lab/PartsGrid';
import StatsPanel from '../components/lab/StatsPanel';
import { ROCKET_MODELS } from '../components/lab/RocketModels';
import LaunchSequence from '../components/lab/LaunchSequence';
import { useGameState } from '../context/GameState';
import { useWallet } from '../hooks/useWallet';
import { useTheme } from '../context/ThemeContext';
import PhiSymbol from '../components/brand/PhiSymbol';

interface RocketLabPageProps {
  onBack: () => void;
}

type LaunchResult = { score: number; bonus: string; multiplier: string } | null;

function clampPercent(value: number, max = 100): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}

function computeLaunchWinProbability(
  equipped: EquippedParts,
  levels: Record<EquippedPartId, number>,
  selectedModel: 'standard',
): number {
  const modelDef = ROCKET_MODELS.find((m) => m.id === selectedModel)!;
  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const totalParts = Object.keys(equipped).length;
  const totalLevels = Object.entries(levels).reduce(
    (acc, [k, v]) => acc + (equipped[k as EquippedPartId] ? v : 0),
    0,
  );
  const base = equippedCount / totalParts;
  const levelBonus = totalLevels / (equippedCount * 3 || 1);

  return clampPercent(base * 60 + levelBonus * 20 + (equippedCount === totalParts ? 10 : 0) + modelDef.bonuses.winBonus, 95);
}

function computeLaunchReward(
  equipped: EquippedParts,
  winProbability: number,
): number {
  const allEquipped = Object.values(equipped).every(Boolean);
  return allEquipped ? 1000 : Math.round(winProbability * 4);
}

export default function RocketLabPage({ onBack }: RocketLabPageProps) {
  const game = useGameState();
  const wallet = useWallet();
  const { theme, toggleTheme } = useTheme();
  const selectedModel = 'standard' as const;

  const [equipped, setEquipped] = useState<EquippedParts>({
    engine: true,
    fuel: true,
    body: true,
    wings: false,
    booster: false,
  });

  const [levels, setLevels] = useState<Record<EquippedPartId, number>>({
    engine: 1,
    fuel: 1,
    body: 1,
    wings: 1,
    booster: 1,
  });

  const [launching, setLaunching] = useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [launchResult, setLaunchResult] = useState<LaunchResult>(null);
  const [launchPower, setLaunchPower] = useState(0);

  const handleToggle = (id: EquippedPartId) => {
    setEquipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpgrade = async (id: EquippedPartId) => {
    if (levels[id] >= 3) {
      return;
    }

    const upgradeCost = PART_UPGRADE_COSTS[id];
    const didSpend = await game.spendFlux(
      upgradeCost,
      'rocket_lab_upgrade',
      {
        part_id: id,
        next_level: levels[id] + 1,
        cost_flux: upgradeCost,
      },
    );

    if (!didSpend) {
      toast.error('Upgrade failed', {
        description: wallet.isConnected
          ? 'Not enough FLUX to upgrade this part.'
          : 'Connect your wallet to spend FLUX on upgrades.',
      });
      return;
    }

    setLevels((prev) => ({ ...prev, [id]: Math.min(3, prev[id] + 1) }));
    toast.success('Part upgraded', {
      description: `${upgradeCost} FLUX spent on ${id}.`,
    });
  };

  const handleLaunch = () => {
    if (launching) return;
    setLaunching(true);
    setLaunchResult(null);
  };

  const handleLaunchComplete = async () => {
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
    const winProbability = computeLaunchWinProbability(equipped, levels, selectedModel);
    const rewardFlux = computeLaunchReward(equipped, winProbability);
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

    game.recordScore(score);
    const didCredit = await game.creditFlux(
      rewardFlux,
      'rocket_launch_reward',
      {
        score,
        reward_flux: rewardFlux,
        model_id: selectedModel,
        win_probability: winProbability,
      },
    );

    if (!didCredit) {
      toast.error('Reward pending', {
        description: wallet.isConnected
          ? 'The launch completed, but the FLUX reward was not recorded.'
          : 'Connect your wallet to record FLUX launch rewards.',
      });
    }

    setLaunchPower(power);
    setLaunchResult({
      score,
      multiplier,
      bonus: `${bonus} · +${didCredit ? rewardFlux : 0} FLUX`,
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
  const bestScore = game.scores.length > 0 ? Math.max(...game.scores) : 0;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--color-bg-base)' }}>

      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'var(--color-bg-toast)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 transition-colors group text-text-muted hover:text-text-primary"
              >
                <div
                  className="w-8 h-8 flex items-center justify-center transition-all"
                  style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
                >
                  <ArrowLeft size={15} className="text-text-secondary" />
                </div>
                <span className="text-sm font-mono font-medium hidden sm:inline uppercase tracking-wider">Back</span>
              </button>
              <div className="h-5 w-px" style={{ background: 'var(--color-border-subtle)' }} />
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.35)' }}
                >
                  <FlaskConical size={16} style={{ color: '#94A3B8' }} />
                </div>
                <div>
                  <span className="font-mono font-bold text-base leading-none uppercase tracking-wider text-text-primary">Rocket Lab</span>
                  <div className="text-[10px] font-mono font-medium leading-none mt-0.5 uppercase tracking-wider text-text-muted">Build & Launch</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-2"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
              >
                <PhiSymbol size={13} color="var(--color-text-primary)" />
                <span className="text-xs font-mono font-bold text-text-primary">{game.fluxBalance}</span>
                <span className="text-xs font-mono text-text-muted">FLUX</span>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-9 h-9 text-text-secondary hover:text-text-primary hover:bg-bg-card transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

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
                  <span className="font-mono font-bold text-sm text-text-primary">{game.scores.length}</span>
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
                onLaunchComplete={() => { void handleLaunchComplete(); }}
              />
            </div>

            <div className="p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
              <PartsGrid
                equipped={equipped}
                levels={levels}
                onToggle={handleToggle}
                onUpgrade={(id) => { void handleUpgrade(id); }}
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
                {game.scores.length === 0 ? (
                  <p className="text-xs py-2 font-mono text-text-muted">No launches yet. Equip parts and launch!</p>
                ) : (
                  game.scores.slice(-5).reverse().map((score, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-sm w-5 text-center" style={{ color: i === 0 ? '#FACC15' : 'var(--color-text-muted)' }}>
                          {game.scores.length - i}
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

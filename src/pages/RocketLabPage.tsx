import { useState } from 'react';
import { ArrowLeft, FlaskConical, Star, Rocket } from 'lucide-react';
import RocketPreview from '../components/lab/RocketPreview';
import PartsGrid, { type EquippedParts } from '../components/lab/PartsGrid';
import StatsPanel from '../components/lab/StatsPanel';
import { ROCKET_MODELS } from '../components/lab/RocketModels';
import LaunchSequence from '../components/lab/LaunchSequence';
import { useGameState } from '../context/GameState';
import PhiSymbol from '../components/brand/PhiSymbol';

interface RocketLabPageProps {
  onBack: () => void;
}

type LaunchResult = { score: number; bonus: string; multiplier: string } | null;

export default function RocketLabPage({ onBack }: RocketLabPageProps) {
  const game = useGameState();
  const selectedModel = 'standard' as const;

  const [equipped, setEquipped] = useState<EquippedParts>({
    engine: true,
    fuel: true,
    body: true,
    wings: false,
    booster: false,
  });

  const [levels, setLevels] = useState<Record<keyof EquippedParts, number>>({
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

  const handleToggle = (id: keyof EquippedParts) => {
    setEquipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpgrade = (id: keyof EquippedParts) => {
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

    game.recordScore(score);
    setLaunchPower(power);
    setLaunchResult({ score, multiplier, bonus });
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
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#06080F' }}>

      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(12,16,24,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid #1E2636' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 transition-colors group"
                style={{ color: '#4A5468' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E8ECF4')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4A5468')}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: '#0C1018', border: '1px solid #1E2636' }}
                >
                  <ArrowLeft size={15} style={{ color: '#8A94A8' }} />
                </div>
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>
              <div className="h-5 w-px" style={{ background: '#1E2636' }} />
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(148,163,184,0.15)', border: '1px solid rgba(148,163,184,0.35)' }}
                >
                  <FlaskConical size={16} style={{ color: '#94A3B8' }} />
                </div>
                <div>
                  <span className="font-display font-bold text-base leading-none" style={{ color: '#E8ECF4', letterSpacing: '0.04em' }}>Rocket Lab</span>
                  <div className="text-[10px] font-medium leading-none mt-0.5" style={{ color: '#4A5468' }}>Build & Launch</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="hidden sm:flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: '#0C1018', border: '1px solid #1E2636' }}
              >
                <PhiSymbol size={13} color="#E8ECF4" />
                <span className="text-xs font-bold" style={{ color: '#E8ECF4' }}>{game.fluxBalance}</span>
                <span className="text-xs" style={{ color: '#4A5468' }}>FLUX</span>
              </div>
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
            <h1 className="font-display font-black text-3xl md:text-5xl lg:text-6xl mb-3 leading-[1.08]" style={{ color: '#E8ECF4', letterSpacing: '0.04em' }}>
              Rocket Lab
            </h1>
            <p className="text-lg" style={{ color: '#4A5468' }}>
              Build. Launch. Dominate the cosmos.
            </p>
            {bestScore > 0 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2 rounded-2xl px-4 py-2" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
                  <Rocket size={14} style={{ color: '#F97316' }} />
                  <span className="font-data font-bold text-sm" style={{ color: '#E8ECF4' }}>{game.scores.length}</span>
                  <span className="text-xs" style={{ color: '#4A5468' }}>Launches</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl px-4 py-2" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
                  <Star size={14} style={{ color: '#FACC15' }} />
                  <span className="font-data font-bold text-sm" style={{ color: '#E8ECF4' }}>{bestScore.toLocaleString()}</span>
                  <span className="text-xs" style={{ color: '#4A5468' }}>Best GS</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-5 items-start">
            <div className="rounded-3xl overflow-hidden" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
              <div className="px-5 pt-5 pb-2" style={{ borderBottom: '1px solid #1E2636' }}>
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold text-sm" style={{ color: '#E8ECF4', letterSpacing: '0.04em' }}>Preview</p>
                  <div className="flex items-center gap-1.5">
                    <Star size={11} style={{ color: '#4A5468' }} />
                    <span className="font-data text-xs" style={{ color: '#4A5468' }}>
                      {equippedCount}/{totalParts}
                    </span>
                  </div>
                </div>
              </div>
              <RocketPreview
                equipped={equipped}
                model={selectedModel}
                launching={launching}
                onLaunchComplete={handleLaunchComplete}
              />
            </div>

            <div className="rounded-3xl p-5" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
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

              <div className="rounded-3xl p-4" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
                <p className="font-display text-xs font-bold mb-3" style={{ color: '#4A5468', letterSpacing: '0.08em' }}>YOUR LAUNCH HISTORY</p>
                {game.scores.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: '#4A5468' }}>No launches yet. Equip parts and launch!</p>
                ) : (
                  game.scores.slice(-5).reverse().map((score, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid #1E2636' }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-data font-black text-sm w-5 text-center" style={{ color: i === 0 ? '#FACC15' : '#4A5468' }}>
                          {game.scores.length - i}
                        </span>
                        <span className="font-data text-xs" style={{ color: '#4A5468' }}>Launch</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-data font-bold text-xs" style={{ color: '#E8ECF4' }}>{score.toLocaleString()}</span>
                        <span className="font-data text-[10px]" style={{ color: '#4A5468' }}>GS</span>
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

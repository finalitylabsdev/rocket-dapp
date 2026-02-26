import { useState } from 'react';
import { ArrowLeft, FlaskConical, Star } from 'lucide-react';
import RocketPreview from '../components/lab/RocketPreview';
import PartsGrid, { type EquippedParts } from '../components/lab/PartsGrid';
import StatsPanel from '../components/lab/StatsPanel';
import FloatingParticles from '../components/mystery/FloatingParticles';
import { ROCKET_MODELS, type RocketModelId } from '../components/lab/RocketModels';
import LaunchSequence from '../components/lab/LaunchSequence';

interface RocketLabPageProps {
  onBack: () => void;
}

type LaunchResult = { score: number; bonus: string; multiplier: string } | null;

export default function RocketLabPage({ onBack }: RocketLabPageProps) {
  const [selectedModel, setSelectedModel] = useState<RocketModelId>('standard');

  const [equipped, setEquipped] = useState<EquippedParts>({
    engine: true,
    fuel: true,
    body: true,
    wings: false,
    booster: false,
    noseCone: false,
    heatShield: false,
    gyroscope: false,
    solarPanels: false,
    landingStruts: false,
  });

  const [levels, setLevels] = useState<Record<keyof EquippedParts, number>>({
    engine: 1,
    fuel: 2,
    body: 3,
    wings: 1,
    booster: 2,
    noseCone: 1,
    heatShield: 1,
    gyroscope: 1,
    solarPanels: 1,
    landingStruts: 1,
  });

  const [launching, setLaunching] = useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [launchResult, setLaunchResult] = useState<LaunchResult>(null);
  const [launchPower, setLaunchPower] = useState(0);

  const handleToggle = (id: keyof EquippedParts) => {
    setEquipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpgrade = (id: keyof EquippedParts) => {
    setLevels((prev) => ({ ...prev, [id]: Math.min(5, prev[id] + 1) }));
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
    const levelBonus = totalLevels / (equippedCount * 5 || 1);
    const multiplier = (1 + base * 1.5 + levelBonus * 0.5 + modelDef.bonuses.winBonus / 100).toFixed(2);
    const baseScore = 80 + Math.floor(Math.random() * 140);
    const score = Math.round(baseScore * parseFloat(multiplier));
    const bonuses = [
      'Meteor Shower — Wing-Plate damaged',
      'Solar Flare — Navigation penalty',
      'Alien Probe — Random buff applied',
      'Quantum Turbulence — Fuel efficiency reduced',
      'Clear Skies — No penalties',
      'Gravity Slingshot — Bonus multiplier applied',
      'Debris Field — Heat shield activated',
    ];
    const bonus = bonuses[Math.floor(Math.random() * bonuses.length)];

    const power = Math.min(100, Math.max(0, Math.round(
      (equipped.engine ? 38 : 0) +
      (equipped.booster ? 22 : 0) +
      (equipped.fuel ? 12 : 0) +
      (equipped.noseCone ? 10 : 0) +
      levelBonus * 12 +
      modelDef.bonuses.powerBonus
    )));

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

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#06080F' }}>
      <FloatingParticles />

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
                  <span className="font-display font-bold text-base leading-none" style={{ color: '#E8ECF4', letterSpacing: '0.04em' }}>Celestial Assembler</span>
                  <div className="text-[10px] font-medium leading-none mt-0.5" style={{ color: '#4A5468' }}>App 4 · Quantum Lift-Off</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="hidden sm:flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: '#0C1018', border: '1px solid #1E2636' }}
              >
                <div className="glow-dot" />
                <span className="text-xs font-semibold" style={{ color: '#8A94A8' }}>Testnet</span>
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
                Celestial Assembler
              </span>
            </div>
            <h1 className="font-display font-black text-3xl md:text-5xl lg:text-6xl mb-3 leading-[1.08]" style={{ color: '#E8ECF4', letterSpacing: '0.04em' }}>
              Celestial Assembler
            </h1>
            <p className="text-lg" style={{ color: '#4A5468' }}>
              Build. Launch. Dominate the cosmos.
            </p>
          </div>

          <div className="mb-6">
            <p className="font-display font-bold text-sm mb-3" style={{ color: '#8A94A8', letterSpacing: '0.08em' }}>SELECT ROCKET MODEL</p>
            <div className="grid grid-cols-3 gap-3">
              {ROCKET_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className="rounded-2xl p-4 text-left transition-all duration-200 border"
                  style={selectedModel === m.id ? {
                    background: m.accentBg,
                    border: `1px solid ${m.accentBorder}`,
                    boxShadow: `0 0 20px ${m.accentBg}`,
                  } : {
                    background: '#0C1018',
                    border: '1px solid #1E2636',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: selectedModel === m.id ? m.accentColor : '#2A3348' }}
                    />
                    <span
                      className="font-display font-bold text-sm"
                      style={{ color: selectedModel === m.id ? m.accentColor : '#8A94A8', letterSpacing: '0.04em' }}
                    >
                      {m.name}
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: '#4A5468' }}>{m.tagline}</p>
                </button>
              ))}
            </div>
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
                <p className="font-display text-xs font-bold mb-3" style={{ color: '#4A5468', letterSpacing: '0.08em' }}>COSMIC JACKPOT · TOP GRAV SCORES</p>
                {[
                  { rank: 1, addr: '0x1a2b…9f8e', score: '12,400', color: '#FACC15' },
                  { rank: 2, addr: '0x9e0f…5b4c', score: '9,820',  color: '#94A3B8' },
                  { rank: 3, addr: '0x4f5a…6c7d', score: '7,105',  color: '#F97316' },
                ].map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: '1px solid #1E2636' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="font-data font-black text-sm w-5 text-center"
                        style={{ color: entry.color }}
                      >
                        {entry.rank}
                      </span>
                      <span className="font-data text-xs" style={{ color: '#4A5468' }}>{entry.addr}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-data font-bold text-xs" style={{ color: '#E8ECF4' }}>{entry.score}</span>
                      <span className="font-data text-[10px]" style={{ color: '#4A5468' }}>GS</span>
                    </div>
                  </div>
                ))}
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

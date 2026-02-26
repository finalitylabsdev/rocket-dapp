import { Shield, Fuel, Zap, Target, Rocket, TrendingUp } from 'lucide-react';
import type { EquippedParts } from './PartsGrid';
import { ROCKET_MODELS, type RocketModelId } from './RocketModels';

interface StatsPanelProps {
  equipped: EquippedParts;
  levels: Record<keyof EquippedParts, number>;
  model: RocketModelId;
  onLaunch: () => void;
  launching: boolean;
}

function computeStats(equipped: EquippedParts, levels: Record<keyof EquippedParts, number>, model: RocketModelId) {
  const modelDef = ROCKET_MODELS.find((m) => m.id === model)!;
  const eq = Object.values(equipped).filter(Boolean).length;
  const totalParts = Object.keys(equipped).length;
  const totalLevels = Object.entries(levels).reduce(
    (acc, [k, v]) => acc + (equipped[k as keyof EquippedParts] ? v : 0),
    0
  );

  const base = eq / totalParts;
  const bonus = totalLevels / (eq * 3 || 1);

  const stability = Math.round(
    (equipped.wings ? 0.35 : 0.05) * 100 +
    (equipped.body ? 0.3 : 0) * 100 +
    (equipped.booster ? 0.1 : 0) * 100 +
    bonus * 12 +
    modelDef.bonuses.stabilityBonus
  );

  const fuelEff = Math.round(
    (equipped.fuel ? 0.45 : 0.05) * 100 +
    (equipped.engine ? 0.25 : 0) * 100 +
    (equipped.booster ? 0.15 : 0) * 100 +
    bonus * 10 +
    modelDef.bonuses.fuelBonus
  );

  const launchPower = Math.round(
    (equipped.engine ? 0.42 : 0) * 100 +
    (equipped.booster ? 0.28 : 0) * 100 +
    (equipped.fuel ? 0.18 : 0) * 100 +
    bonus * 12 +
    modelDef.bonuses.powerBonus
  );

  const winProb = Math.round(base * 60 + bonus * 20 + (eq === totalParts ? 10 : 0) + modelDef.bonuses.winBonus);

  return {
    stability: Math.min(100, Math.max(0, stability)),
    fuelEff: Math.min(100, Math.max(0, fuelEff)),
    launchPower: Math.min(100, Math.max(0, launchPower)),
    winProb: Math.min(95, Math.max(0, winProb)),
  };
}

function StatBar({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: '#06080F', border: '1px solid #1E2636' }}
          >
            {icon}
          </div>
          <span className="text-sm font-medium" style={{ color: '#8A94A8' }}>{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-data font-bold text-sm" style={{ color: '#E8ECF4' }}>{value}</span>
          <span className="font-data text-xs" style={{ color: '#4A5468' }}>/100</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#06080F', border: '1px solid #1E2636' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}55 0%, ${color} 100%)`,
            boxShadow: value > 60 ? `0 0 8px ${color}60` : 'none',
          }}
        />
      </div>
    </div>
  );
}

export default function StatsPanel({ equipped, levels, model, onLaunch, launching }: StatsPanelProps) {
  const stats = computeStats(equipped, levels, model);
  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const totalParts = Object.keys(equipped).length;
  const canLaunch = equippedCount >= 3;
  const allEquipped = equippedCount === totalParts;
  const modelDef = ROCKET_MODELS.find((m) => m.id === model)!;

  return (
    <div className="rounded-3xl border overflow-hidden" style={{ background: '#06080F', border: '1px solid #1E2636' }}>
      <div className="p-5" style={{ borderBottom: '1px solid #1E2636' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: '#0C1018', border: '1px solid #1E2636' }}
            >
              <TrendingUp size={15} style={{ color: '#8A94A8' }} />
            </div>
            <div>
              <p className="font-display font-bold text-sm" style={{ color: '#E8ECF4', letterSpacing: '0.04em' }}>Rocket Stats</p>
              <p className="font-data text-[11px]" style={{ color: '#4A5468' }}>{equippedCount}/{totalParts} equipped</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
            style={{ background: '#0C1018', border: '1px solid #1E2636' }}
          >
            <Target size={11} style={{ color: '#8A94A8' }} />
            <span className="font-data font-black text-sm" style={{ color: '#E8ECF4' }}>{stats.winProb}%</span>
            <span className="font-data text-[10px]" style={{ color: '#4A5468' }}>WIN</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4" style={{ borderBottom: '1px solid #1E2636' }}>
        <StatBar
          label="Stability"
          value={stats.stability}
          icon={<Shield size={12} style={{ color: '#3B82F6' }} />}
          color="#3B82F6"
        />
        <StatBar
          label="Fuel Efficiency"
          value={stats.fuelEff}
          icon={<Fuel size={12} style={{ color: '#4ADE80' }} />}
          color="#4ADE80"
        />
        <StatBar
          label="Launch Power"
          value={stats.launchPower}
          icon={<Zap size={12} style={{ color: '#F59E0B' }} />}
          color="#F59E0B"
        />
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {
              label: 'Orbit Class',
              value: equippedCount >= 5 ? 'High' : equippedCount >= 3 ? 'Low' : 'Sub',
            },
            {
              label: 'Multiplier',
              value: `${(1 + stats.winProb / 100 * 9).toFixed(1)}×`,
            },
            {
              label: 'φ Reward',
              value: allEquipped ? '1000+' : `${Math.round(stats.winProb * 4)}`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl p-2.5 text-center"
              style={{ background: '#0C1018', border: '1px solid #1E2636' }}
            >
              <p className="font-data font-bold text-sm" style={{ color: '#E8ECF4' }}>{item.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#4A5468' }}>{item.label}</p>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl px-3 py-2 mb-4 flex items-center gap-2"
          style={{ background: `${modelDef.accentBg}`, border: `1px solid ${modelDef.accentBorder}` }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: modelDef.accentColor }} />
          <span className="text-xs font-medium" style={{ color: modelDef.accentColor }}>{modelDef.name}</span>
          <span className="text-xs ml-auto" style={{ color: '#4A5468' }}>{modelDef.tagline}</span>
        </div>

        {!canLaunch && (
          <p className="text-center text-xs mb-3" style={{ color: '#4A5468' }}>
            Equip at least 3 parts to launch
          </p>
        )}

        <button
          onClick={onLaunch}
          disabled={!canLaunch || launching}
          className="relative w-full py-4 rounded-2xl font-display font-black text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-2.5"
          style={canLaunch && !launching ? {
            background: '#F97316',
            color: '#06080F',
            boxShadow: '0 0 32px rgba(249,115,22,0.25), 0 4px 16px rgba(0,0,0,0.4)',
            letterSpacing: '0.06em',
          } : {
            background: '#0C1018',
            color: '#4A5468',
            letterSpacing: '0.06em',
          }}
        >
          {launching ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Launching…
            </>
          ) : (
            <>
              <Rocket size={18} style={{ color: canLaunch ? '#06080F' : '#4A5468' }} fill={canLaunch ? '#06080F' : 'none'} />
              Launch Rocket
              {allEquipped && (
                <span className="absolute right-4 text-xs font-bold" style={{ color: 'rgba(6,8,15,0.6)' }}>
                  {stats.winProb}%
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

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
            className="w-6 h-6 flex items-center justify-center"
            style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
          >
            {icon}
          </div>
          <span className="text-sm font-mono font-medium uppercase tracking-wider text-text-secondary">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-sm text-text-primary">{value}</span>
          <span className="font-mono text-xs text-text-muted">/100</span>
        </div>
      </div>
      <div className="h-2 overflow-hidden" style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}>
        <div
          className="h-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            background: color,
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
    <div className="border overflow-hidden" style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}>
      <div className="p-5" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
            >
              <TrendingUp size={15} className="text-text-secondary" />
            </div>
            <div>
              <p className="font-mono font-bold text-sm uppercase tracking-wider text-text-primary">Rocket Stats</p>
              <p className="font-mono text-[11px] text-text-muted">{equippedCount}/{totalParts} equipped</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
          >
            <Target size={11} className="text-text-secondary" />
            <span className="font-mono font-black text-sm text-text-primary">{stats.winProb}%</span>
            <span className="font-mono text-[10px] text-text-muted">WIN</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <StatBar
          label="Stability"
          value={stats.stability}
          icon={<Shield size={12} style={{ color: '#3B82F6' }} />}
          color="#3B82F6"
        />
        <StatBar
          label="Fuel Eff"
          value={stats.fuelEff}
          icon={<Fuel size={12} style={{ color: '#4ADE80' }} />}
          color="#4ADE80"
        />
        <StatBar
          label="Power"
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
              value: allEquipped ? '1000' : `${Math.round(stats.winProb * 4)}`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-2.5 text-center"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
            >
              <p className="font-mono font-bold text-sm text-text-primary">{item.value}</p>
              <p className="text-[10px] font-mono mt-0.5 uppercase text-text-muted">{item.label}</p>
            </div>
          ))}
        </div>

        <div
          className="px-3 py-2 mb-4 flex items-center gap-2"
          style={{ background: `${modelDef.accentBg}`, border: `1px solid ${modelDef.accentBorder}` }}
        >
          <div className="w-2 h-2 flex-shrink-0" style={{ background: modelDef.accentColor }} />
          <span className="text-xs font-mono font-medium uppercase" style={{ color: modelDef.accentColor }}>{modelDef.name}</span>
          <span className="text-xs font-mono ml-auto text-text-muted">{modelDef.tagline}</span>
        </div>

        {!canLaunch && (
          <p className="text-center text-xs font-mono mb-3 text-text-muted">
            Equip at least 3 parts to launch
          </p>
        )}

        <button
          onClick={onLaunch}
          disabled={!canLaunch || launching}
          className="relative w-full py-4 font-mono font-black text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-2.5 uppercase tracking-widest"
          style={canLaunch && !launching ? {
            background: 'transparent',
            color: '#F97316',
            border: '1px solid #F97316',
          } : {
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          {launching ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
              Launching…
            </>
          ) : (
            <>
              <Rocket size={18} style={{ color: canLaunch ? '#F97316' : 'var(--color-text-muted)' }} fill={canLaunch ? '#F97316' : 'none'} />
              Launch Rocket
              {allEquipped && (
                <span className="absolute right-4 text-xs font-mono font-bold" style={{ color: '#F97316' }}>
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

import type { ReactNode } from 'react';
import { Shield, Fuel, Zap, Target, Rocket, TrendingUp } from 'lucide-react';
import { ROCKET_MODELS, type RocketModelId } from './RocketModels';
import type { RocketLabMetrics } from './rocketLabAdapter';

interface StatsPanelProps {
  metrics: RocketLabMetrics;
  model: RocketModelId;
  onLaunch: () => void;
  launching: boolean;
}

function StatBar({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center"
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

export default function StatsPanel({ metrics, model, onLaunch, launching }: StatsPanelProps) {
  const modelDef = ROCKET_MODELS.find((entry) => entry.id === model) ?? ROCKET_MODELS[0];

  return (
    <div className="border overflow-hidden" style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}>
      <div className="p-5" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
            >
              <TrendingUp size={15} className="text-text-secondary" />
            </div>
            <div>
              <p className="font-mono font-bold text-sm uppercase tracking-wider text-text-primary">Simulation Readout</p>
              <p className="font-mono text-[11px] text-text-muted">
                {metrics.readySlots}/{metrics.totalSlots} canonical slots ready
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
          >
            <Target size={11} className="text-text-secondary" />
            <span className="font-mono font-black text-sm text-text-primary">{metrics.winProbability}%</span>
            <span className="font-mono text-[10px] text-text-muted">SIM</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <StatBar
          label="Stability"
          value={metrics.stability}
          icon={<Shield size={12} style={{ color: '#3B82F6' }} />}
          color="#3B82F6"
        />
        <StatBar
          label="Fuel Eff"
          value={metrics.fuelEfficiency}
          icon={<Fuel size={12} style={{ color: '#4ADE80' }} />}
          color="#4ADE80"
        />
        <StatBar
          label="Launch Power"
          value={metrics.launchPower}
          icon={<Zap size={12} style={{ color: '#F59E0B' }} />}
          color="#F59E0B"
        />
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {
              label: 'Locked',
              value: String(metrics.lockedSlots),
            },
            {
              label: 'Missing',
              value: String(metrics.missingSlots),
            },
            {
              label: 'Base GS',
              value: metrics.gravScoreBase.toLocaleString(),
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
          className="mb-3 flex items-center gap-2 px-3 py-2"
          style={{ background: `${modelDef.accentBg}`, border: `1px solid ${modelDef.accentBorder}` }}
        >
          <div className="h-2 w-2 flex-shrink-0" style={{ background: modelDef.accentColor }} />
          <span className="text-xs font-mono font-medium uppercase" style={{ color: modelDef.accentColor }}>{modelDef.name}</span>
          <span className="ml-auto text-xs font-mono text-text-muted">{modelDef.tagline}</span>
        </div>

        <div
          className="mb-4 px-3 py-2"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">Compatibility Boundary</p>
          <p className="mt-2 text-xs leading-relaxed font-mono text-text-secondary">
            Rocket Lab is reading `GameState.inventory` only. Launch remains a local simulation in this branch, with no FLUX
            writes, payout authority, or server-side launch record.
          </p>
        </div>

        {!metrics.canLaunch && (
          <p className="text-center text-xs font-mono mb-3 text-text-muted">
            {metrics.lockedSlots > 0
              ? 'Resolve auction locks and fill all 8 slots to run the local simulation.'
              : 'All 8 canonical slots must be filled before the local simulation can run.'}
          </p>
        )}

        <button
          onClick={onLaunch}
          disabled={!metrics.canLaunch || launching}
          className="relative w-full py-4 font-mono font-black text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-2.5 uppercase tracking-widest"
          style={metrics.canLaunch && !launching ? {
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
              Simulating…
            </>
          ) : (
            <>
              <Rocket size={18} style={{ color: metrics.canLaunch ? '#F97316' : 'var(--color-text-muted)' }} fill={metrics.canLaunch ? '#F97316' : 'none'} />
              Run Local Launch Simulation
              {metrics.canLaunch && (
                <span className="absolute right-4 text-xs font-mono font-bold" style={{ color: '#F97316' }}>
                  {metrics.winProbability}%
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

import { AlertTriangle, Fuel, Rocket, ShieldCheck, Wrench } from 'lucide-react';
import { ROCKET_MODELS, type RocketModelId } from './RocketModels';
import { getPreviewActionButtonProps, runPreviewGuardedAction } from '../../lib/launchPreview';
import { formatPhiAmount } from '../../lib/tokenDisplay';
import type { RocketLabMetrics } from './rocketLabAdapter';
import type { RocketLaunchHistoryEntry } from '../../lib/rocketLab';

interface StatsPanelProps {
  metrics: RocketLabMetrics;
  model: RocketModelId;
  fluxBalance: number;
  launching: boolean;
  walletConnected: boolean;
  launchReadOnly?: boolean;
  launchError: string | null;
  latestLaunch: RocketLaunchHistoryEntry | null;
  onLaunch: () => void;
}

function formatFlux(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function StatsPanel({
  metrics,
  model,
  fluxBalance,
  launching,
  walletConnected,
  launchReadOnly = false,
  launchError,
  latestLaunch,
  onLaunch,
}: StatsPanelProps) {
  const modelDef = ROCKET_MODELS.find((entry) => entry.id === model) ?? ROCKET_MODELS[0];
  const canAfford = fluxBalance >= metrics.fuelCost;
  const buttonDisabled = launchReadOnly ? false : !walletConnected || !metrics.canLaunch || launching || !canAfford;
  const launchAction = launchReadOnly
    ? getPreviewActionButtonProps('rocketLaunch')
    : {
        disabled: buttonDisabled,
        'aria-disabled': buttonDisabled,
        title: undefined,
        'data-click-denied': undefined as 'true' | undefined,
      };

  const buttonLabel = launchReadOnly
    ? 'Launch Rocket'
    : !walletConnected
    ? 'Connect Wallet'
    : launching
      ? 'Launching…'
      : !metrics.canLaunch
        ? 'Equip All 8 Parts'
        : !canAfford
          ? 'Not enough Φ'
          : 'Launch Rocket';

  return (
    <div className="border overflow-hidden" style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}>
      <div className="p-5" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono font-bold text-sm uppercase tracking-wider text-text-primary">Launch Control</p>
            <p className="mt-1 font-mono text-[11px] text-text-muted">
              {metrics.equippedSlots}/{metrics.totalSlots} sections equipped
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-2.5 py-1.5"
            style={{ background: modelDef.accentBg, border: `1px solid ${modelDef.accentBorder}` }}
          >
            <ShieldCheck size={12} style={{ color: modelDef.accentColor }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: modelDef.accentColor }}>
              {modelDef.name}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: 'Total Power',
              value: metrics.totalPower.toLocaleString(),
            },
            {
              label: 'Fuel Cost',
              value: formatPhiAmount(formatFlux(metrics.fuelCost)),
            },
            {
              label: 'Balance',
              value: formatPhiAmount(formatFlux(fluxBalance)),
            },
            {
              label: 'Damaged',
              value: String(metrics.damagedEquippedSlots),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
              <p className="mt-1 font-mono font-bold text-sm text-text-primary">{item.value}</p>
            </div>
          ))}
        </div>

        <div
          className="px-3 py-3"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
        >
          <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">
            <span>Average Condition</span>
            <span>{metrics.averageCondition}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden" style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}>
            <div
              className="h-full"
              style={{
                width: `${metrics.averageCondition}%`,
                background: metrics.averageCondition > 50
                  ? 'linear-gradient(90deg, rgba(34,197,94,0.45), #22C55E)'
                  : 'linear-gradient(90deg, rgba(245,158,11,0.4), #F59E0B)',
              }}
            />
          </div>
        </div>

        <div
          className="px-3 py-3"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">Latest Score Breakdown</p>
          {latestLaunch ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: 'Base', value: latestLaunch.scoreBreakdown.base },
                { label: 'Luck', value: latestLaunch.scoreBreakdown.luck },
                { label: 'Random', value: latestLaunch.scoreBreakdown.randomness },
                { label: 'Total', value: latestLaunch.scoreBreakdown.total },
              ].map((item) => (
                <div
                  key={item.label}
                  className="px-2.5 py-2"
                  style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                  <p className="mt-1 font-mono font-bold text-sm text-text-primary">{item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs font-mono leading-relaxed text-text-secondary">
              Your next launch will populate the first server score breakdown here.
            </p>
          )}
        </div>

        {launchError && (
          <div
            className="flex items-start gap-2 px-3 py-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={14} className="mt-0.5 text-red-400" />
            <p className="text-xs font-mono leading-relaxed text-red-300">{launchError}</p>
          </div>
        )}

        {!metrics.canLaunch && (
          <div
            className="flex items-start gap-2 px-3 py-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)' }}
          >
            <Wrench size={14} className="mt-0.5 text-amber-400" />
            <p className="text-xs font-mono leading-relaxed text-text-secondary">
              {metrics.blockedSlots > 0
                ? 'At least one equipped slot is blocked by locked or broken inventory. Repair or swap parts before launch.'
                : 'Equip one valid part in every rocket section before launch.'}
            </p>
          </div>
        )}
      </div>

      <div className="p-4">
        <button
          onClick={runPreviewGuardedAction('rocketLaunch', onLaunch)}
          disabled={launchAction.disabled}
          aria-disabled={launchAction['aria-disabled']}
          title={launchAction.title}
          data-click-denied={launchAction['data-click-denied']}
          className="relative w-full px-4 py-3 font-mono font-black text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-2 uppercase tracking-widest"
          style={buttonDisabled ? {
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border-subtle)',
          } : {
            background: 'transparent',
            color: '#F97316',
            border: '1px solid #F97316',
          }}
        >
          <span className="flex items-center gap-2">
            {launching ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Rocket size={22} strokeWidth={2.5} style={{ color: buttonDisabled ? 'var(--color-text-muted)' : '#F97316' }} />
            )}
            {buttonLabel}
          </span>
          {!buttonDisabled && (
            <>
              <span className="h-4 w-px mx-1" style={{ background: 'rgba(249,115,22,0.25)' }} />
              <span className="flex items-center gap-1 text-sm font-mono font-black ml-auto" style={{ color: '#F97316' }}>
                <Fuel size={13} strokeWidth={2.5} />
                {formatFlux(metrics.fuelCost)}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

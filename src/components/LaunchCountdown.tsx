import { Clock3 } from 'lucide-react';
import { LAUNCH_COUNTDOWN_ENABLED, LAUNCH_COUNTDOWN_TARGET_UTC_MS } from '../config/flags';
import { useCountdown } from '../hooks/useCountdown';

const TARGET_LABEL = 'March 3, 2026 · 23:11 UTC';

function formatSegment(value: number): string {
  return String(value).padStart(2, '0');
}

export default function LaunchCountdown() {
  const countdown = useCountdown(LAUNCH_COUNTDOWN_TARGET_UTC_MS);

  if (!LAUNCH_COUNTDOWN_ENABLED) {
    return null;
  }

  const segments = [
    { label: 'Days', value: formatSegment(countdown.parts.days) },
    { label: 'Hours', value: formatSegment(countdown.parts.hours) },
    { label: 'Minutes', value: formatSegment(countdown.parts.minutes) },
    { label: 'Seconds', value: formatSegment(countdown.parts.seconds) },
  ];

  return (
    <div
      className="mx-auto max-w-3xl border p-4 sm:p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(12,16,24,0.96), rgba(10,15,26,0.92))',
        borderColor: 'rgba(74,222,128,0.2)',
        boxShadow: '0 20px 56px rgba(0, 0, 0, 0.22)',
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 tag">
            <Clock3 size={12} />
            Launch Window Countdown
          </div>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
            Fixed Target
          </p>
          <p className="mt-1 font-mono font-bold text-sm text-text-primary">
            {TARGET_LABEL}
          </p>
          <p className="mt-2 text-sm text-text-muted">
            {countdown.isExpired
              ? 'The scheduled launch window is live.'
              : 'This timer is pinned to UTC and stays consistent across browser timezones.'}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {segments.map((segment) => (
            <div
              key={segment.label}
              className="min-w-[72px] border px-3 py-3 text-center"
              style={{ background: 'var(--color-bg-base)', borderColor: 'var(--color-border-subtle)' }}
            >
              <p className="font-mono font-black text-lg text-text-primary sm:text-xl">
                {segment.value}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                {segment.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

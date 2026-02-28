
import { LAUNCH_COUNTDOWN_ENABLED, LAUNCH_COUNTDOWN_TARGET_UTC_MS } from '../config/flags';
import { useCountdown } from '../hooks/useCountdown';

const TARGET_LABEL = 'March 3, 2026 · 11:11 PM UTC';

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
      className="w-screen relative left-1/2 -translate-x-1/2 border-y py-5 sm:py-6"
      style={{
        background: 'transparent',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag">
                <div className="glow-dot" />
                Testnet Closed Alpha
              </span>
            </div>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
              Alpha Goes Public
            </p>
            <p className="mt-1 font-mono font-normal text-sm text-text-primary">
              {TARGET_LABEL}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
            {segments.map((segment) => (
              <div
                key={segment.label}
                className="min-w-[52px] sm:min-w-[72px] border px-2 py-2 sm:px-3 sm:py-3 text-center"
                style={{ background: 'transparent', borderColor: 'var(--color-border-subtle)' }}
              >
                <p className="font-mono font-black text-base text-text-primary sm:text-xl">
                  {segment.value}
                </p>
                <p className="mt-0.5 sm:mt-1 font-mono text-[8px] sm:text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  {segment.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

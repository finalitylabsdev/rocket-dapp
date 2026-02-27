import type { RarityTier } from '../brand/RarityBadge';
import { getRarityConfig } from '../brand/RarityBadge';
import type { RocketSection } from '../../types/domain';

interface IllustrationProps {
  equipped: boolean;
  rarity: RarityTier;
  size?: number;
}

function getAccent(rarity: RarityTier, equipped: boolean) {
  if (!equipped) return { primary: '#2a2f3d', secondary: '#1a1f2a', highlight: '#3a4050', glow: 'none' };
  const cfg = getRarityConfig(rarity);
  return { primary: cfg.color, secondary: cfg.bg, highlight: cfg.border, glow: cfg.glow };
}

export function PulseEngineIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="pe-bg" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#1e2535" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <radialGradient id="pe-metal" cx="30%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#4a5068" />
          <stop offset="40%" stopColor="#2a2f3d" />
          <stop offset="100%" stopColor="#141820" />
        </radialGradient>
        <radialGradient id="pe-core" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor={equipped ? a.primary : '#2a2f3d'} stopOpacity="0.9" />
          <stop offset="100%" stopColor={equipped ? a.primary : '#1a1f2a'} stopOpacity="0.2" />
        </radialGradient>
        <filter id="pe-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="pe-sheen" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.12" />
          <stop offset="50%" stopColor="white" stopOpacity="0.04" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#pe-bg)" />

      {equipped && (
        <ellipse cx="36" cy="36" rx="28" ry="28"
          fill={a.primary} fillOpacity="0.06"
          style={{ filter: `blur(12px)` }}
        />
      )}

      <ellipse cx="36" cy="36" rx="22" ry="22" fill="url(#pe-metal)" stroke="#3a4050" strokeWidth="1" />
      <ellipse cx="36" cy="36" rx="22" ry="22" fill="url(#pe-sheen)" />

      {[18, 14, 10].map((r, i) => (
        <ellipse key={i} cx="36" cy="36" rx={r} ry={r}
          fill="none"
          stroke={equipped ? a.primary : '#2a2f3d'}
          strokeWidth={i === 0 ? 1.5 : 1}
          strokeOpacity={equipped ? 0.5 - i * 0.12 : 0.2}
        />
      ))}

      <ellipse cx="36" cy="36" rx="7" ry="7" fill="url(#pe-core)" />
      <ellipse cx="36" cy="36" rx="3.5" ry="3.5"
        fill={equipped ? a.primary : '#2a2f3d'}
        fillOpacity={equipped ? 0.95 : 0.3}
      />

      {equipped && (
        <ellipse cx="36" cy="36" rx="3.5" ry="3.5"
          fill={a.primary}
          style={{ filter: `blur(4px)` }}
          fillOpacity="0.6"
        />
      )}

      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 36 + Math.cos(rad) * 18;
        const y1 = 36 + Math.sin(rad) * 18;
        const x2 = 36 + Math.cos(rad) * 22;
        const y2 = 36 + Math.sin(rad) * 22;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={equipped ? a.primary : '#2a2f3d'}
            strokeWidth="2" strokeLinecap="round"
            strokeOpacity={equipped ? 0.7 : 0.2}
          />
        );
      })}

      <line x1="12" y1="20" x2="22" y2="24" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" strokeLinecap="round" />
      <line x1="18" y1="14" x2="22" y2="20" stroke="white" strokeWidth="0.4" strokeOpacity="0.1" strokeLinecap="round" />
    </svg>
  );
}

export function NebulaTankIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="nt-bg" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#1a1e2d" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <linearGradient id="nt-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a4055" />
          <stop offset="50%" stopColor="#1e2535" />
          <stop offset="100%" stopColor="#0e111a" />
        </linearGradient>
        <linearGradient id="nt-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="30%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nt-fluid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={equipped ? a.primary : '#2a2f3d'} stopOpacity="0.7" />
          <stop offset="100%" stopColor={equipped ? a.primary : '#1a1f2a'} stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#nt-bg)" />

      <rect x="22" y="8" width="28" height="4" rx="2" fill="url(#nt-body)" stroke="#3a4050" strokeWidth="0.8" />
      <rect x="20" y="12" width="32" height="48" rx="8" fill="url(#nt-body)" stroke="#3a4050" strokeWidth="1" />
      <rect x="20" y="12" width="32" height="48" rx="8" fill="url(#nt-sheen)" />
      <rect x="24" y="60" width="24" height="4" rx="2" fill="url(#nt-body)" stroke="#3a4050" strokeWidth="0.8" />

      {[22, 32, 42].map((y, i) => (
        <rect key={i} x="24" y={y} width="24" height={8} rx="2"
          fill={equipped ? a.primary : '#1a1f2a'}
          fillOpacity={equipped ? 0.18 - i * 0.04 : 0.06}
          stroke={equipped ? a.primary : '#2a2f3d'}
          strokeOpacity={equipped ? 0.3 : 0.12}
          strokeWidth="0.6"
        />
      ))}

      {equipped && (
        <rect x="28" y="18" width="16" height="36" rx="3"
          fill="url(#nt-fluid)"
          style={{ filter: 'blur(1px)' }}
        />
      )}

      <rect x="26" y="14" width="5" height="44" rx="2" fill="white" fillOpacity="0.05" />

      <rect x="30" y="8" width="12" height="52" rx="6" fill="none" stroke="white" strokeOpacity="0.04" strokeWidth="1" />

      {[20, 32, 44, 56].map((y) => (
        <line key={y} x1="21" y1={y} x2="51" y2={y} stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
      ))}

      {equipped && (
        <ellipse cx="36" cy="36" rx="14" ry="22"
          fill={a.primary} fillOpacity="0.04"
          style={{ filter: 'blur(8px)' }}
        />
      )}
    </svg>
  );
}

export function RadiationMantleIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="rm-bg" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#181b28" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <linearGradient id="rm-panel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a4055" />
          <stop offset="100%" stopColor="#141820" />
        </linearGradient>
        <linearGradient id="rm-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="35%" stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#rm-bg)" />

      <path d="M36 10 L58 20 L62 52 C62 62 50 66 36 68 C22 66 10 62 10 52 L14 20 Z"
        fill="url(#rm-panel)" stroke="#3a4055" strokeWidth="1" />
      <path d="M36 10 L58 20 L62 52 C62 62 50 66 36 68 C22 66 10 62 10 52 L14 20 Z"
        fill="url(#rm-sheen)" />

      <path d="M36 16 L54 24 L57 50 C57 58 46 62 36 63.5 C26 62 15 58 15 50 L18 24 Z"
        fill="none"
        stroke={equipped ? a.primary : '#2a2f3d'}
        strokeWidth="1"
        strokeOpacity={equipped ? 0.4 : 0.15}
      />

      {[[20, 28, 38, 44], [24, 34, 38, 38], [28, 40, 38, 32], [32, 46, 38, 26]].map(([x1, y1, x2, y2], i) => (
        <line key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="white" strokeWidth="0.5" strokeOpacity="0.08" strokeLinecap="round"
        />
      ))}

      <path d="M36 22 L50 28 L52 47 C52 54 44 57 36 58 C28 57 20 54 20 47 L22 28 Z"
        fill={equipped ? a.primary : 'transparent'}
        fillOpacity={equipped ? 0.07 : 0}
      />

      <circle cx="36" cy="38" r="8"
        fill="none"
        stroke={equipped ? a.primary : '#2a2f3d'}
        strokeWidth="1"
        strokeOpacity={equipped ? 0.5 : 0.15}
      />
      <circle cx="36" cy="38" r="4"
        fill={equipped ? a.primary : '#1a1f2a'}
        fillOpacity={equipped ? 0.4 : 0.1}
      />
      <circle cx="36" cy="38" r="2"
        fill={equipped ? a.primary : '#2a2f3d'}
        fillOpacity={equipped ? 0.9 : 0.2}
      />

      {equipped && (
        <circle cx="36" cy="38" r="6"
          fill={a.primary}
          fillOpacity="0.15"
          style={{ filter: 'blur(4px)' }}
        />
      )}
    </svg>
  );
}

export function SolarWingsIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="sw-bg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#1a1e2d" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <linearGradient id="sw-panel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a4055" />
          <stop offset="60%" stopColor="#1e2535" />
          <stop offset="100%" stopColor="#0e111a" />
        </linearGradient>
        <linearGradient id="sw-cell" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={equipped ? a.primary : '#1a1f2a'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={equipped ? a.primary : '#0e1018'} stopOpacity="0.08" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#sw-bg)" />

      <path d="M36 32 L8 16 L6 24 L26 36 L6 48 L8 56 L36 40 Z"
        fill="url(#sw-panel)" stroke="#3a4055" strokeWidth="1" />
      <path d="M36 32 L64 16 L66 24 L46 36 L66 48 L64 56 L36 40 Z"
        fill="url(#sw-panel)" stroke="#3a4055" strokeWidth="1" />

      {[[-2, 16, 12, 8], [10, 20, 4, 8], [22, 24, -4, 8], [-2, 40, 12, 8], [10, 44, 4, 8], [22, 48, -4, 8]].map(([cx, cy, w, h], i) => (
        <rect key={`l${i}`} x={cx} y={cy} width={Math.abs(w)} height={h} rx="1"
          fill="url(#sw-cell)"
          stroke={equipped ? a.primary : '#1a2030'}
          strokeOpacity={equipped ? 0.25 : 0.1}
          strokeWidth="0.5"
          transform={w < 0 ? `rotate(${Math.atan2(h / 4, Math.abs(w)) * 4}deg)` : undefined}
        />
      ))}

      {[[72, 16, 12, 8], [62, 20, 4, 8], [50, 24, -4, 8], [72, 40, 12, 8], [62, 44, 4, 8], [50, 48, -4, 8]].map(([cx, cy, , h], i) => (
        <rect key={`r${i}`} x={cx - 12} y={cy} width={12} height={h} rx="1"
          fill="url(#sw-cell)"
          stroke={equipped ? a.primary : '#1a2030'}
          strokeOpacity={equipped ? 0.25 : 0.1}
          strokeWidth="0.5"
        />
      ))}

      <rect x="33" y="28" width="6" height="16" rx="3"
        fill="url(#sw-panel)" stroke="#4a5068" strokeWidth="1" />

      {equipped && (
        <>
          <line x1="6" y1="36" x2="66" y2="36"
            stroke={a.primary} strokeWidth="0.5" strokeOpacity="0.25"
            style={{ filter: 'blur(1px)' }}
          />
          <rect x="0" y="28" width="72" height="16"
            fill={a.primary} fillOpacity="0.04"
            style={{ filter: 'blur(6px)' }}
          />
        </>
      )}
    </svg>
  );
}

export function IonArrayIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="ia-bg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#1a1e2d" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <linearGradient id="ia-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a4055" />
          <stop offset="100%" stopColor="#141820" />
        </linearGradient>
        <radialGradient id="ia-nozzle" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor={equipped ? a.primary : '#2a2f3d'} stopOpacity="0.7" />
          <stop offset="100%" stopColor={equipped ? a.primary : '#1a1f2a'} stopOpacity="0.05" />
        </radialGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#ia-bg)" />

      <rect x="14" y="12" width="44" height="28" rx="5"
        fill="url(#ia-body)" stroke="#3a4050" strokeWidth="1" />

      {[20, 30, 40, 50].map((x, i) => (
        <g key={i}>
          <rect x={x - 3} y="15" width="6" height="22" rx="3"
            fill="#0e111a" stroke="#2a2f3d" strokeWidth="0.8" />
          <ellipse cx={x} cy="37"
            rx="3" ry="2"
            fill="url(#ia-nozzle)" />
          {equipped && (
            <ellipse cx={x} cy="40"
              rx={2 + i * 0.3} ry={3 + i * 0.2}
              fill={a.primary}
              fillOpacity="0.25"
              style={{ filter: 'blur(2px)' }}
            />
          )}
        </g>
      ))}

      <rect x="14" y="40" width="44" height="3" rx="1.5"
        fill={equipped ? a.primary : '#1a1f2a'}
        fillOpacity={equipped ? 0.3 : 0.08}
      />

      {[22, 30, 38, 46].map((x, i) => (
        <path key={i}
          d={`M${x} 43 L${x - 3} 58 M${x} 43 L${x + 3} 58`}
          stroke="url(#ia-body)" strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}

      {[22, 30, 38, 46].map((x) => (
        <ellipse key={x} cx={x} cy="59" rx="4" ry="2"
          fill="url(#ia-body)" stroke="#2a2f3d" strokeWidth="0.5"
        />
      ))}

      {equipped && (
        <rect x="14" y="55" width="44" height="12"
          fill={a.primary} fillOpacity="0.05"
          style={{ filter: 'blur(8px)' }}
        />
      )}

      <rect x="16" y="14" width="8" height="26" rx="2" fill="white" fillOpacity="0.04" />
    </svg>
  );
}

export function NovaThrusterIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="nt2-bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1a1e2d" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <linearGradient id="nt2-cone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a5068" />
          <stop offset="50%" stopColor="#2a2f3d" />
          <stop offset="100%" stopColor="#0e111a" />
        </linearGradient>
        <radialGradient id="nt2-tip" cx="50%" cy="15%" r="85%">
          <stop offset="0%" stopColor={equipped ? a.primary : '#3a4050'} />
          <stop offset="100%" stopColor={equipped ? a.primary : '#1a1f2a'} stopOpacity="0.2" />
        </radialGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#nt2-bg)" />

      <path d="M36 8 L46 14 L42 52 L30 52 L26 14 Z"
        fill="url(#nt2-cone)" stroke="#3a4050" strokeWidth="1" />
      <path d="M36 8 L46 14 L42 52 L30 52 L26 14 Z"
        fill="white" fillOpacity="0.04"
      />

      <path d="M36 8 L38 14 L38 52 L34 52 L34 14 Z"
        fill="white" fillOpacity="0.06"
      />

      {[18, 26, 34, 42].map((y) => (
        <line key={y}
          x1={36 - (y - 8) * 0.28 + 1} y1={y}
          x2={36 + (y - 8) * 0.28 - 1} y2={y}
          stroke="white" strokeOpacity="0.06" strokeWidth="0.5"
        />
      ))}

      <circle cx="36" cy="10" r="4"
        fill="url(#nt2-tip)"
      />
      {equipped && (
        <circle cx="36" cy="10" r="3"
          fill={a.primary}
          fillOpacity="0.5"
          style={{ filter: 'blur(3px)' }}
        />
      )}

      <path d="M26 52 L18 64 L24 62 L30 66 L36 60 L42 66 L48 62 L54 64 L46 52 Z"
        fill="url(#nt2-cone)" stroke="#2a2f3d" strokeWidth="1" />

      {equipped && (
        <ellipse cx="36" cy="64" rx="14" ry="4"
          fill={a.primary} fillOpacity="0.2"
          style={{ filter: 'blur(5px)' }}
        />
      )}
    </svg>
  );
}

export function ImpactFieldIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="if-bg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#1a1e2d" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <linearGradient id="if-hex" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a4055" />
          <stop offset="100%" stopColor="#141820" />
        </linearGradient>
        <linearGradient id="if-active" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={equipped ? a.primary : '#1a1f2a'} stopOpacity="0.35" />
          <stop offset="100%" stopColor={equipped ? a.primary : '#0e1018'} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#if-bg)" />

      {equipped && (
        <circle cx="36" cy="36" r="26"
          fill={a.primary} fillOpacity="0.05"
          style={{ filter: 'blur(10px)' }}
        />
      )}

      {[
        [36, 14, 10], [20, 23, 10], [52, 23, 10],
        [12, 36, 10], [60, 36, 10],
        [20, 49, 10], [52, 49, 10], [36, 58, 10],
      ].map(([cx, cy, r], i) => {
        const pts = Array.from({ length: 6 }, (_, k) => {
          const ang = (k * 60 - 30) * Math.PI / 180;
          return `${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`;
        }).join(' ');
        return (
          <polygon key={i} points={pts}
            fill={i === 7 ? 'url(#if-active)' : 'url(#if-hex)'}
            stroke={equipped ? a.primary : '#2a2f3d'}
            strokeOpacity={equipped ? 0.35 : 0.15}
            strokeWidth="0.8"
          />
        );
      })}

      <polygon points="36,26 43,30 43,38 36,42 29,38 29,30"
        fill="url(#if-active)"
        stroke={equipped ? a.primary : '#2a2f3d'}
        strokeOpacity={equipped ? 0.6 : 0.2}
        strokeWidth="1.2"
      />
      <circle cx="36" cy="36" r="4"
        fill={equipped ? a.primary : '#1a1f2a'}
        fillOpacity={equipped ? 0.8 : 0.15}
      />

      {equipped && (
        <circle cx="36" cy="36" r="3"
          fill={a.primary}
          style={{ filter: 'blur(3px)' }}
          fillOpacity="0.5"
        />
      )}
    </svg>
  );
}

export function AstroGyroIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="ag-bg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#1a1e2d" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <radialGradient id="ag-sphere" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#4a5068" />
          <stop offset="60%" stopColor="#1e2535" />
          <stop offset="100%" stopColor="#0e111a" />
        </radialGradient>
        <linearGradient id="ag-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a5068" />
          <stop offset="100%" stopColor="#1a1f2a" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#ag-bg)" />

      {equipped && (
        <circle cx="36" cy="36" r="24"
          fill={a.primary} fillOpacity="0.04"
          style={{ filter: 'blur(8px)' }}
        />
      )}

      <ellipse cx="36" cy="36" rx="22" ry="8"
        fill="none"
        stroke={equipped ? a.primary : '#2a2f3d'}
        strokeOpacity={equipped ? 0.5 : 0.2}
        strokeWidth="2"
      />

      <ellipse cx="36" cy="36" rx="8" ry="22"
        fill="none"
        stroke={equipped ? a.primary : '#2a2f3d'}
        strokeOpacity={equipped ? 0.4 : 0.15}
        strokeWidth="2"
      />

      <ellipse cx="36" cy="36" rx="14" ry="14"
        fill="none"
        stroke="#3a4050"
        strokeWidth="1.5"
        transform="rotate(45 36 36)"
      />

      <circle cx="36" cy="36" r="12"
        fill="url(#ag-sphere)"
      />
      <circle cx="36" cy="36" r="12"
        fill="white" fillOpacity="0.05"
      />

      <circle cx="36" cy="36" r="5"
        fill={equipped ? a.primary : '#1a1f2a'}
        fillOpacity={equipped ? 0.7 : 0.12}
      />
      <circle cx="36" cy="36" r="2.5"
        fill={equipped ? a.primary : '#2a2f3d'}
        fillOpacity={equipped ? 1 : 0.3}
      />

      {[0, 90, 180, 270].map((deg, i) => {
        const rad = deg * Math.PI / 180;
        const x = 36 + Math.cos(rad) * 20;
        const y = 36 + Math.sin(rad) * 20;
        return (
          <circle key={i} cx={x} cy={y} r="2.5"
            fill={equipped ? a.primary : '#2a2f3d'}
            fillOpacity={equipped ? 0.6 : 0.15}
          />
        );
      })}
    </svg>
  );
}

export function PhotonSailsIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="ps-bg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#1a1e2d" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <linearGradient id="ps-sail" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a4055" />
          <stop offset="100%" stopColor="#0e111a" />
        </linearGradient>
        <linearGradient id="ps-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={equipped ? a.primary : '#1a1f2a'} stopOpacity="0.5" />
          <stop offset="100%" stopColor={equipped ? a.primary : '#0e1018'} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#ps-bg)" />

      <path d="M36 8 C28 14 12 18 8 36 C12 54 28 58 36 64 C44 58 60 54 64 36 C60 18 44 14 36 8 Z"
        fill="url(#ps-sail)" stroke="#3a4050" strokeWidth="1" />
      <path d="M36 8 C28 14 12 18 8 36 C12 54 28 58 36 64 C44 58 60 54 64 36 C60 18 44 14 36 8 Z"
        fill="url(#ps-glow)" />

      {[16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60].map((y, i) => (
        <line key={i}
          x1={10 + Math.sin((y - 36) * 0.1) * 5}
          y1={y}
          x2={62 - Math.sin((y - 36) * 0.1) * 5}
          y2={y}
          stroke={equipped ? a.primary : '#2a2f3d'}
          strokeOpacity={equipped ? 0.12 : 0.06}
          strokeWidth="0.6"
        />
      ))}

      <line x1="36" y1="8" x2="36" y2="64"
        stroke="#3a4050" strokeWidth="1.5" strokeLinecap="round"
      />

      {[-16, -10, -4, 0, 4, 10, 16].map((dy, i) => (
        <line key={i}
          x1="36" y1={36 + dy}
          x2={36 + Math.cos((dy) * 0.12) * 22}
          y2={36 + dy}
          stroke={equipped ? a.primary : '#2a2f3d'}
          strokeOpacity={equipped ? 0.15 : 0.06}
          strokeWidth="0.5"
        />
      ))}

      {equipped && (
        <>
          <path d="M36 8 C28 14 12 18 8 36 C12 54 28 58 36 64 C44 58 60 54 64 36 C60 18 44 14 36 8 Z"
            fill={a.primary} fillOpacity="0.04"
            style={{ filter: 'blur(6px)' }}
          />
          <ellipse cx="36" cy="36" rx="4" ry="4"
            fill={a.primary} fillOpacity="0.7"
          />
        </>
      )}

      <circle cx="36" cy="36" r="3"
        fill={equipped ? a.primary : '#2a2f3d'}
        fillOpacity={equipped ? 0.9 : 0.2}
      />
    </svg>
  );
}

export function StarFiberIllustration({ equipped, rarity, size = 72 }: IllustrationProps) {
  const a = getAccent(rarity, equipped);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <defs>
        <radialGradient id="sf-bg" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#1a1e2d" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <linearGradient id="sf-sleeve" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a5068" />
          <stop offset="100%" stopColor="#141820" />
        </linearGradient>
        <linearGradient id="sf-cable1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={equipped ? a.primary : '#2a2f3d'} />
          <stop offset="100%" stopColor={equipped ? a.primary : '#1a1f2a'} stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="14" fill="url(#sf-bg)" />

      {[
        { x1: 18, y1: 10, x2: 28, y2: 62, w: 3 },
        { x1: 28, y1: 8,  x2: 34, y2: 64, w: 3 },
        { x1: 38, y1: 8,  x2: 44, y2: 64, w: 3 },
        { x1: 44, y1: 10, x2: 54, y2: 62, w: 3 },
      ].map((c, i) => (
        <line key={i}
          x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
          stroke="url(#sf-cable1)"
          strokeWidth={c.w}
          strokeLinecap="round"
          strokeOpacity={equipped ? 0.6 + i * 0.07 : 0.15}
        />
      ))}

      {[16, 26, 36, 46, 56].map((y, i) => (
        <rect key={i}
          x="16" y={y - 3}
          width="40" height="6" rx="3"
          fill="url(#sf-sleeve)"
          stroke="#3a4050" strokeWidth="0.7"
        />
      ))}

      {equipped && (
        <>
          {[
            { x1: 18, y1: 10, x2: 28, y2: 62 },
            { x1: 44, y1: 10, x2: 54, y2: 62 },
          ].map((c, i) => (
            <line key={i}
              x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
              stroke={a.primary}
              strokeWidth="1"
              strokeOpacity="0.4"
              style={{ filter: 'blur(2px)' }}
            />
          ))}
        </>
      )}

      <rect x="16" y="8" width="40" height="8" rx="4"
        fill="url(#sf-sleeve)" stroke="#3a4050" strokeWidth="0.8"
      />
      <rect x="16" y="56" width="40" height="8" rx="4"
        fill="url(#sf-sleeve)" stroke="#3a4050" strokeWidth="0.8"
      />
    </svg>
  );
}

export const SECTION_ILLUSTRATIONS: Record<RocketSection, React.ComponentType<IllustrationProps>> = {
  coreEngine:        PulseEngineIllustration,
  wingPlate:         SolarWingsIllustration,
  fuelCell:          NebulaTankIllustration,
  navigationModule:  AstroGyroIllustration,
  payloadBay:        PhotonSailsIllustration,
  thrusterArray:     IonArrayIllustration,
  propulsionCables:  StarFiberIllustration,
  shielding:         RadiationMantleIllustration,
};

export function SectionIllustration({ section, equipped, rarity, size = 72 }: {
  section: RocketSection;
  equipped: boolean;
  rarity: RarityTier;
  size?: number;
}) {
  const Component = SECTION_ILLUSTRATIONS[section];
  return <Component equipped={equipped} rarity={rarity} size={size} />;
}

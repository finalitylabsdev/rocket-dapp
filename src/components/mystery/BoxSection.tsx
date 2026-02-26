import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import RarityBadge, { type RarityTier, RARITY_CONFIG } from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';

interface BoxTier {
  id: string;
  name: string;
  price: number;
  rarity: RarityTier;
  tagline: string;
  rewards: string[];
  possible: { label: string; value: string }[];
  dropChance: string;
}

const TIERS: BoxTier[] = [
  {
    id: 'common',
    name: 'Void Crate',
    price: 10,
    rarity: 'Common',
    tagline: 'The starting point',
    rewards: ['Common part (×1.0)', 'Uncommon part (×1.25)', 'XP Boost +50', 'Blueprint fragment'],
    possible: [{ label: 'Best Drop', value: 'Uncommon' }, { label: 'Win Chance', value: '60%' }],
    dropChance: 'Common · Uncommon',
  },
  {
    id: 'uncommon',
    name: 'Nebula Crate',
    price: 25,
    rarity: 'Uncommon',
    tagline: 'Slightly elevated',
    rewards: ['Uncommon part (×1.25)', 'Rare part (×1.6)', 'XP Boost +120', 'φ Dust ×2'],
    possible: [{ label: 'Best Drop', value: 'Rare' }, { label: 'Win Chance', value: '38%' }],
    dropChance: 'Uncommon · Rare',
  },
  {
    id: 'rare',
    name: 'Star Vault Box',
    price: 75,
    rarity: 'Rare',
    tagline: 'Feels good',
    rewards: ['Rare part (×1.6)', 'Epic part (×2.0)', 'Legendary part (×2.5)', 'Nebula Bids eligible'],
    possible: [{ label: 'Best Drop', value: 'Legendary' }, { label: 'Win Chance', value: '25%' }],
    dropChance: 'Rare · Epic · Legendary',
  },
  {
    id: 'epic',
    name: 'Astral Chest',
    price: 200,
    rarity: 'Epic',
    tagline: 'Pulsing with energy',
    rewards: ['Epic part (×2.0)', 'Legendary part (×2.5)', 'Mythic part (×3.2)', 'Auto-bid credit'],
    possible: [{ label: 'Best Drop', value: 'Mythic' }, { label: 'Win Chance', value: '14%' }],
    dropChance: 'Epic · Legendary · Mythic',
  },
  {
    id: 'legendary',
    name: 'Solaris Vault',
    price: 400,
    rarity: 'Legendary',
    tagline: 'Shimmer of gold',
    rewards: ['Legendary part (×2.5)', 'Mythic part (×3.2)', 'Celestial part (×4.0)', 'Auction eligible'],
    possible: [{ label: 'Best Drop', value: 'Celestial' }, { label: 'Win Chance', value: '7%' }],
    dropChance: 'Legendary · Mythic · Celestial',
  },
  {
    id: 'mythic',
    name: 'Ember Forge',
    price: 750,
    rarity: 'Mythic',
    tagline: 'Forged in cosmic fire',
    rewards: ['Mythic part (×3.2)', 'Celestial part (×4.0)', 'Quantum part (×5.0)', 'Auto-auction eligible'],
    possible: [{ label: 'Best Drop', value: 'Quantum' }, { label: 'Win Chance', value: '3%' }],
    dropChance: 'Mythic · Celestial · Quantum',
  },
  {
    id: 'celestial',
    name: 'Aurora Vault',
    price: 1200,
    rarity: 'Celestial',
    tagline: 'Ethereal and otherworldly',
    rewards: ['Celestial part (×4.0)', 'Quantum part (×5.0)', 'φ Multiplier ×2.5', 'Priority auction access'],
    possible: [{ label: 'Best Drop', value: 'Quantum' }, { label: 'Win Chance', value: '1.5%' }],
    dropChance: 'Celestial · Quantum',
  },
  {
    id: 'quantum',
    name: 'Quantum Chest',
    price: 2500,
    rarity: 'Quantum',
    tagline: 'The holy grail',
    rewards: ['Quantum part guaranteed', 'φ Multiplier ×5.0', 'Leaderboard immunity', 'Legendary status'],
    possible: [{ label: 'Best Drop', value: 'Quantum' }, { label: 'Win Chance', value: '0.7%' }],
    dropChance: 'Quantum guaranteed',
  },
];

type BoxState = 'idle' | 'shaking' | 'cracking' | 'revealed';

interface BoxIllustrationProps {
  tier: BoxTier;
  state: BoxState;
}

function BoxIllustration({ tier, state }: BoxIllustrationProps) {
  const cfg = RARITY_CONFIG[tier.rarity];
  const isShaking = state === 'shaking';
  const isCracking = state === 'cracking';
  const isRevealed = state === 'revealed';
  const color = cfg.color;
  const bg = tier.rarity === 'Common' ? '#1A1E24' : '#0C1018';

  const renderBoxBody = (xOffset = 0, isLeft = false) => (
    <g style={isCracking || isRevealed ? {
      animation: `${isLeft ? 'boxCrack' : 'boxCrackRight'} 0.5s ease-out forwards`,
      transformOrigin: '50px 65px',
    } : undefined}>
      <rect x={14 + xOffset} y={44} width={72} height={52} rx={6} fill={bg} stroke={color} strokeWidth={1.5} strokeOpacity={0.5} />
      {tier.rarity === 'Legendary' && (
        <>
          <line x1={14} y1={58} x2={86} y2={58} stroke={color} strokeWidth={0.5} strokeOpacity={0.3} />
          <line x1={14} y1={72} x2={86} y2={72} stroke={color} strokeWidth={0.5} strokeOpacity={0.3} />
          <line x1={50} y1={44} x2={50} y2={96} stroke={color} strokeWidth={0.5} strokeOpacity={0.2} />
        </>
      )}
      {tier.rarity === 'Epic' && (
        <>
          <line x1={14} y1={44} x2={50} y2={70} stroke={color} strokeWidth={0.5} strokeOpacity={0.25} />
          <line x1={86} y1={44} x2={50} y2={70} stroke={color} strokeWidth={0.5} strokeOpacity={0.25} />
          <line x1={50} y1={70} x2={50} y2={96} stroke={color} strokeWidth={0.5} strokeOpacity={0.25} />
        </>
      )}
      {(tier.rarity === 'Mythic' || tier.rarity === 'Celestial') && (
        <>
          {[48, 58, 68, 78, 88].map((y, i) => (
            <line key={i} x1={14} y1={y} x2={86} y2={y} stroke={color} strokeWidth={0.4} strokeOpacity={0.15} />
          ))}
        </>
      )}
      {tier.rarity === 'Quantum' && (
        <>
          <rect x={14} y={44} width={72} height={52} rx={6} fill="url(#qBoxGrad)" fillOpacity={0.15} />
        </>
      )}
    </g>
  );

  const renderLid = (xOffset = 0, isLeft = false) => (
    <g style={isCracking || isRevealed ? {
      animation: `${isLeft ? 'boxCrack' : 'boxCrackRight'} 0.5s ease-out forwards`,
      transformOrigin: '50px 44px',
    } : undefined}>
      <rect x={10 + xOffset} y={36} width={80} height={14} rx={5} fill={bg} stroke={color} strokeWidth={1.5} strokeOpacity={0.7} />
      <rect x={46 + xOffset} y={26} width={8} height={24} rx={3} fill={color} fillOpacity={0.7} />
      <rect x={10 + xOffset} y={42} width={80} height={4} rx={2} fill={color} fillOpacity={0.2} />
    </g>
  );

  return (
    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{
          animation: isShaking ? 'boxShake 0.7s ease-in-out' : undefined,
          filter: isRevealed
            ? `drop-shadow(0 0 ${8 + cfg.intensity * 4}px ${color})`
            : cfg.intensity >= 3
            ? `drop-shadow(0 0 ${cfg.intensity * 2}px ${color}80)`
            : undefined,
          transition: 'filter 0.4s ease',
        }}
      >
        <defs>
          <linearGradient id="qBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="33%" stopColor="#8B5CF6" />
            <stop offset="66%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <radialGradient id="boxInnerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {!isRevealed && !isCracking && (
          <>
            {renderBoxBody()}
            {renderLid()}
            {(tier.rarity === 'Rare' || tier.rarity === 'Epic' || tier.rarity === 'Legendary' || tier.rarity === 'Mythic' || tier.rarity === 'Celestial' || tier.rarity === 'Quantum') && (
              <circle cx="50" cy="70" r="14" fill="url(#boxInnerGlow)" />
            )}
            <rect x="14" y="44" width="12" height="52" rx="2" fill="white" fillOpacity="0.025" />
            <text x="50" y="88" textAnchor="middle" fontSize="7" fill={color} fillOpacity="0.6" fontWeight="700" fontFamily="Inter, sans-serif">
              {tier.rarity.toUpperCase()}
            </text>
          </>
        )}

        {(isCracking || isRevealed) && (
          <>
            <g style={{ transform: 'translateX(-22px)', opacity: isRevealed ? 1 : undefined, animation: isCracking ? 'boxCrack 0.5s ease-out forwards' : undefined }}>
              <rect x={14} y={36} width={36} height={60} rx={5} fill={bg} stroke={color} strokeWidth={1.5} strokeOpacity={0.6} />
              <rect x={14} y={36} width={12} height={60} rx={2} fill="white" fillOpacity="0.03" />
            </g>
            <g style={{ animation: isCracking ? 'boxCrackRight 0.5s ease-out forwards' : undefined, transform: isRevealed ? 'translateX(22px)' : undefined }}>
              <rect x={50} y={36} width={36} height={60} rx={5} fill={bg} stroke={color} strokeWidth={1.5} strokeOpacity={0.6} />
            </g>

            <line x1="50" y1="28" x2="50" y2="96"
              stroke={color} strokeWidth="1.5"
              style={{
                animation: 'seam 0.3s ease-out',
                boxShadow: `0 0 6px ${color}`,
                filter: `drop-shadow(0 0 4px ${color})`,
              }}
            />

            {[...Array(10)].map((_, i) => (
              <circle
                key={i}
                cx={50 + (Math.cos((i / 10) * Math.PI * 2) * 22)}
                cy={65 + (Math.sin((i / 10) * Math.PI * 2) * 22)}
                r={2.5}
                fill={color}
                style={{
                  animation: `sparkBurst 0.8s ease-out ${i * 0.06}s both`,
                  filter: `drop-shadow(0 0 3px ${color})`,
                }}
              />
            ))}
          </>
        )}
      </svg>

      {cfg.intensity >= 5 && !isRevealed && (
        <>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full pointer-events-none"
              style={{
                background: color,
                left: `${30 + Math.random() * 40}%`,
                top: `${20 + Math.random() * 40}%`,
                animation: `emberRise ${1.5 + Math.random() * 2}s ease-out ${i * 0.4}s infinite`,
                boxShadow: `0 0 4px ${color}`,
              }}
            />
          ))}
        </>
      )}

      {tier.rarity === 'Celestial' && !isRevealed && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
          style={{ opacity: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute w-full h-2 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                top: `${30 + i * 15}%`,
                animation: `auroraFlow ${3 + i * 0.5}s ease-in-out ${i * 0.8}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {tier.rarity === 'Quantum' && !isRevealed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(139,92,246,0.08) 33%, rgba(239,68,68,0.08) 66%, rgba(245,158,11,0.08) 100%)',
            animation: 'prismaticShift 2s linear infinite',
            backgroundSize: '200%',
            borderRadius: '50%',
          }}
        />
      )}
    </div>
  );
}

function BoxCard({ tier }: { tier: BoxTier }) {
  const [state, setState] = useState<BoxState>('idle');
  const [reward, setReward] = useState<{ part: string; multiplier: string } | null>(null);
  const cfg = RARITY_CONFIG[tier.rarity];

  const handleOpen = () => {
    if (state !== 'idle') return;
    setState('shaking');
    setTimeout(() => {
      setState('cracking');
      setTimeout(() => {
        const parts = ['Pulse Engine', 'Solar Wings', 'Nebula Tank', 'Astro-Gyro', 'Event-Horizon Shield'];
        setReward({
          part: parts[Math.floor(Math.random() * parts.length)],
          multiplier: `×${(1 + cfg.intensity * 0.6).toFixed(1)}`,
        });
        setState('revealed');
      }, 500);
    }, 700);
  };

  const handleReset = () => {
    setState('idle');
    setReward(null);
  };

  return (
    <div
      className="relative rounded-3xl flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: '#06080F',
        border: `1px solid ${state === 'revealed' ? cfg.color + '60' : cfg.border}`,
        boxShadow: state === 'revealed'
          ? `0 0 40px ${cfg.glow}, 0 4px 20px rgba(0,0,0,0.8)`
          : cfg.intensity >= 3
          ? `0 0 ${cfg.intensity * 5}px ${cfg.glow}, 0 1px 12px rgba(0,0,0,0.7)`
          : '0 1px 12px rgba(0,0,0,0.7)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}80, transparent)` }}
      />

      {tier.rarity === 'Quantum' && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, #06B6D4, #8B5CF6, #EF4444, #F59E0B, #22C55E, #06B6D4)',
            animation: 'prismaticShift 3s linear infinite',
            backgroundSize: '200%',
          }}
        />
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <RarityBadge tier={tier.rarity} />
            </div>
            <h3
              className="font-display font-black text-lg leading-none"
              style={{ color: '#E8ECF4', letterSpacing: '0.02em' }}
            >
              {tier.name}
            </h3>
            <p className="text-[11px] mt-1" style={{ color: '#4A5468' }}>{tier.tagline}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <PhiSymbol size={16} color={cfg.color} />
              <span
                className="font-data font-black text-xl"
                style={{ color: '#E8ECF4' }}
              >
                {tier.price.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: '#4A5468' }}>φ ENTROPY</p>
          </div>
        </div>

        <div className="flex items-center justify-center py-3 mb-4">
          <BoxIllustration tier={tier} state={state} />
        </div>

        {state === 'revealed' && reward ? (
          <div
            className="mb-4 rounded-2xl p-4 text-center"
            style={{ background: `${cfg.bg}`, border: `1px solid ${cfg.border}` }}
          >
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#4A5468' }}>YOU RECEIVED</p>
            <p className="font-display font-black text-lg" style={{ color: cfg.color }}>{reward.part}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: '#8A94A8' }}>
              Grav multiplier {reward.multiplier}
            </p>
          </div>
        ) : (
          <div className="mb-4 space-y-1.5 flex-1">
            <p className="text-[10px] font-bold mb-2" style={{ color: '#4A5468', letterSpacing: '0.08em' }}>POSSIBLE DROPS</p>
            {tier.rewards.map((r) => (
              <div key={r} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.bg}`, border: `1px solid ${cfg.border}` }}
                >
                  <div className="w-1 h-1 rounded-full" style={{ background: cfg.color }} />
                </div>
                <span className="text-[11px]" style={{ color: '#8A94A8' }}>{r}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          {tier.possible.map((p) => (
            <div
              key={p.label}
              className="rounded-xl p-2 text-center"
              style={{ background: '#0C1018', border: '1px solid #1E2636' }}
            >
              <p className="font-data font-bold text-xs" style={{ color: '#E8ECF4' }}>{p.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: '#4A5468' }}>{p.label}</p>
            </div>
          ))}
        </div>

        {state === 'revealed' ? (
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
            style={{ background: '#0C1018', border: '1px solid #2A3348', color: '#8A94A8' }}
          >
            <RotateCcw size={13} />
            Open Another
          </button>
        ) : (
          <button
            onClick={handleOpen}
            disabled={state !== 'idle'}
            className="w-full py-3 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={state === 'idle' ? {
              background: cfg.intensity >= 4
                ? `linear-gradient(135deg, ${cfg.color}cc 0%, ${cfg.color}88 100%)`
                : cfg.intensity >= 2
                ? `linear-gradient(135deg, ${cfg.color}55 0%, ${cfg.color}33 100%)`
                : '#1A1E24',
              color: cfg.intensity >= 2 ? '#E8ECF4' : cfg.color,
              border: `1px solid ${cfg.border}`,
              boxShadow: cfg.intensity >= 3 ? `0 0 20px ${cfg.glow}` : undefined,
              letterSpacing: '0.05em',
            } : {
              background: '#0C1018',
              color: '#4A5468',
              border: '1px solid #1E2636',
            }}
          >
            {state === 'idle' ? (
              <>
                <PhiSymbol size={13} color="currentColor" />
                Open Box
              </>
            ) : (
              <span className="animate-pulse">Opening…</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BoxSection() {
  const [filter, setFilter] = useState<'all' | 'common' | 'mid' | 'premium'>('all');

  const filtered = TIERS.filter((t) => {
    if (filter === 'common') return ['Common', 'Uncommon'].includes(t.rarity);
    if (filter === 'mid') return ['Rare', 'Epic', 'Legendary'].includes(t.rarity);
    if (filter === 'premium') return ['Mythic', 'Celestial', 'Quantum'].includes(t.rarity);
    return true;
  });

  return (
    <section className="mb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="tag mb-2 inline-flex">Star Vault Boxes</span>
          <h2 className="section-title">Open a Star Vault Box</h2>
          <p className="text-sm mt-2 max-w-sm" style={{ color: '#4A5468' }}>
            Spend φ to open boxes and win NFT rocket parts across 8 rarity tiers — Common through Quantum.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#4A5468' }}>
          <div className="glow-dot" />
          <span>1,337 boxes remaining</span>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'common', 'mid', 'premium'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
            style={filter === f ? {
              background: '#1E2636',
              color: '#E8ECF4',
              border: '1px solid #3A4A60',
            } : {
              background: 'transparent',
              color: '#4A5468',
              border: '1px solid #1E2636',
            }}
          >
            {f === 'all' ? 'All Tiers' : f === 'common' ? 'Common–Uncommon' : f === 'mid' ? 'Rare–Legendary' : 'Mythic–Quantum'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((tier) => (
          <BoxCard key={tier.id} tier={tier} />
        ))}
      </div>
    </section>
  );
}

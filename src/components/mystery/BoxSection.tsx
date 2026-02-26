import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import RarityBadge, { type RarityTier, RARITY_CONFIG } from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';
import { useGameState, type PartSlot, type InventoryPart } from '../../context/GameState';

interface BoxTier {
  id: string;
  name: string;
  price: number;
  rarity: RarityTier;
  tagline: string;
  rewards: string[];
  possible: { label: string; value: string }[];
}

const TIERS: BoxTier[] = [
  {
    id: 'common',
    name: 'Void Crate',
    price: 10,
    rarity: 'Common',
    tagline: 'The starting point',
    rewards: ['Common part (×1.0)', 'Rare part (×1.6)'],
    possible: [{ label: 'Best Drop', value: 'Rare' }, { label: 'Win Chance', value: '60%' }],
  },
  {
    id: 'rare',
    name: 'Star Vault Box',
    price: 50,
    rarity: 'Rare',
    tagline: 'Feels good',
    rewards: ['Rare part (×1.6)', 'Epic part (×2.0)'],
    possible: [{ label: 'Best Drop', value: 'Epic' }, { label: 'Win Chance', value: '35%' }],
  },
  {
    id: 'epic',
    name: 'Astral Chest',
    price: 150,
    rarity: 'Epic',
    tagline: 'Pulsing with energy',
    rewards: ['Epic part (×2.0)', 'Legendary part (×2.5)'],
    possible: [{ label: 'Best Drop', value: 'Legendary' }, { label: 'Win Chance', value: '18%' }],
  },
  {
    id: 'legendary',
    name: 'Solaris Vault',
    price: 300,
    rarity: 'Legendary',
    tagline: 'Shimmer of gold',
    rewards: ['Legendary part (×2.5)', 'Guaranteed high power'],
    possible: [{ label: 'Best Drop', value: 'Legendary' }, { label: 'Win Chance', value: '100%' }],
  },
];

type BoxState = 'idle' | 'opening' | 'revealed';

function BoxIllustration({ rarity, state }: { rarity: RarityTier; state: BoxState }) {
  const cfg = RARITY_CONFIG[rarity];
  const isRevealed = state === 'revealed';
  const isOpening = state === 'opening';

  return (
    <div
      className="relative w-24 h-24 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500"
      style={{
        background: cfg.bg,
        border: `2px solid ${isRevealed ? cfg.color : cfg.border}`,
        boxShadow: isRevealed ? `0 0 30px ${cfg.glow}` : cfg.intensity >= 2 ? `0 0 12px ${cfg.glow}` : undefined,
        transform: isOpening ? 'scale(1.08)' : isRevealed ? 'scale(1.12)' : 'scale(1)',
      }}
    >
      <PhiSymbol size={36} color={isRevealed ? cfg.color : cfg.color + '66'} />
      {isRevealed && (
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ background: `radial-gradient(circle, ${cfg.color}20 0%, transparent 70%)` }}
        />
      )}
    </div>
  );
}

const PART_NAMES: Record<PartSlot, string> = {
  engine: 'Pulse Engine',
  fuel: 'Nebula Tank',
  body: 'Radiation Mantle',
  wings: 'Solar Wings',
  booster: 'Ion Array',
};

const SLOTS: PartSlot[] = ['engine', 'fuel', 'body', 'wings', 'booster'];

// Higher tier boxes have better odds of dropping higher rarities
const DROP_TABLES: Record<string, RarityTier[]> = {
  common:    ['Common', 'Common', 'Common', 'Rare'],
  rare:      ['Common', 'Rare', 'Rare', 'Epic'],
  epic:      ['Rare', 'Epic', 'Epic', 'Legendary'],
  legendary: ['Epic', 'Legendary', 'Legendary', 'Legendary'],
};

function randomPart(tierId: string): InventoryPart {
  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const table = DROP_TABLES[tierId] ?? DROP_TABLES.common;
  const rarity = table[Math.floor(Math.random() * table.length)];
  const cfg = RARITY_CONFIG[rarity];
  return {
    id: `${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: PART_NAMES[slot],
    slot,
    rarity,
    power: 40 + cfg.intensity * 15 + Math.floor(Math.random() * 20),
  };
}

function BoxCard({ tier }: { tier: BoxTier }) {
  const game = useGameState();
  const [state, setState] = useState<BoxState>('idle');
  const [reward, setReward] = useState<{ part: InventoryPart; multiplier: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cfg = RARITY_CONFIG[tier.rarity];

  const handleOpen = () => {
    if (state !== 'idle') return;
    setError(null);
    if (!game.spendFlux(tier.price)) {
      setError('Insufficient Flux');
      return;
    }
    setState('opening');
    setTimeout(() => {
      const part = randomPart(tier.id);
      game.addPart(part);
      setReward({
        part,
        multiplier: `×${(1 + RARITY_CONFIG[part.rarity].intensity * 0.6).toFixed(1)}`,
      });
      setState('revealed');
    }, 800);
  };

  const handleReset = () => {
    setState('idle');
    setReward(null);
    setError(null);
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

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <RarityBadge tier={tier.rarity} />
            </div>
            <h3 className="font-display font-black text-lg leading-none" style={{ color: '#E8ECF4', letterSpacing: '0.02em' }}>
              {tier.name}
            </h3>
            <p className="text-[11px] mt-1" style={{ color: '#4A5468' }}>{tier.tagline}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <PhiSymbol size={16} color={cfg.color} />
              <span className="font-data font-black text-xl" style={{ color: '#E8ECF4' }}>
                {tier.price.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: '#4A5468' }}>FLUX</p>
          </div>
        </div>

        <div className="flex items-center justify-center py-3 mb-4">
          <BoxIllustration rarity={tier.rarity} state={state} />
        </div>

        {state === 'revealed' && reward ? (
          <div
            className="mb-4 rounded-2xl p-4 text-center"
            style={{ background: RARITY_CONFIG[reward.part.rarity].bg, border: `1px solid ${RARITY_CONFIG[reward.part.rarity].border}` }}
          >
            <p className="text-[10px] font-semibold mb-1.5" style={{ color: '#4A5468' }}>YOU RECEIVED</p>
            <p className="font-display font-black text-lg" style={{ color: RARITY_CONFIG[reward.part.rarity].color }}>{reward.part.name}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <RarityBadge tier={reward.part.rarity} size="xs" />
              <span className="text-xs font-medium" style={{ color: '#8A94A8' }}>PWR {reward.part.power}</span>
            </div>
          </div>
        ) : (
          <div className="mb-4 space-y-1.5 flex-1">
            <p className="text-[10px] font-bold mb-2" style={{ color: '#4A5468', letterSpacing: '0.08em' }}>POSSIBLE DROPS</p>
            {tier.rewards.map((r) => (
              <div key={r} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
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
            <div key={p.label} className="rounded-xl p-2 text-center" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
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
              <span className="animate-pulse">Opening...</span>
            )}
          </button>
        )}
        {error && (
          <p className="text-center text-xs mt-2 font-semibold" style={{ color: '#EF4444' }}>{error}</p>
        )}
      </div>
    </div>
  );
}

export default function BoxSection() {
  return (
    <section className="mb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="tag mb-2 inline-flex">Star Vault Boxes</span>
          <h2 className="section-title">Open a Star Vault Box</h2>
          <p className="text-sm mt-2 max-w-sm" style={{ color: '#4A5468' }}>
            Spend Flux to open boxes and win rocket parts across 4 rarity tiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIERS.map((tier) => (
          <BoxCard key={tier.id} tier={tier} />
        ))}
      </div>
    </section>
  );
}

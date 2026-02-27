import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import RarityBadge, { type RarityTier, RARITY_CONFIG } from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';
import { useGameState } from '../../context/GameState';
import { RARITY_BOX_PRICE_FLUX, RARITY_MULTIPLIER } from '../../config/spec';
import { ROCKET_SECTIONS, type InventoryPart, type RocketSection } from '../../types/domain';

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
    price: RARITY_BOX_PRICE_FLUX.Common,
    rarity: 'Common',
    tagline: 'The starting point',
    rewards: ['Common part (×1.0)', 'Uncommon part (×1.25)', 'Rare chance'],
    possible: [{ label: 'Best Drop', value: 'Rare' }, { label: 'Win Chance', value: '~18%' }],
  },
  {
    id: 'uncommon',
    name: 'Stellar Cache',
    price: RARITY_BOX_PRICE_FLUX.Uncommon,
    rarity: 'Uncommon',
    tagline: 'Better odds, better loot',
    rewards: ['Uncommon part (×1.25)', 'Rare chance', 'Epic chance'],
    possible: [{ label: 'Best Drop', value: 'Epic' }, { label: 'Win Chance', value: '~10%' }],
  },
  {
    id: 'rare',
    name: 'Star Vault Box',
    price: RARITY_BOX_PRICE_FLUX.Rare,
    rarity: 'Rare',
    tagline: 'Rarity starts here',
    rewards: ['Rare part (×1.6)', 'Epic chance', 'Legendary chance'],
    possible: [{ label: 'Best Drop', value: 'Legendary' }, { label: 'Win Chance', value: '~6%' }],
  },
  {
    id: 'epic',
    name: 'Astral Chest',
    price: RARITY_BOX_PRICE_FLUX.Epic,
    rarity: 'Epic',
    tagline: 'Pulsing with energy',
    rewards: ['Epic part (×2.0)', 'Legendary chance', 'Mythic chance'],
    possible: [{ label: 'Best Drop', value: 'Mythic' }, { label: 'Win Chance', value: '~3.5%' }],
  },
  {
    id: 'legendary',
    name: 'Solaris Vault',
    price: RARITY_BOX_PRICE_FLUX.Legendary,
    rarity: 'Legendary',
    tagline: 'Shimmer of gold',
    rewards: ['Legendary part (×2.5)', 'Mythic chance', 'Celestial chance'],
    possible: [{ label: 'Best Drop', value: 'Celestial' }, { label: 'Win Chance', value: '~1.8%' }],
  },
  {
    id: 'mythic',
    name: 'Nova Reliquary',
    price: RARITY_BOX_PRICE_FLUX.Mythic,
    rarity: 'Mythic',
    tagline: 'Heat at the edge of chaos',
    rewards: ['Mythic part (×3.2)', 'Celestial chance', 'Quantum chance'],
    possible: [{ label: 'Best Drop', value: 'Quantum' }, { label: 'Win Chance', value: '~0.7%' }],
  },
  {
    id: 'celestial',
    name: 'Aurora Ark',
    price: RARITY_BOX_PRICE_FLUX.Celestial,
    rarity: 'Celestial',
    tagline: 'Blue-fire premium crate',
    rewards: ['Celestial part (×4.0)', 'High quantum chance'],
    possible: [{ label: 'Best Drop', value: 'Quantum' }, { label: 'Win Chance', value: '~12%' }],
  },
  {
    id: 'quantum',
    name: 'Prism Singularity',
    price: RARITY_BOX_PRICE_FLUX.Quantum,
    rarity: 'Quantum',
    tagline: 'Top-tier reality split',
    rewards: ['Quantum part (×5.0)', 'Celestial fallback'],
    possible: [{ label: 'Best Drop', value: 'Quantum' }, { label: 'Win Chance', value: '~75%' }],
  },
];

type BoxState = 'idle' | 'opening' | 'revealed';

function BoxIllustration({ rarity, state }: { rarity: RarityTier; state: BoxState }) {
  const cfg = RARITY_CONFIG[rarity];
  const isRevealed = state === 'revealed';
  const isOpening = state === 'opening';

  return (
    <div
      className="relative w-24 h-24 mx-auto flex items-center justify-center transition-all duration-500"
      style={{
        background: cfg.bg,
        border: `2px solid ${isRevealed ? cfg.color : cfg.border}`,
        transform: isOpening ? 'scale(1.08)' : isRevealed ? 'scale(1.12)' : 'scale(1)',
      }}
    >
      <PhiSymbol size={36} color={isRevealed ? cfg.color : cfg.color + '66'} />
      {isRevealed && (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle, ${cfg.color}20 0%, transparent 70%)` }}
        />
      )}
    </div>
  );
}

const PART_NAMES: Record<RocketSection, string> = {
  coreEngine: 'Pulse Engine',
  wingPlate: 'Solar Wings',
  fuelCell: 'Nebula Tank',
  navigationModule: 'Astro-Gyro',
  payloadBay: 'Cargo Nebula',
  thrusterArray: 'Ion Array',
  propulsionCables: 'Quantum Wire',
  shielding: 'Event-Horizon Shield',
};

const SLOTS: RocketSection[] = [...ROCKET_SECTIONS];

// Higher tier boxes have better odds of dropping higher rarities
const DROP_TABLES: Record<string, RarityTier[]> = {
  common:    ['Common', 'Common', 'Uncommon', 'Uncommon', 'Rare'],
  uncommon:  ['Common', 'Uncommon', 'Uncommon', 'Rare', 'Rare', 'Epic'],
  rare:      ['Uncommon', 'Rare', 'Rare', 'Epic', 'Epic', 'Legendary'],
  epic:      ['Rare', 'Epic', 'Epic', 'Legendary', 'Legendary', 'Mythic'],
  legendary: ['Epic', 'Legendary', 'Legendary', 'Mythic', 'Mythic', 'Celestial'],
  mythic:    ['Legendary', 'Mythic', 'Mythic', 'Celestial', 'Celestial', 'Quantum'],
  celestial: ['Mythic', 'Celestial', 'Celestial', 'Quantum', 'Quantum'],
  quantum:   ['Celestial', 'Quantum', 'Quantum', 'Quantum'],
};

function formatMultiplier(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

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
        multiplier: `×${formatMultiplier(RARITY_MULTIPLIER[part.rarity])}`,
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
      className="relative flex flex-col overflow-hidden transition-all duration-300"
      style={{
        background: '#06080F',
        border: `1px solid ${state === 'revealed' ? cfg.color + '60' : cfg.border}`,
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
            <h3 className="font-mono font-black text-lg leading-none uppercase tracking-wider" style={{ color: '#E8ECF4' }}>
              {tier.name}
            </h3>
            <p className="text-[11px] mt-1 font-mono" style={{ color: '#4A5468' }}>{tier.tagline}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <PhiSymbol size={16} color={cfg.color} />
              <span className="font-mono font-black text-xl" style={{ color: '#E8ECF4' }}>
                {tier.price.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] font-mono font-medium mt-0.5 uppercase" style={{ color: '#4A5468' }}>FLUX</p>
          </div>
        </div>

        <div className="flex items-center justify-center py-3 mb-4">
          <BoxIllustration rarity={tier.rarity} state={state} />
        </div>

        {state === 'revealed' && reward ? (
          <div
            className="mb-4 p-4 text-center"
            style={{ background: RARITY_CONFIG[reward.part.rarity].bg, border: `1px solid ${RARITY_CONFIG[reward.part.rarity].border}` }}
          >
            <p className="text-[10px] font-mono font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#4A5468' }}>YOU RECEIVED</p>
            <p className="font-mono font-black text-lg uppercase" style={{ color: RARITY_CONFIG[reward.part.rarity].color }}>{reward.part.name}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <RarityBadge tier={reward.part.rarity} size="xs" />
              <span className="text-xs font-mono font-medium" style={{ color: '#8A94A8' }}>PWR {reward.part.power}</span>
            </div>
          </div>
        ) : (
          <div className="mb-4 space-y-1.5 flex-1">
            <p className="text-[10px] font-mono font-bold mb-2 uppercase tracking-widest" style={{ color: '#4A5468' }}>POSSIBLE DROPS</p>
            {tier.rewards.map((r) => (
              <div key={r} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                >
                  <div className="w-1 h-1" style={{ background: cfg.color }} />
                </div>
                <span className="text-[11px] font-mono" style={{ color: '#8A94A8' }}>{r}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          {tier.possible.map((p) => (
            <div key={p.label} className="p-2 text-center" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
              <p className="font-mono font-bold text-xs" style={{ color: '#E8ECF4' }}>{p.value}</p>
              <p className="text-[9px] font-mono mt-0.5 uppercase" style={{ color: '#4A5468' }}>{p.label}</p>
            </div>
          ))}
        </div>

        {state === 'revealed' ? (
          <button
            onClick={handleReset}
            className="w-full py-3 font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 uppercase tracking-wider"
            style={{ background: '#0C1018', border: '1px solid #2A3348', color: '#8A94A8' }}
          >
            <RotateCcw size={13} />
            Open Another
          </button>
        ) : (
          <button
            onClick={handleOpen}
            disabled={state !== 'idle'}
            className="w-full py-3 font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            style={state === 'idle' ? {
              background: 'transparent',
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
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
          <p className="text-center text-xs mt-2 font-mono font-semibold" style={{ color: '#EF4444' }}>{error}</p>
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
          <p className="text-sm mt-2 max-w-sm font-mono" style={{ color: '#4A5468' }}>
            Spend Flux to open boxes and win rocket parts across all 8 rarity tiers.
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

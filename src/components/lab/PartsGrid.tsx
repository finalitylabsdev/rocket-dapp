import { ArrowUp, CheckCircle2, Zap } from 'lucide-react';
import RarityBadge, { type RarityTier, RARITY_CONFIG } from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';

export interface EquippedParts {
  engine: boolean;
  fuel: boolean;
  body: boolean;
  wings: boolean;
  booster: boolean;
}

export type EquippedPartId = keyof EquippedParts;

interface Part {
  id: EquippedPartId;
  name: string;
  label: string;
  rarity: RarityTier;
  power: number;
  upgradeCost: number;
  maxLevel: number;
  description: string;
}

interface PartsGridProps {
  equipped: EquippedParts;
  levels: Record<EquippedPartId, number>;
  onToggle: (id: EquippedPartId) => void;
  onUpgrade: (id: EquippedPartId) => void;
}

const PARTS: Part[] = [
  {
    id: 'engine',
    name: 'Pulse Engine',
    label: 'Core Engine',
    rarity: 'Legendary',
    power: 92,
    upgradeCost: 120,
    maxLevel: 3,
    description: 'Rhythmic energy rings from a central core.',
  },
  {
    id: 'fuel',
    name: 'Nebula Tank',
    label: 'Fuel Cells',
    rarity: 'Rare',
    power: 74,
    upgradeCost: 80,
    maxLevel: 3,
    description: 'Swirling nebula-coloured fluid within.',
  },
  {
    id: 'body',
    name: 'Radiation Mantle',
    label: 'Shielding',
    rarity: 'Common',
    power: 68,
    upgradeCost: 40,
    maxLevel: 3,
    description: 'Layered, cape-like protective panels.',
  },
  {
    id: 'wings',
    name: 'Solar Wings',
    label: 'Wing-Plates',
    rarity: 'Epic',
    power: 55,
    upgradeCost: 95,
    maxLevel: 3,
    description: 'Wide panels with embedded solar cells.',
  },
  {
    id: 'booster',
    name: 'Ion Array',
    label: 'Thruster Array',
    rarity: 'Rare',
    power: 88,
    upgradeCost: 60,
    maxLevel: 3,
    description: 'Grid of ion emitters, uniform glow.',
  },
];

export const PART_UPGRADE_COSTS: Record<EquippedPartId, number> = PARTS.reduce(
  (costs, part) => ({
    ...costs,
    [part.id]: part.upgradeCost,
  }),
  {
    engine: 0,
    fuel: 0,
    body: 0,
    wings: 0,
    booster: 0,
  } as Record<EquippedPartId, number>,
);

function PartCard({ part, equipped, level, onToggle, onUpgrade }: {
  part: Part;
  equipped: boolean;
  level: number;
  onToggle: () => void;
  onUpgrade: () => void;
}) {
  const cfg = RARITY_CONFIG[part.rarity];
  const effectivePower = part.power + (level - 1) * 8;
  const levelProgress = (level / part.maxLevel) * 100;

  return (
    <div
      className="relative overflow-hidden cursor-pointer select-none transition-all duration-200"
      style={equipped ? {
        background: '#0A0F1A',
        border: `1px solid ${cfg.color}`,
      } : {
        background: '#06080F',
        border: '1px solid #1E2636',
      }}
      onClick={onToggle}
    >
      {equipped && (
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
        />
      )}

      <div className="p-3">
        <div className="relative mb-3">
          <div
            className="w-full aspect-square overflow-hidden flex items-center justify-center"
            style={{
              background: '#06080F',
              border: `1px solid ${equipped ? cfg.border : '#1E2636'}`,
            }}
          >
            <Zap size={32} style={{ color: equipped ? cfg.color : '#2A3348' }} />
          </div>
          {equipped && (
            <div className="absolute top-2 right-2">
              <CheckCircle2 size={14} style={{ color: '#4ADE80' }} />
            </div>
          )}
          <div className="absolute bottom-2 left-2">
            <RarityBadge tier={part.rarity} size="xs" showIcon={false} />
          </div>
        </div>

        <p
          className="font-mono font-bold text-sm mb-0.5 leading-tight uppercase tracking-wider"
          style={{ color: '#E8ECF4' }}
        >
          {part.name}
        </p>
        <p className="text-[10px] mb-2 leading-snug font-mono" style={{ color: '#4A5468' }}>
          {part.description}
        </p>

        <div className="flex items-center gap-1 mb-2">
          <Zap size={9} style={{ color: '#4A5468' }} />
          <span className="font-mono font-bold text-xs" style={{ color: '#8A94A8' }}>{effectivePower}</span>
          <span className="text-[9px] font-mono" style={{ color: '#4A5468' }}>PWR</span>
          <span className="text-[9px] font-mono ml-auto uppercase" style={{ color: '#4A5468' }}>{part.label}</span>
        </div>

        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-mono uppercase" style={{ color: '#4A5468' }}>Level</span>
            <span className="font-mono text-[9px]" style={{ color: '#4A5468' }}>
              Lv.{level}/{part.maxLevel}
            </span>
          </div>
          <div className="h-1 overflow-hidden" style={{ background: '#1E2636' }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${levelProgress}%`,
                background: cfg.color,
              }}
            />
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
          disabled={level >= part.maxLevel}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-mono font-bold transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider"
          style={level < part.maxLevel ? {
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
          } : {
            background: '#06080F',
            color: '#4A5468',
            border: '1px solid #1E2636',
          }}
        >
          {level >= part.maxLevel ? (
            'MAX LEVEL'
          ) : (
            <>
              <ArrowUp size={10} />
              <PhiSymbol size={9} color="currentColor" />
              {part.upgradeCost}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function PartsGrid({ equipped, levels, onToggle, onUpgrade }: PartsGridProps) {
  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const totalParts = Object.keys(equipped).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p
            className="font-mono font-bold text-base uppercase tracking-wider"
            style={{ color: '#E8ECF4' }}
          >
            Parts Inventory
          </p>
          <p className="text-xs mt-0.5 font-mono" style={{ color: '#4A5468' }}>
            {equippedCount}/{totalParts} equipped · Click to toggle
          </p>
        </div>
        <span className="tag text-[10px]">Season 1</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {PARTS.map((part) => (
          <PartCard
            key={part.id}
            part={part}
            equipped={equipped[part.id]}
            level={levels[part.id]}
            onToggle={() => onToggle(part.id)}
            onUpgrade={() => onUpgrade(part.id)}
          />
        ))}
      </div>
    </div>
  );
}

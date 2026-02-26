import { ArrowUp, CheckCircle2, Zap } from 'lucide-react';
import RarityBadge, { type RarityTier, RARITY_CONFIG } from '../brand/RarityBadge';
import { type RocketSection, SECTION_META } from '../brand/SectionIcon';
import PhiSymbol from '../brand/PhiSymbol';
import PartIllustration, { type PartId } from './PartIllustrations';

export interface EquippedParts {
  engine: boolean;
  fuel: boolean;
  body: boolean;
  wings: boolean;
  booster: boolean;
  noseCone: boolean;
  heatShield: boolean;
  gyroscope: boolean;
  solarPanels: boolean;
  landingStruts: boolean;
}

interface Part {
  id: keyof EquippedParts;
  name: string;
  section: RocketSection;
  rarity: RarityTier;
  power: number;
  upgradeCost: number;
  maxLevel: number;
  description: string;
}

interface PartsGridProps {
  equipped: EquippedParts;
  levels: Record<keyof EquippedParts, number>;
  onToggle: (id: keyof EquippedParts) => void;
  onUpgrade: (id: keyof EquippedParts) => void;
}

const PARTS: Part[] = [
  {
    id: 'engine',
    name: 'Pulse Engine',
    section: 'core-engine',
    rarity: 'Legendary',
    power: 92,
    upgradeCost: 120,
    maxLevel: 5,
    description: 'Rhythmic energy rings from a central core.',
  },
  {
    id: 'fuel',
    name: 'Nebula Tank',
    section: 'fuel-cells',
    rarity: 'Rare',
    power: 74,
    upgradeCost: 80,
    maxLevel: 5,
    description: 'Swirling nebula-coloured fluid within.',
  },
  {
    id: 'body',
    name: 'Radiation Mantle',
    section: 'shielding',
    rarity: 'Common',
    power: 68,
    upgradeCost: 40,
    maxLevel: 5,
    description: 'Layered, cape-like protective panels.',
  },
  {
    id: 'wings',
    name: 'Solar Wings',
    section: 'wing-plates',
    rarity: 'Epic',
    power: 55,
    upgradeCost: 95,
    maxLevel: 5,
    description: 'Wide panels with embedded solar cells.',
  },
  {
    id: 'booster',
    name: 'Ion Array',
    section: 'thruster-array',
    rarity: 'Rare',
    power: 88,
    upgradeCost: 60,
    maxLevel: 5,
    description: 'Grid of ion emitters, uniform glow.',
  },
  {
    id: 'noseCone',
    name: 'Nova Thruster',
    section: 'core-engine',
    rarity: 'Rare',
    power: 62,
    upgradeCost: 70,
    maxLevel: 5,
    description: 'Starburst exhaust, wider nozzle.',
  },
  {
    id: 'heatShield',
    name: 'Impact Field',
    section: 'shielding',
    rarity: 'Epic',
    power: 79,
    upgradeCost: 110,
    maxLevel: 5,
    description: 'Hard tessellated hexagonal barrier.',
  },
  {
    id: 'gyroscope',
    name: 'Astro-Gyro',
    section: 'navigation',
    rarity: 'Common',
    power: 58,
    upgradeCost: 35,
    maxLevel: 5,
    description: 'Spinning gyroscopic attitude rings.',
  },
  {
    id: 'solarPanels',
    name: 'Photon Sails',
    section: 'wing-plates',
    rarity: 'Mythic',
    power: 45,
    upgradeCost: 200,
    maxLevel: 5,
    description: 'Large billowing sail shapes, catching light.',
  },
  {
    id: 'landingStruts',
    name: 'Star-Fiber',
    section: 'propulsion-cables',
    rarity: 'Common',
    power: 50,
    upgradeCost: 30,
    maxLevel: 5,
    description: 'Glowing fibre-optic bundle, warm light.',
  },
];

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
      className="relative rounded-3xl overflow-hidden cursor-pointer select-none transition-all duration-200"
      style={equipped ? {
        background: '#0A0F1A',
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 0 20px ${cfg.glow}, 0 2px 8px rgba(0,0,0,0.8)`,
        transform: 'translateY(-2px)',
      } : {
        background: '#06080F',
        border: '1px solid #1E2636',
        boxShadow: '0 1px 6px rgba(0,0,0,0.6)',
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
            className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
            style={{
              background: '#06080F',
              border: `1px solid ${equipped ? cfg.border : '#1E2636'}`,
              boxShadow: equipped && cfg.intensity >= 2 ? `inset 0 0 16px ${cfg.glow}` : undefined,
            }}
          >
            <PartIllustration
              id={part.id as PartId}
              equipped={equipped}
              rarity={part.rarity}
              size={72}
            />
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
          className="font-display font-bold text-sm mb-0.5 leading-tight"
          style={{ color: '#E8ECF4', letterSpacing: '0.02em' }}
        >
          {part.name}
        </p>
        <p className="text-[10px] mb-2 leading-snug" style={{ color: '#4A5468' }}>
          {part.description}
        </p>

        <div className="flex items-center gap-1 mb-2">
          <Zap size={9} style={{ color: '#4A5468' }} />
          <span className="font-data font-bold text-xs" style={{ color: '#8A94A8' }}>{effectivePower}</span>
          <span className="text-[9px]" style={{ color: '#4A5468' }}>PWR</span>
          <span className="text-[9px] ml-auto" style={{ color: '#4A5468' }}>{SECTION_META[part.section].label}</span>
        </div>

        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px]" style={{ color: '#4A5468' }}>Level</span>
            <span className="font-data text-[9px]" style={{ color: '#4A5468' }}>
              Lv.{level}/{part.maxLevel}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1E2636' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${levelProgress}%`,
                background: `linear-gradient(90deg, ${cfg.color}55, ${cfg.color})`,
                boxShadow: equipped && cfg.intensity >= 2 ? `0 0 4px ${cfg.color}80` : undefined,
              }}
            />
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onUpgrade(); }}
          disabled={level >= part.maxLevel}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
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
            className="font-display font-bold text-base"
            style={{ color: '#E8ECF4', letterSpacing: '0.04em' }}
          >
            Parts Inventory
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#4A5468' }}>
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

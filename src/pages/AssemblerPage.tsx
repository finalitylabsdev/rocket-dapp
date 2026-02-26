import { useState } from 'react';
import { ArrowLeft, Layers, Box, Rocket, Cpu, ChevronRight, Star, Zap } from 'lucide-react';
import FloatingParticles from '../components/mystery/FloatingParticles';
import { CommonBox, RareBox, LegendaryBox, QuantumBox } from '../components/assets/MysteryBoxAssets';
import { RocketBaseFrame, RocketCore, FuelTank, StabilizerWings } from '../components/assets/RocketPartAssets';
import { AuctionPodium, LaunchPlatform, TrophyAsset } from '../components/assets/FeatureModuleAssets';
import RarityBadge from '../components/brand/RarityBadge';

interface AssemblerPageProps {
  onBack: () => void;
}

type Category = 'all' | 'boxes' | 'rocket' | 'modules';

interface AssetDef {
  id: string;
  name: string;
  category: Exclude<Category, 'all'>;
  rarity?: 'Common' | 'Rare' | 'Legendary' | 'Quantum';
  description: string;
  tag: string;
  Component: React.ComponentType<{ size?: number; animated?: boolean }>;
}

const ASSETS: AssetDef[] = [
  {
    id: 'box-common',
    name: 'Void Crate',
    category: 'boxes',
    rarity: 'Common',
    description: 'Dark brushed metal with minimal seam lines and faint gold accent glow along edges.',
    tag: 'Mystery Box',
    Component: CommonBox,
  },
  {
    id: 'box-rare',
    name: 'Star Vault Box',
    category: 'boxes',
    rarity: 'Rare',
    description: 'Polished gold edge trims with visible internal golden light leaking softly through seams.',
    tag: 'Mystery Box',
    Component: RareBox,
  },
  {
    id: 'box-legendary',
    name: 'Solaris Vault',
    category: 'boxes',
    rarity: 'Legendary',
    description: 'Dark titanium with rich gold inlays, radiant energy core, soft luminous aura around edges.',
    tag: 'Mystery Box',
    Component: LegendaryBox,
  },
  {
    id: 'box-quantum',
    name: 'Quantum Chest',
    category: 'boxes',
    rarity: 'Quantum',
    description: 'Obsidian cube with prismatic edge structure, chromatic light shift, faint distortion glow.',
    tag: 'Mystery Box',
    Component: QuantumBox,
  },
  {
    id: 'rocket-frame',
    name: 'Base Frame',
    category: 'rocket',
    description: 'Modular rocket body frame with brushed aluminum structure and mechanical panel detailing.',
    tag: 'Rocket System',
    Component: RocketBaseFrame,
  },
  {
    id: 'rocket-core',
    name: 'Legendary Core',
    category: 'rocket',
    rarity: 'Legendary',
    description: 'Titanium housing with gold micro inlays, bright orange internal energy core visible through vents.',
    tag: 'Rocket System',
    Component: RocketCore,
  },
  {
    id: 'rocket-fuel',
    name: 'Fuel Tank Module',
    category: 'rocket',
    description: 'Cylindrical tank with reinforced metal casing, glowing fuel indicator strip running vertically.',
    tag: 'Rocket System',
    Component: FuelTank,
  },
  {
    id: 'rocket-wings',
    name: 'Stabilizer Wings',
    category: 'rocket',
    description: 'Aerodynamic stabilizer fins with sharp precision edges and subtle accent illumination at joints.',
    tag: 'Rocket System',
    Component: StabilizerWings,
  },
  {
    id: 'module-auction',
    name: 'Auction Podium',
    category: 'modules',
    description: 'Elevated circular platform with glowing ring embedded around outer edge, energy shimmer above.',
    tag: 'Feature Module',
    Component: AuctionPodium,
  },
  {
    id: 'module-launch',
    name: 'Launch Platform',
    category: 'modules',
    description: 'Large circular launch pad with embedded orange runway lights, subtle smoke near base.',
    tag: 'Feature Module',
    Component: LaunchPlatform,
  },
  {
    id: 'module-trophy',
    name: 'Season Trophy',
    category: 'modules',
    description: 'Premium sculptural trophy, brushed gold alloy structure with luminous edge highlights.',
    tag: 'Feature Module',
    Component: TrophyAsset,
  },
];

const CATEGORY_TABS: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Assets', icon: <Layers size={14} /> },
  { id: 'boxes', label: 'Mystery Boxes', icon: <Box size={14} /> },
  { id: 'rocket', label: 'Rocket System', icon: <Rocket size={14} /> },
  { id: 'modules', label: 'Feature Modules', icon: <Cpu size={14} /> },
];

function AssetCard({ asset }: { asset: AssetDef }) {
  const [hovered, setHovered] = useState(false);

  const borderColor = asset.rarity === 'Quantum'
    ? 'rgba(232,236,244,0.18)'
    : asset.rarity === 'Legendary'
    ? 'rgba(245,158,11,0.3)'
    : asset.rarity === 'Rare'
    ? 'rgba(59,130,246,0.25)'
    : 'rgba(255,255,255,0.06)';

  const glowColor = asset.rarity === 'Quantum'
    ? 'rgba(168,85,247,0.12)'
    : asset.rarity === 'Legendary'
    ? 'rgba(245,158,11,0.1)'
    : asset.rarity === 'Rare'
    ? 'rgba(59,130,246,0.08)'
    : 'transparent';

  const tagColor = asset.category === 'boxes'
    ? '#3B82F6'
    : asset.category === 'rocket'
    ? '#F59E0B'
    : '#22C55E';

  return (
    <div
      className="relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-400 group"
      style={{
        background: hovered ? '#0C1018' : '#080C14',
        border: `1px solid ${hovered ? (asset.rarity === 'Quantum' ? 'rgba(168,85,247,0.4)' : borderColor.replace(/[\d.]+\)$/, '0.45)')) : borderColor}`,
        boxShadow: hovered
          ? `0 0 48px ${glowColor.replace(/[\d.]+\)$/, '0.22)')}, 0 8px 32px rgba(0,0,0,0.8)`
          : `0 0 20px ${glowColor}, 0 2px 12px rgba(0,0,0,0.7)`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.23,1,0.32,1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: asset.rarity === 'Quantum'
            ? 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), rgba(6,182,212,0.6), transparent)'
            : asset.rarity === 'Legendary'
            ? 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)'
            : asset.rarity === 'Rare'
            ? 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        }}
      />

      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.03) 0%, transparent 70%)',
          height: '220px',
        }}
      >
        <div
          style={{
            transform: hovered ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
            transition: 'transform 0.5s cubic-bezier(0.23,1,0.32,1)',
            filter: hovered ? `drop-shadow(0 12px 28px ${glowColor.replace(/[\d.]+\)$/, '0.35)')})` : undefined,
          }}
        >
          <asset.Component size={160} animated />
        </div>

        {asset.rarity === 'Quantum' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.04) 0%, rgba(168,85,247,0.04) 33%, rgba(239,68,68,0.03) 66%, rgba(245,158,11,0.04) 100%)',
              opacity: hovered ? 1 : 0.5,
              transition: 'opacity 0.3s ease',
            }}
          />
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  color: tagColor,
                  background: `${tagColor}14`,
                  border: `1px solid ${tagColor}30`,
                  letterSpacing: '0.1em',
                }}
              >
                {asset.tag.toUpperCase()}
              </span>
              {asset.rarity && <RarityBadge tier={asset.rarity} size="xs" />}
            </div>
            <h3
              className="font-display font-black text-base leading-tight"
              style={{ color: '#E8ECF4', letterSpacing: '0.02em' }}
            >
              {asset.name}
            </h3>
          </div>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
            style={{
              background: hovered ? `${tagColor}18` : '#0C1018',
              border: `1px solid ${hovered ? `${tagColor}40` : '#1E2636'}`,
            }}
          >
            <ChevronRight size={14} style={{ color: hovered ? tagColor : '#4A5468' }} />
          </div>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: '#4A5468', lineHeight: '1.6' }}>
          {asset.description}
        </p>
      </div>
    </div>
  );
}

function FeaturedShowcase() {
  const [active, setActive] = useState(0);
  const featured = [ASSETS[3], ASSETS[5], ASSETS[10]];
  const current = featured[active];

  return (
    <div
      className="rounded-3xl overflow-hidden mb-16"
      style={{ background: '#080C14', border: '1px solid #1E2636' }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div
          className="relative flex items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 70%)',
            minHeight: '360px',
            borderRight: '1px solid #1E2636',
          }}
        >
          <div
            style={{
              filter: 'drop-shadow(0 20px 60px rgba(168,85,247,0.2))',
              transition: 'all 0.4s ease',
            }}
          >
            <current.Component size={240} animated />
          </div>

          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: active === i ? '24px' : '8px',
                  height: '8px',
                  background: active === i ? '#A855F7' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        </div>

        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(168,85,247,0.12)',
                border: '1px solid rgba(168,85,247,0.3)',
                color: '#A855F7',
                letterSpacing: '0.1em',
              }}
            >
              FEATURED ASSET
            </span>
            {current.rarity && <RarityBadge tier={current.rarity} />}
          </div>

          <h2
            className="font-display font-black text-3xl lg:text-4xl mb-3 leading-tight"
            style={{ color: '#E8ECF4', letterSpacing: '0.02em' }}
          >
            {current.name}
          </h2>

          <p className="text-base mb-6" style={{ color: '#6A7A98', lineHeight: '1.7' }}>
            {current.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Category', value: current.tag },
              { label: 'Rarity', value: current.rarity ?? 'Standard' },
              { label: 'Supply', value: current.rarity === 'Quantum' ? '77' : current.rarity === 'Legendary' ? '420' : '∞' },
              { label: 'Format', value: 'NFT · SVG' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-3"
                style={{ background: '#0C1018', border: '1px solid #1E2636' }}
              >
                <p className="text-[10px] font-bold mb-0.5" style={{ color: '#4A5468', letterSpacing: '0.08em' }}>
                  {stat.label.toUpperCase()}
                </p>
                <p className="text-sm font-bold" style={{ color: '#C0C8D4' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-2xl font-display font-bold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.7) 0%, rgba(168,85,247,0.5) 100%)',
                color: '#F0E8FF',
                border: '1px solid rgba(168,85,247,0.4)',
                boxShadow: '0 0 24px rgba(168,85,247,0.2)',
                letterSpacing: '0.05em',
              }}
            >
              <Zap size={13} />
              Acquire Asset
            </button>
            <button
              className="px-5 py-3 rounded-2xl font-display font-bold text-sm transition-all duration-200 active:scale-95"
              style={{
                background: '#0C1018',
                color: '#8A94A8',
                border: '1px solid #1E2636',
              }}
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssemblerPage({ onBack }: AssemblerPageProps) {
  const [category, setCategory] = useState<Category>('all');

  const filtered = category === 'all' ? ASSETS : ASSETS.filter((a) => a.category === category);

  const counts = {
    all: ASSETS.length,
    boxes: ASSETS.filter((a) => a.category === 'boxes').length,
    rocket: ASSETS.filter((a) => a.category === 'rocket').length,
    modules: ASSETS.filter((a) => a.category === 'modules').length,
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#06080F' }}>
      <FloatingParticles />

      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(6,8,15,0.92)', backdropFilter: 'blur(24px)', borderBottom: '1px solid #1A1E2A' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 transition-all group"
                style={{ color: '#4A5468' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E8ECF4')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#4A5468')}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: '#0C1018', border: '1px solid #1E2636' }}
                >
                  <ArrowLeft size={15} style={{ color: '#8A94A8' }} />
                </div>
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </button>
              <div className="h-5 w-px" style={{ background: '#1E2636' }} />
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.35)' }}
                >
                  <Layers size={16} style={{ color: '#A855F7' }} />
                </div>
                <div>
                  <span className="font-display font-bold text-base leading-none" style={{ color: '#E8ECF4', letterSpacing: '0.04em' }}>
                    Celestial Assembler
                  </span>
                  <div className="text-[10px] font-medium leading-none mt-0.5" style={{ color: '#4A5468' }}>
                    Asset Gallery · {ASSETS.length} items
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="hidden sm:flex items-center gap-2 rounded-2xl px-3 py-2"
                style={{ background: '#0C1018', border: '1px solid #1E2636' }}
              >
                <div className="glow-dot" />
                <span className="text-xs font-semibold" style={{ color: '#8A94A8' }}>Testnet</span>
              </div>
              <button
                className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-all duration-200"
                style={{
                  background: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#C084FC',
                  letterSpacing: '0.03em',
                }}
              >
                <Zap size={13} />
                <span className="hidden sm:inline">Connect</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-20 md:pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-14 pt-6">
            <div className="inline-flex items-center gap-2 mb-5">
              <span
                className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest"
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.25)',
                  color: '#A855F7',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Star size={10} />
                  CELESTIAL ASSEMBLER
                </span>
              </span>
            </div>

            <h1
              className="font-display font-black text-4xl md:text-6xl lg:text-7xl mb-4 leading-[1.06]"
              style={{ color: '#E8ECF4', letterSpacing: '0.02em' }}
            >
              Asset{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 40%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Gallery
              </span>
            </h1>

            <p className="text-lg max-w-xl mx-auto mb-8" style={{ color: '#4A5468', lineHeight: '1.7' }}>
              Premium on-chain assets powering the Star Vault ecosystem — mystery boxes,
              rocket components, and feature modules.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: 'Total Assets', value: `${ASSETS.length}` },
                { label: 'Rarity Tiers', value: '8' },
                { label: 'Asset Types', value: '3' },
                { label: 'On-Chain', value: '100%' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="px-4 py-2.5 rounded-2xl flex items-center gap-3"
                  style={{ background: '#0C1018', border: '1px solid #1E2636' }}
                >
                  <span className="font-display font-black text-sm" style={{ color: '#E8ECF4' }}>{s.value}</span>
                  <span className="text-xs" style={{ color: '#4A5468' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <FeaturedShowcase />

          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="font-display font-black text-2xl mb-1"
                style={{ color: '#E8ECF4', letterSpacing: '0.02em' }}
              >
                All Assets
              </h2>
              <p className="text-sm" style={{ color: '#4A5468' }}>
                {filtered.length} asset{filtered.length !== 1 ? 's' : ''} in collection
              </p>
            </div>

            <div className="flex items-center gap-2">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCategory(tab.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200"
                  style={category === tab.id ? {
                    background: '#1E2636',
                    color: '#E8ECF4',
                    border: '1px solid #3A4A60',
                  } : {
                    background: 'transparent',
                    color: '#4A5468',
                    border: '1px solid #1E2636',
                  }}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: category === tab.id ? '#2A3A50' : '#1E2636',
                      color: category === tab.id ? '#8A94A8' : '#4A5468',
                    }}
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>

          <div className="mt-20 rounded-3xl overflow-hidden" style={{ background: '#0A0C16', border: '1px solid #1E2636' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: '#1E2636' }}>
              {[
                {
                  icon: <Box size={20} style={{ color: '#3B82F6' }} />,
                  title: 'Mystery Boxes',
                  count: counts.boxes,
                  description: '8 rarity tiers from Common to Quantum. Each box contains a guaranteed NFT rocket part with randomized multipliers.',
                  color: '#3B82F6',
                },
                {
                  icon: <Rocket size={20} style={{ color: '#F59E0B' }} />,
                  title: 'Rocket System',
                  count: counts.rocket,
                  description: 'Modular rocket components you assemble in the Celestial Lab. Power, fuel, and structure all affect your Grav Score.',
                  color: '#F59E0B',
                },
                {
                  icon: <Cpu size={20} style={{ color: '#22C55E' }} />,
                  title: 'Feature Modules',
                  count: counts.modules,
                  description: 'Ecosystem infrastructure assets — the auction podium, launch pad, and season trophy that power the competitive layer.',
                  color: '#22C55E',
                },
              ].map((section) => (
                <div key={section.title} className="p-7">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: `${section.color}12`, border: `1px solid ${section.color}30` }}
                  >
                    {section.icon}
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="font-display font-black text-xl" style={{ color: '#E8ECF4' }}>{section.title}</p>
                    <span className="font-data text-xs" style={{ color: '#4A5468' }}>{section.count} assets</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#4A5468', lineHeight: '1.7' }}>
                    {section.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

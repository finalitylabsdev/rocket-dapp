import { BadgeInfo, Flame, Gavel, Gauge, Shield, Sparkles } from 'lucide-react';
import BoxCard from './BoxCard';
import JourneyCue from '../JourneyCue';
import RarityBadge, { getRarityConfig } from '../brand/RarityBadge';
import RocketPreview from '../lab/RocketPreview';
import { buildRocketLabSlots } from '../lab/rocketLabAdapter';
import { useBoxTiers } from '../../hooks/useBoxTiers';
import { useRarityConfig } from '../../hooks/useRarityConfig';
import { AUCTION_MIN_RARITY_TIER } from '../../config/spec';
import { PREVIEW_BOX_REVEALS } from '../../lib/launchPreview';
import type { BoxTierConfig, InventoryPart } from '../../types/domain';
import { SectionGlyph } from './metadataVisuals';
import {
  APP3_INSET_STYLE,
  APP3_PANEL_STYLE,
  APP3_TEXT_PRIMARY_STYLE,
  APP3_TEXT_SECONDARY_STYLE,
  APP3_TRACK_STYLE,
} from './ui';

interface PreviewVaultCard {
  tier: BoxTierConfig;
}

interface PreviewVaultShowcase {
  boxes: PreviewVaultCard[];
  lastDraw: InventoryPart | null;
}

function LoadingCard({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`p-5 animate-pulse h-full ${featured ? 'min-h-[32rem]' : ''}`}
      style={APP3_PANEL_STYLE}
    >
      <div className="h-4 w-20 mb-3" style={{ background: 'var(--color-bg-card-hover)' }} />
      <div className="h-6 w-36 mb-2" style={{ background: 'var(--color-bg-card-hover)' }} />
      <div className="h-3 w-28 mb-6" style={{ background: 'var(--color-bg-card-hover)' }} />
      <div className="h-28 mb-6" style={APP3_INSET_STYLE} />
      <div className="space-y-2">
        <div className="h-3" style={{ background: 'var(--color-bg-card-hover)' }} />
        <div className="h-3" style={{ background: 'var(--color-bg-card-hover)' }} />
        <div className="h-3" style={{ background: 'var(--color-bg-card-hover)' }} />
      </div>
    </div>
  );
}

function LoadingLastDrawWindow() {
  return (
    <div
      className="relative overflow-hidden p-5 animate-pulse"
      style={{
        ...APP3_PANEL_STYLE,
        border: '1px solid rgba(246,197,71,0.22)',
        boxShadow: 'inset 0 0 0 1px rgba(246,197,71,0.05)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(246,197,71,0.4), transparent)' }}
      />
      <div className="absolute top-4 right-4 h-5 w-20" style={APP3_INSET_STYLE} />
      <div className="pt-6 pr-24">
        <div className="flex items-start gap-3">
          <div className="h-[54px] w-[54px] rounded-xl" style={APP3_INSET_STYLE} />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-5 w-40" style={{ background: 'var(--color-bg-card-hover)' }} />
            <div className="h-4 w-28" style={{ background: 'var(--color-bg-card-hover)' }} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3" style={{ background: 'var(--color-bg-card-hover)' }} />
          <div className="h-3" style={{ background: 'var(--color-bg-card-hover)' }} />
          <div className="h-3" style={{ background: 'var(--color-bg-card-hover)' }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="h-14" style={APP3_INSET_STYLE} />
          <div className="h-14" style={APP3_INSET_STYLE} />
        </div>
      </div>
    </div>
  );
}

function AttributeBars({ part }: { part: InventoryPart }) {
  const cfg = getRarityConfig(part.rarity);
  const icons = [Flame, Gauge, Shield] as const;

  return (
    <div className="space-y-2 mt-4">
      {part.attributes.map((value, index) => (
        <div key={part.attributeNames[index]} className="rounded-xl px-3 py-2" style={APP3_INSET_STYLE}>
          <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-wider mb-1">
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.border}` }}
              >
                {(() => {
                  const Icon = icons[index] ?? Sparkles;
                  return <Icon size={10} style={{ color: cfg.color }} />;
                })()}
              </div>
              <span className="truncate" style={APP3_TEXT_SECONDARY_STYLE}>{part.attributeNames[index]}</span>
            </div>
            <span className="shrink-0" style={APP3_TEXT_PRIMARY_STYLE}>{value}</span>
          </div>
          <div className="h-1.5 w-1/2 min-w-[7.5rem] overflow-hidden rounded-full" style={APP3_TRACK_STYLE}>
            <div
              className="h-full"
              style={{
                width: `${value}%`,
                background: 'linear-gradient(90deg, #F6C547, #F59E0B)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function getPartLore(part: InventoryPart) {
  return `Archive Briefing: ${part.name} was tuned inside a low-gravity calibration rack until its ${part.attributeNames[0].toLowerCase()} harmonics settled. The ${part.serialTrait ?? 'standard'} signature now keeps ${part.sectionName.toLowerCase()} output unnervingly smooth during drift corrections. Field crews still note a soft relay chatter during warm starts, but the lattice remains stable once the auxiliary spool catches its second cycle.`;
}

function LastDrawWindow({ part }: { part: InventoryPart }) {
  const cfg = getRarityConfig(part.rarity);
  const previewSlots = buildRocketLabSlots([
    {
      ...part,
      isEquipped: true,
      equippedSectionKey: part.slot,
    },
  ]);

  return (
    <div className="relative pt-3">
      <div className="relative overflow-hidden p-px">
        <div
          className="pointer-events-none absolute inset-[-70%]"
          style={{
            background: '#374151',
          }}
        />

        <div
          className="relative overflow-hidden p-5"
        style={{
          ...APP3_PANEL_STYLE,
          border: 'none',
          boxShadow: `inset 0 0 0 1px ${cfg.color}14`,
        }}
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(12rem,0.7fr)_18rem] lg:items-start">
          <div>
            <div className="flex items-start gap-3">
              <SectionGlyph asset={part.illustration} fallbackKey={part.slot} size="md" />
              <div className="min-w-0 flex-1">
                <p
                  className="font-mono font-black text-lg sm:text-xl uppercase"
                  style={{ color: cfg.color }}
                  title={part.name}
                >
                  {part.name}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <RarityBadge tier={part.rarity} size="xs" />
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                    style={{ background: 'rgba(15,23,42,0.65)', color: '#E2E8F0', border: '1px solid rgba(148,163,184,0.2)' }}
                  >
                    {part.sectionName}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                    style={{ background: 'rgba(15,23,42,0.58)', color: '#E2E8F0', border: '1px solid rgba(148,163,184,0.18)' }}
                  >
                    #{(part.serialNumber ?? 0).toString().padStart(6, '0')}
                  </span>
                  {part.isShiny && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.28)' }}
                    >
                      Shiny
                    </span>
                  )}
                </div>
              </div>
            </div>

            <AttributeBars part={part} />

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-xl px-3 py-2 min-w-0" style={APP3_INSET_STYLE}>
                <span style={APP3_TEXT_SECONDARY_STYLE}>Total Power</span>
                <p className="mt-1 font-mono font-black text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
                  {part.totalPower}
                </p>
              </div>
              <div className="rounded-xl px-3 py-2 min-w-0" style={APP3_INSET_STYLE}>
                <span style={APP3_TEXT_SECONDARY_STYLE}>Serial Trait</span>
                <p className="mt-1 font-mono font-black text-sm truncate" style={APP3_TEXT_PRIMARY_STYLE}>
                  {part.serialTrait}
                </p>
              </div>
            </div>
          </div>

          <div className="flex h-full min-h-[14rem] items-center px-2">
            <div className="max-w-[15rem]">
              <div className="flex items-center gap-2">
                <BadgeInfo size={12} style={{ color: cfg.color }} />
                <span
                  className="text-[9px] font-mono font-semibold uppercase tracking-[0.18em]"
                  style={{ color: cfg.color }}
                >
                  Component Brief
                </span>
              </div>
              <p className="mt-2 text-[11px] font-mono leading-relaxed text-text-secondary">
                {getPartLore(part)}
              </p>
            </div>
          </div>

          <div
            className="rounded-2xl self-start px-3 py-2 sm:px-4 sm:py-3"
            style={{
              ...APP3_INSET_STYLE,
              border: `1px solid ${cfg.border}`,
            }}
          >
            <RocketPreview
              slots={previewSlots}
              model="standard"
              launching={false}
              onLaunchComplete={() => {}}
              compact
              showStatusDots={false}
              highlightSection={part.slot}
              highlightColor={cfg.color}
            />
          </div>
        </div>
      </div>
      </div>

      <div
        className="absolute right-5 z-10 overflow-hidden -translate-y-1/2"
        style={{ top: '0.75rem' }}
      >
        <div
          className="pointer-events-none absolute inset-[-200%]"
          style={{
            background: '#374151',
          }}
        />
        <span
          className="relative inline-flex items-center justify-center px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-[0.22em]"
          style={{ color: '#fff' }}
        >
          LAST DRAW
        </span>
      </div>
    </div>
  );
}

function getPreviewVaultShowcase(boxTiers: BoxTierConfig[]): PreviewVaultShowcase {
  const previewTiers = boxTiers.slice(0, 3);

  if (previewTiers.length === 0) {
    return {
      boxes: [],
      lastDraw: null,
    };
  }

  const featuredReward = PREVIEW_BOX_REVEALS.find((part) => part.illustration?.url || part.illustration?.key) ?? PREVIEW_BOX_REVEALS[0] ?? null;

  return {
    boxes: previewTiers.map((tier) => ({
      tier,
    })),
    lastDraw: featuredReward,
  };
}

function StatusBanner({
  title,
  message,
  tone,
}: {
  title: string;
  message: string;
  tone: 'danger' | 'warning' | 'info';
}) {
  const styles = tone === 'danger'
    ? {
        background: '#120B0B',
        border: '1px solid rgba(239,68,68,0.35)',
        color: '#FCA5A5',
      }
    : tone === 'warning'
      ? {
          background: 'rgba(120,53,15,0.24)',
          border: '1px solid rgba(245,158,11,0.28)',
          color: '#FCD34D',
        }
      : {
          background: 'rgba(15,23,42,0.72)',
          border: '1px solid rgba(59,130,246,0.22)',
          color: '#BFDBFE',
        };

  return (
    <div className="mb-6 p-4 font-mono" style={styles}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">{title}</p>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}

interface VaultTabProps {
  inventory: InventoryPart[];
  readOnly?: boolean;
  onNavigateBids?: () => void;
}

export default function VaultTab({
  inventory,
  readOnly = false,
  onNavigateBids,
}: VaultTabProps) {
  const rarityConfig = useRarityConfig();
  const { boxTiers, isLoading, error, readState, refresh } = useBoxTiers();
  const hasAuctionEligiblePart = inventory.some(
    (p) => p.rarityTierId >= AUCTION_MIN_RARITY_TIER && !p.isLocked && !p.isEquipped,
  );
  const showRetry = (!isLoading && readState !== 'ready') || (!rarityConfig.isLoading && rarityConfig.readState !== 'catalog');
  const isCatalogDegraded = readState === 'degraded';
  const isCatalogStale = readState === 'stale';
  const isRarityFallback = rarityConfig.readState === 'fallback';
  const isRarityStale = rarityConfig.readState === 'stale';
  const previewShowcase = readOnly ? getPreviewVaultShowcase(boxTiers) : null;
  const isPreviewShowcase = readOnly && !isCatalogDegraded;

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="tag mb-2 inline-flex">Star Vault Boxes</span>
          <h2 className="section-title">Open a Star Vault Box</h2>
          <p className="text-sm mt-2 max-w-xl font-mono text-text-muted">
            {readOnly
              ? 'Preview reveals and sample inventory stay visible while box openings are blocked.'
              : 'Server-generated drops, catalog-backed box metadata, and inventory snapshots after every open.'}
          </p>
        </div>
        {showRetry && (
          <button
            onClick={() => {
              void Promise.all([
                refresh(),
                rarityConfig.refresh(),
              ]);
            }}
            className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider"
            style={{ color: '#F6C547', border: '1px solid rgba(246,197,71,0.25)', background: 'rgba(246,197,71,0.08)' }}
          >
            Retry
          </button>
        )}
      </div>

      {isCatalogDegraded && (
        <StatusBanner
          title="Degraded Catalog Read"
          message={error ?? 'Star Vault metadata is unavailable. Box purchasing is paused until the catalog recovers.'}
          tone="danger"
        />
      )}

      {!isCatalogDegraded && isCatalogStale && error && (
        <StatusBanner
          title="Stale Box Metadata"
          message={error}
          tone="warning"
        />
      )}

      {!isCatalogDegraded && isRarityFallback && rarityConfig.error && (
        <StatusBanner
          title="Launch-Default Rarity Styling"
          message={rarityConfig.error}
          tone="info"
        />
      )}

      {!isCatalogDegraded && isRarityStale && rarityConfig.error && (
        <StatusBanner
          title="Stale Rarity Metadata"
          message={rarityConfig.error}
          tone="info"
        />
      )}

      {isCatalogDegraded ? (
        <div className="p-5" style={APP3_PANEL_STYLE}>
          <div className="p-5" style={APP3_INSET_STYLE}>
            <p className="font-mono font-black text-lg uppercase tracking-wider text-text-primary">
              Star Vault Catalog Unavailable
            </p>
            <p className="mt-3 text-sm font-mono text-text-muted">
              App 3 no longer falls back to hidden placeholder boxes when the catalog is missing. This degraded state is deliberate:
              box openings are paused until the live box-tier metadata returns.
            </p>
            <p className="mt-3 text-xs font-mono uppercase tracking-[0.16em] text-text-secondary">
              Rarity badges remain on launch-default treatment so inventory labels stay readable while catalog reads recover.
            </p>
          </div>
        </div>
      ) : (
        isPreviewShowcase ? (
          <div className="space-y-4">
            {isLoading && boxTiers.length === 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <LoadingCard key={index} />
                  ))}
                </div>
                <LoadingLastDrawWindow />
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {previewShowcase?.boxes.map((card) => (
                    <BoxCard
                      key={card.tier.id}
                      tier={card.tier}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
                {previewShowcase?.lastDraw && (
                  <LastDrawWindow part={previewShowcase.lastDraw} />
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading && boxTiers.length === 0
              ? Array.from({ length: 4 }, (_, index) => <LoadingCard key={index} />)
              : boxTiers.map((tier) => (
                <BoxCard
                  key={tier.id}
                  tier={tier}
                  readOnly={readOnly}
                />
              ))}
          </div>
        )
      )}

      {hasAuctionEligiblePart && onNavigateBids && (
        <div className="mt-6">
          <JourneyCue
            icon={<Gavel size={16} />}
            message="You have an auction-eligible part! Submit it to Nebula Bids for Φ."
            actionLabel="Go to Bids"
            onAction={onNavigateBids}
            tone="purple"
          />
        </div>
      )}
    </section>
  );
}

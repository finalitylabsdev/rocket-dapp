import { Gavel } from 'lucide-react';
import BoxCard from './BoxCard';
import JourneyCue from '../JourneyCue';
import { useBoxTiers } from '../../hooks/useBoxTiers';
import { useRarityConfig } from '../../hooks/useRarityConfig';
import { AUCTION_MIN_RARITY_TIER } from '../../config/spec';
import { PREVIEW_BOX_REVEALS } from '../../lib/launchPreview';
import type { InventoryPart } from '../../types/domain';
import { APP3_INSET_STYLE, APP3_PANEL_STYLE } from './ui';

function LoadingCard() {
  return (
    <div className="p-5 animate-pulse" style={APP3_PANEL_STYLE}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {isLoading && boxTiers.length === 0
            ? Array.from({ length: 4 }, (_, index) => <LoadingCard key={index} />)
            : boxTiers.map((tier, index) => (
              <BoxCard
                key={tier.id}
                tier={tier}
                readOnly={readOnly}
                previewReward={readOnly ? PREVIEW_BOX_REVEALS[index] ?? null : null}
              />
            ))}
        </div>
      )}

      {hasAuctionEligiblePart && onNavigateBids && (
        <div className="mt-6">
          <JourneyCue
            icon={<Gavel size={16} />}
            message="You have an auction-eligible part! Submit it to Nebula Bids for FLUX."
            actionLabel="Go to Bids"
            onAction={onNavigateBids}
            tone="purple"
          />
        </div>
      )}
    </section>
  );
}

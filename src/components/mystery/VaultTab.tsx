import BoxCard from './BoxCard';
import { useBoxTiers } from '../../hooks/useBoxTiers';
import { useRarityConfig } from '../../hooks/useRarityConfig';
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

export default function VaultTab() {
  const rarityConfig = useRarityConfig();
  const { boxTiers, isLoading, error, refresh } = useBoxTiers();
  const combinedError = error ?? rarityConfig.error;

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="tag mb-2 inline-flex">Star Vault Boxes</span>
          <h2 className="section-title">Open a Star Vault Box</h2>
          <p className="text-sm mt-2 max-w-xl font-mono text-text-muted">
            Server-generated drops, database-driven rarity visuals, and full inventory snapshots after every open.
          </p>
        </div>
        {combinedError && (
          <button
            onClick={() => {
              void Promise.all([
                refresh(),
                rarityConfig.refresh(),
              ]);
            }}
            className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-accent-gold)', border: '1px solid rgba(255,201,94,0.25)', background: 'rgba(255,201,94,0.08)', borderRadius: '999px' }}
          >
            Retry
          </button>
        )}
      </div>

      {combinedError && (
        <div className="mb-6 p-4 font-mono text-sm" style={{ background: '#120B0B', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5' }}>
          {combinedError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading && boxTiers.length === 0
          ? Array.from({ length: 4 }, (_, index) => <LoadingCard key={index} />)
          : boxTiers.map((tier) => <BoxCard key={tier.id} tier={tier} />)}
      </div>
    </section>
  );
}

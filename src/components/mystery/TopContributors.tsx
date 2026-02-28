import type { AuctionHistoryEntry } from '../../types/domain';
import { APP3_INSET_STYLE, APP3_PANEL_STYLE, APP3_TEXT_MUTED_STYLE, APP3_TEXT_PRIMARY_STYLE, APP3_TEXT_SECONDARY_STYLE, formatFluxValue } from './ui';

interface TopContributorsProps {
  history: AuctionHistoryEntry[];
}

export default function TopContributors({ history }: TopContributorsProps) {
  const totals = history.reduce<Map<string, number>>((acc, entry) => {
    if (!entry.sellerWallet || entry.finalPrice <= 0) {
      return acc;
    }

    acc.set(entry.sellerWallet, (acc.get(entry.sellerWallet) ?? 0) + entry.finalPrice);
    return acc;
  }, new Map());

  const leaders = Array.from(totals.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);

  return (
    <div className="p-4" style={APP3_PANEL_STYLE}>
      <p className="font-mono font-black text-sm uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
        Top Contributors
      </p>
      <p className="mt-1 text-[10px] font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
        Ranked by auction proceeds
      </p>

      <div className="mt-4 space-y-2">
        {leaders.length === 0 ? (
          <div className="p-3 text-sm font-mono" style={{ ...APP3_INSET_STYLE, ...APP3_TEXT_MUTED_STYLE }}>
            Auction history will populate this board once rounds complete.
          </div>
        ) : (
          leaders.map(([wallet, total], index) => (
            <div
              key={wallet}
              className="p-3 flex items-center justify-between gap-3"
              style={APP3_INSET_STYLE}
            >
              <div>
                <p className="font-mono font-semibold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
                  #{index + 1} {wallet.slice(0, 6)}...{wallet.slice(-4)}
                </p>
              </div>
              <span className="text-xs font-mono" style={{ color: '#C084FC' }}>
                {formatFluxValue(total)} Φ
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

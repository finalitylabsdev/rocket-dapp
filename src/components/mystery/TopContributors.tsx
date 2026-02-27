import type { AuctionHistoryEntry } from '../../types/domain';

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
    <div className="p-4" style={{ background: '#06080F', border: '1px solid #1E2636' }}>
      <p className="font-mono font-black text-sm uppercase tracking-wider" style={{ color: '#E8ECF4' }}>
        Top Contributors
      </p>
      <p className="mt-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: '#8A94A8' }}>
        Ranked by auction proceeds
      </p>

      <div className="mt-4 space-y-2">
        {leaders.length === 0 ? (
          <div className="p-3 text-sm font-mono" style={{ background: '#0C1018', border: '1px solid #1E2636', color: '#6B7280' }}>
            Auction history will populate this board once rounds complete.
          </div>
        ) : (
          leaders.map(([wallet, total], index) => (
            <div
              key={wallet}
              className="p-3 flex items-center justify-between gap-3"
              style={{ background: '#0C1018', border: '1px solid #1E2636' }}
            >
              <div>
                <p className="font-mono font-semibold text-xs" style={{ color: '#E8ECF4' }}>
                  #{index + 1} {wallet.slice(0, 6)}...{wallet.slice(-4)}
                </p>
              </div>
              <span className="text-xs font-mono" style={{ color: '#C084FC' }}>
                {total.toFixed(2).replace(/\.00$/, '')} FLUX
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

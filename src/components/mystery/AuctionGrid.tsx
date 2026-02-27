import type { AuctionRound } from '../../types/domain';
import { useCountdown } from '../../hooks/useCountdown';
import { APP3_INSET_STYLE, APP3_PANEL_STYLE, APP3_TEXT_MUTED_STYLE, APP3_TEXT_PRIMARY_STYLE, APP3_TEXT_SECONDARY_STYLE, formatFluxValue } from './ui';

interface AuctionGridProps {
  activeAuction: AuctionRound | null;
  selectedRoundId: number | null;
  onSelect: (roundId: number) => void;
}

export default function AuctionGrid({ activeAuction, selectedRoundId, onSelect }: AuctionGridProps) {
  if (!activeAuction) {
    return (
      <div className="p-4" style={APP3_PANEL_STYLE}>
        <p className="font-mono font-semibold text-sm uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
          No Auctions Active
        </p>
        <p className="mt-2 text-sm font-mono" style={APP3_TEXT_MUTED_STYLE}>
          The next round will begin as soon as the scheduler starts a new cycle.
        </p>
      </div>
    );
  }

  return (
    <AuctionRoundCard
      round={activeAuction}
      isSelected={selectedRoundId === activeAuction.roundId}
      onSelect={onSelect}
    />
  );
}

function AuctionRoundCard({
  round,
  isSelected,
  onSelect,
}: {
  round: AuctionRound;
  isSelected: boolean;
  onSelect: (roundId: number) => void;
}) {
  const targetTime = round.status === 'accepting_submissions' ? round.submissionEndsAt : round.endsAt;
  const countdown = useCountdown(targetTime);

  return (
    <button
      onClick={() => onSelect(round.roundId)}
      className="w-full p-4 text-left transition-colors rounded-2xl"
      style={{
        background: isSelected ? 'rgba(245,95,217,0.1)' : 'var(--color-bg-card)',
        border: `1px solid ${isSelected ? 'rgba(245,95,217,0.24)' : 'var(--color-border-subtle)'}`,
        boxShadow: isSelected ? 'var(--surface-shadow-soft)' : 'var(--surface-gloss)',
      }}
    >
      <div className="mb-3 h-1 rounded-full" style={{ background: isSelected ? 'linear-gradient(90deg, var(--color-accent-pink) 0%, var(--color-accent-lime) 100%)' : 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))' }} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono font-black text-sm tracking-tight" style={APP3_TEXT_PRIMARY_STYLE}>
            Round #{round.roundId}
          </p>
          <p className="text-[10px] mt-1 font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
            {round.status === 'accepting_submissions' ? 'Accepting submissions' : 'Bidding live'}
          </p>
        </div>
        <span className="text-xs font-mono" style={{ color: '#C084FC' }}>
          {countdown.formatted}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="font-mono font-bold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
            {round.bidCount}
          </p>
          <p className="text-[9px] font-mono uppercase" style={APP3_TEXT_MUTED_STYLE}>Bids</p>
        </div>
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="font-mono font-bold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
            {formatFluxValue(round.currentHighestBid)}
          </p>
          <p className="text-[9px] font-mono uppercase" style={APP3_TEXT_MUTED_STYLE}>Top FLUX</p>
        </div>
      </div>
    </button>
  );
}

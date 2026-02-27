import type { AuctionRound } from '../../types/domain';
import { useCountdown } from '../../hooks/useCountdown';

interface AuctionGridProps {
  activeAuction: AuctionRound | null;
  selectedRoundId: number | null;
  onSelect: (roundId: number) => void;
}

export default function AuctionGrid({ activeAuction, selectedRoundId, onSelect }: AuctionGridProps) {
  if (!activeAuction) {
    return (
      <div className="p-4" style={{ background: '#06080F', border: '1px solid #1E2636' }}>
        <p className="font-mono font-semibold text-sm uppercase tracking-wider" style={{ color: '#E8ECF4' }}>
          No Auctions Active
        </p>
        <p className="mt-2 text-sm font-mono" style={{ color: '#6B7280' }}>
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
      className="w-full p-4 text-left transition-colors"
      style={{
        background: isSelected ? 'rgba(168,85,247,0.08)' : '#06080F',
        border: `1px solid ${isSelected ? 'rgba(168,85,247,0.3)' : '#1E2636'}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono font-black text-sm uppercase tracking-wider" style={{ color: '#E8ECF4' }}>
            Round #{round.roundId}
          </p>
          <p className="text-[10px] mt-1 font-mono uppercase tracking-wider" style={{ color: '#8A94A8' }}>
            {round.status === 'accepting_submissions' ? 'Accepting submissions' : 'Bidding live'}
          </p>
        </div>
        <span className="text-xs font-mono" style={{ color: '#C084FC' }}>
          {countdown.formatted}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="p-2" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
          <p className="font-mono font-bold text-xs" style={{ color: '#E8ECF4' }}>
            {round.bidCount}
          </p>
          <p className="text-[9px] font-mono uppercase" style={{ color: '#4A5468' }}>Bids</p>
        </div>
        <div className="p-2" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
          <p className="font-mono font-bold text-xs" style={{ color: '#E8ECF4' }}>
            {round.currentHighestBid.toFixed(2).replace(/\.00$/, '')}
          </p>
          <p className="text-[9px] font-mono uppercase" style={{ color: '#4A5468' }}>Top FLUX</p>
        </div>
      </div>
    </button>
  );
}

import { AUCTION_BIDDING_WINDOW_SECONDS, AUCTION_SUBMISSION_WINDOW_SECONDS } from '../../config/spec';
import type { AuctionRound } from '../../types/domain';
import { useCountdown } from '../../hooks/useCountdown';
import {
  APP3_INSET_STYLE,
  APP3_META_CHIP_STYLE,
  APP3_PANEL_STYLE,
  APP3_SHINY_BADGE_STYLE,
  APP3_TEXT_MUTED_STYLE,
  APP3_TEXT_PRIMARY_STYLE,
  APP3_TEXT_SECONDARY_STYLE,
  formatAuctionDurationLabel,
  formatAuctionSerialNumber,
  formatFluxValue,
} from './ui';

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
          The next hourly round will begin as soon as the scheduler starts a new cycle.
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
  const statusLabel = round.status === 'accepting_submissions'
    ? `Accepting submissions - ${formatAuctionDurationLabel(AUCTION_SUBMISSION_WINDOW_SECONDS)} window`
    : `Bidding live - ${formatAuctionDurationLabel(AUCTION_BIDDING_WINDOW_SECONDS)} phase`;

  return (
    <button
      onClick={() => onSelect(round.roundId)}
      className="w-full p-4 text-left transition-colors"
      style={{
        background: isSelected ? 'rgba(168,85,247,0.08)' : 'var(--color-bg-base)',
        border: `1px solid ${isSelected ? 'rgba(168,85,247,0.3)' : 'var(--color-border-subtle)'}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono font-black text-sm uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
            Round #{round.roundId}
          </p>
          <p className="text-[10px] mt-1 font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
            {statusLabel}
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

      {round.part && (
        <div className="mt-3 p-3 space-y-2" style={APP3_INSET_STYLE}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono font-semibold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
                {round.part.name}
              </p>
              <p className="mt-1 text-[9px] font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
                {round.part.sectionName}
              </p>
            </div>
            {round.part.isShiny && (
              <span
                className="px-2 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider"
                style={APP3_SHINY_BADGE_STYLE}
              >
                Shiny / Inverted
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider"
              style={APP3_META_CHIP_STYLE}
            >
              Power {round.part.totalPower > 0 ? round.part.totalPower.toLocaleString() : 'Pending'}
            </span>
            <span
              className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider"
              style={APP3_META_CHIP_STYLE}
            >
              Serial {formatAuctionSerialNumber(round.part.serialNumber)}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

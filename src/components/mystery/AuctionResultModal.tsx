import type { AuctionHistoryEntry } from '../../types/domain';

interface AuctionResultModalProps {
  result: AuctionHistoryEntry | null;
  onClose: () => void;
}

export default function AuctionResultModal({ result, onClose }: AuctionResultModalProps) {
  if (!result) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: 'rgba(2,6,12,0.78)' }}>
      <div className="w-full max-w-md p-6" style={{ background: '#06080F', border: '1px solid rgba(168,85,247,0.22)' }}>
        <p className="font-mono font-black text-xl uppercase tracking-wider" style={{ color: '#E8ECF4' }}>
          Auction Closed
        </p>
        <p className="mt-3 text-sm font-mono" style={{ color: '#8A94A8' }}>
          Round #{result.roundId}
        </p>

        <div className="mt-4 p-4" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
          <p className="font-mono font-semibold text-sm" style={{ color: '#E8ECF4' }}>
            {result.partName ?? 'No submission selected'}
          </p>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: '#8A94A8' }}>
            {result.sectionName ?? 'Nebula Bids'}
          </p>
          <p className="mt-3 text-xs font-mono" style={{ color: '#C084FC' }}>
            Final price: {result.finalPrice.toFixed(2).replace(/\.00$/, '')} FLUX
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 text-xs font-mono font-semibold uppercase tracking-wider"
          style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#C084FC' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

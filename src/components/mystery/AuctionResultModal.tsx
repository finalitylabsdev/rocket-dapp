import type { AuctionHistoryEntry } from '../../types/domain';
import {
  APP3_INSET_STYLE,
  APP3_META_CHIP_STYLE,
  APP3_PANEL_STYLE,
  APP3_SHINY_BADGE_STYLE,
  APP3_TEXT_PRIMARY_STYLE,
  APP3_TEXT_SECONDARY_STYLE,
  formatAuctionSerialNumber,
  formatFluxValue,
} from './ui';

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
      <div className="w-full max-w-md p-6" style={{ ...APP3_PANEL_STYLE, border: '1px solid rgba(168,85,247,0.22)' }}>
        <p className="font-mono font-black text-xl uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
          Auction Closed
        </p>
        <p className="mt-3 text-sm font-mono" style={APP3_TEXT_SECONDARY_STYLE}>
          Round #{result.roundId}
        </p>

        <div className="mt-4 p-4" style={APP3_INSET_STYLE}>
          <p className="font-mono font-semibold text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
            {result.partName ?? 'No submission selected'}
          </p>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
            {result.sectionName ?? 'Nebula Bids'}
          </p>
          {(result.totalPower > 0 || result.serialNumber > 0 || result.isShiny) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {result.totalPower > 0 && (
                <span
                  className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider"
                  style={APP3_META_CHIP_STYLE}
                >
                  Power {result.totalPower.toLocaleString()}
                </span>
              )}
              {result.serialNumber > 0 && (
                <span
                  className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider"
                  style={APP3_META_CHIP_STYLE}
                >
                  Serial {formatAuctionSerialNumber(result.serialNumber)}
                </span>
              )}
              {result.isShiny && (
                <span
                  className="px-2 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider"
                  style={APP3_SHINY_BADGE_STYLE}
                >
                  Shiny / Inverted
                </span>
              )}
            </div>
          )}
          <p className="mt-3 text-xs font-mono" style={{ color: '#C084FC' }}>
            Final price: {formatFluxValue(result.finalPrice)} Φ
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

import { useEffect, useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import RarityBadge from '../brand/RarityBadge';
import type { InventoryPart } from '../../types/domain';
import { AUCTION_MIN_RARITY_TIER } from '../../config/spec';
import {
  APP3_CONTROL_STYLE,
  APP3_INSET_STYLE,
  APP3_META_CHIP_STYLE,
  APP3_PANEL_STYLE,
  APP3_SHINY_BADGE_STYLE,
  APP3_TEXT_MUTED_STYLE,
  APP3_TEXT_PRIMARY_STYLE,
  APP3_TEXT_SECONDARY_STYLE,
  formatAuctionSerialNumber,
} from './ui';

interface SubmitToAuctionPanelProps {
  inventory: InventoryPart[];
  preferredPartId?: string | null;
  isSubmitting: boolean;
  onSubmit: (part: InventoryPart) => Promise<void>;
}

export default function SubmitToAuctionPanel({
  inventory,
  preferredPartId,
  isSubmitting,
  onSubmit,
}: SubmitToAuctionPanelProps) {
  const eligibleParts = useMemo(
    () => inventory.filter((part) => !part.isLocked && part.rarityTierId >= AUCTION_MIN_RARITY_TIER),
    [inventory],
  );
  const [selectedPartId, setSelectedPartId] = useState<string>('');

  useEffect(() => {
    if (preferredPartId && eligibleParts.some((part) => part.id === preferredPartId)) {
      setSelectedPartId(preferredPartId);
      return;
    }

    if (!selectedPartId && eligibleParts.length > 0) {
      setSelectedPartId(eligibleParts[0].id);
      return;
    }

    if (selectedPartId && !eligibleParts.some((part) => part.id === selectedPartId)) {
      setSelectedPartId(eligibleParts[0]?.id ?? '');
    }
  }, [eligibleParts, preferredPartId, selectedPartId]);

  const selectedPart = eligibleParts.find((part) => part.id === selectedPartId) ?? null;

  return (
    <div className="p-4" style={APP3_PANEL_STYLE}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className="h-9 w-9 flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.22)', color: '#C084FC' }}
        >
          <Upload size={14} />
        </span>
        <div>
          <p className="font-mono font-black text-sm uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
            Submit to Auction
          </p>
          <p className="text-[10px] mt-1 font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
            Rare and above only
          </p>
        </div>
      </div>

      {eligibleParts.length === 0 ? (
        <p className="text-sm font-mono" style={APP3_TEXT_MUTED_STYLE}>
          No eligible parts right now. Open more boxes or wait for a higher-rarity drop.
        </p>
      ) : (
        <>
          <select
            value={selectedPartId}
            onChange={(event) => setSelectedPartId(event.target.value)}
            className="w-full px-3 py-3 text-xs font-mono uppercase tracking-wider"
            style={APP3_CONTROL_STYLE}
          >
            {eligibleParts.map((part) => (
              <option key={part.id} value={part.id}>
                {part.name} · {part.sectionName}
              </option>
            ))}
          </select>

          {selectedPart && (
            <div className="mt-3 p-3 space-y-3" style={APP3_INSET_STYLE}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono font-semibold text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
                    {selectedPart.name}
                  </p>
                  <p className="text-[10px] mt-1 font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
                    {selectedPart.sectionName}
                  </p>
                </div>
                <RarityBadge tier={selectedPart.rarity} size="xs" />
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider"
                  style={APP3_META_CHIP_STYLE}
                >
                  Power {(selectedPart.totalPower ?? selectedPart.power).toLocaleString()}
                </span>
                <span
                  className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider"
                  style={APP3_META_CHIP_STYLE}
                >
                  Serial {formatAuctionSerialNumber(selectedPart.serialNumber ?? 0)}
                </span>
                {selectedPart.isShiny && (
                  <span
                    className="px-2 py-1 text-[9px] font-mono font-semibold uppercase tracking-wider"
                    style={APP3_SHINY_BADGE_STYLE}
                  >
                    Shiny / Inverted
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => selectedPart && void onSubmit(selectedPart)}
            disabled={!selectedPart || isSubmitting}
            className="w-full mt-3 py-3 text-xs font-mono font-semibold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#C084FC' }}
          >
            {isSubmitting ? 'Submitting...' : 'Lock Part for Round'}
          </button>
        </>
      )}
    </div>
  );
}

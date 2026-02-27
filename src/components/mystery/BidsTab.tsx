import { useEffect, useRef, useState } from 'react';
import { Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { useGameState } from '../../context/GameState';
import { useWallet } from '../../hooks/useWallet';
import { useAuctions } from '../../hooks/useAuctions';
import { formatAuctionError, placeAuctionBid, submitAuctionItem } from '../../lib/nebulaBids';
import type { AuctionHistoryEntry, InventoryPart } from '../../types/domain';
import AuctionDetail from './AuctionDetail';
import AuctionGrid from './AuctionGrid';
import AuctionOpsPanel from './AuctionOpsPanel';
import AuctionResultModal from './AuctionResultModal';
import SubmitToAuctionPanel from './SubmitToAuctionPanel';
import TopContributors from './TopContributors';
import { APP3_INSET_STYLE, APP3_PANEL_STYLE, APP3_TEXT_MUTED_STYLE, APP3_TEXT_PRIMARY_STYLE, APP3_TEXT_SECONDARY_STYLE, formatFluxValue } from './ui';
import { NEBULA_BIDS_ENABLED } from '../../config/flags';

interface BidsTabProps {
  preferredPartId?: string | null;
  onPreferredPartHandled?: () => void;
}

export default function BidsTab({ preferredPartId, onPreferredPartHandled }: BidsTabProps) {
  const wallet = useWallet();
  const game = useGameState();
  const { activeAuction, history, isLoading, error, refresh } = useAuctions(Boolean(wallet.address) && NEBULA_BIDS_ENABLED);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [latestResult, setLatestResult] = useState<AuctionHistoryEntry | null>(history[0] ?? null);
  const hasCompletedInitialLoad = useRef(false);
  const lastShownRoundId = useRef<number | null>(null);

  useEffect(() => {
    if (activeAuction) {
      setSelectedRoundId(activeAuction.roundId);
    } else {
      setSelectedRoundId(null);
    }
  }, [activeAuction]);

  useEffect(() => {
    if (!history[0]) {
      return;
    }

    if (!hasCompletedInitialLoad.current) {
      hasCompletedInitialLoad.current = true;
      lastShownRoundId.current = history[0].roundId;
      return;
    }

    if (lastShownRoundId.current === history[0].roundId) {
      return;
    }

    lastShownRoundId.current = history[0].roundId;
    setLatestResult(history[0]);
  }, [history]);

  const handleSubmitItem = async (part: InventoryPart) => {
    if (!wallet.address) {
      return;
    }

    setIsSubmittingItem(true);

    try {
      await submitAuctionItem(wallet.address, part.id);
      await Promise.all([
        game.refreshInventory(),
        refresh(),
      ]);
      toast.success('Part submitted', {
        description: `${part.name} is locked for the current round.`,
      });
      onPreferredPartHandled?.();
    } catch (nextError) {
      toast.error('Submission failed', {
        description: formatAuctionError(nextError, 'Failed to submit part to auction.'),
      });
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handlePlaceBid = async (amount: number) => {
    if (!wallet.address || !activeAuction) {
      return;
    }

    setIsPlacingBid(true);

    try {
      const result = await placeAuctionBid(wallet.address, activeAuction.roundId, amount);
      game.applyServerSnapshot({ balance: result.balance });
      await refresh();
      toast.success('Bid placed', {
        description: `${amount.toFixed(2).replace(/\.00$/, '')} FLUX bid submitted.`,
      });
    } catch (nextError) {
      toast.error('Bid failed', {
        description: formatAuctionError(nextError, 'Failed to place bid.'),
      });
    } finally {
      setIsPlacingBid(false);
    }
  };

  if (!NEBULA_BIDS_ENABLED) {
    return (
      <section className="space-y-6">
        <div className="p-6" style={APP3_PANEL_STYLE}>
          <div className="flex items-center gap-3">
            <span
              className="h-10 w-10 flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.22)', color: '#C084FC' }}
            >
              <Gavel size={16} />
            </span>
            <div>
              <p className="font-mono font-black text-lg uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
                Nebula Bids — Coming Soon
              </p>
              <p className="mt-1 text-sm font-mono" style={APP3_TEXT_MUTED_STYLE}>
                Auctions are not yet available. Check back soon.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!wallet.address) {
    return (
      <section className="space-y-6">
        <div className="p-6" style={APP3_PANEL_STYLE}>
          <div className="flex items-center gap-3">
            <span
              className="h-10 w-10 flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.22)', color: '#C084FC' }}
            >
              <Gavel size={16} />
            </span>
            <div>
              <p className="font-mono font-black text-lg uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
                Connect for Nebula Bids
              </p>
              <p className="mt-1 text-sm font-mono" style={APP3_TEXT_MUTED_STYLE}>
                Bidding, submissions, and auction history require an authenticated wallet session.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="space-y-6">
        {error && (
          <div className="p-4 font-mono text-sm" style={{ background: '#120B0B', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6">
          <div className="space-y-4">
            <AuctionGrid
              activeAuction={activeAuction}
              selectedRoundId={selectedRoundId}
              onSelect={setSelectedRoundId}
            />
            <SubmitToAuctionPanel
              inventory={game.inventory}
              preferredPartId={preferredPartId}
              isSubmitting={isSubmittingItem}
              onSubmit={handleSubmitItem}
            />
            <AuctionOpsPanel
              activeAuction={activeAuction}
              history={history}
              isLoading={isLoading}
              onRefresh={() => void refresh()}
            />
          </div>

          <AuctionDetail
            activeAuction={activeAuction}
            isPlacingBid={isPlacingBid}
            onPlaceBid={handlePlaceBid}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div className="p-4" style={APP3_PANEL_STYLE}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="font-mono font-black text-sm uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
                  Recent Rounds
                </p>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
                  {isLoading ? 'Refreshing...' : `${history.length} records`}
                </p>
              </div>
              <button
                onClick={() => void refresh()}
                className="px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider"
                style={{ ...APP3_INSET_STYLE, color: '#C084FC' }}
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="p-3 text-sm font-mono" style={{ ...APP3_INSET_STYLE, ...APP3_TEXT_MUTED_STYLE }}>
                  No completed rounds yet.
                </div>
              ) : (
                history.slice(0, 8).map((entry) => (
                  <div
                    key={entry.roundId}
                    className="p-3 flex items-center justify-between gap-3"
                    style={APP3_INSET_STYLE}
                  >
                    <div>
                      <p className="font-mono font-semibold text-xs" style={APP3_TEXT_PRIMARY_STYLE}>
                        Round #{entry.roundId}
                      </p>
                      <p className="mt-1 text-[10px] font-mono uppercase tracking-wider" style={APP3_TEXT_SECONDARY_STYLE}>
                        {entry.partName ?? 'No winning part'}
                      </p>
                    </div>
                    <span className="text-xs font-mono" style={{ color: '#C084FC' }}>
                      {formatFluxValue(entry.finalPrice)} FLUX
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <TopContributors history={history} />
        </div>
      </section>

      <AuctionResultModal
        result={latestResult}
        onClose={() => setLatestResult(null)}
      />
    </>
  );
}

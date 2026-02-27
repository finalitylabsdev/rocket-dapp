import RarityBadge from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';
import { computeMinNextBid } from '../../lib/nebulaBids';
import type { AuctionRound } from '../../types/domain';
import BidInput from './BidInput';

interface AuctionDetailProps {
  activeAuction: AuctionRound | null;
  isPlacingBid: boolean;
  onPlaceBid: (amount: number) => Promise<void>;
}

function formatFluxValue(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export default function AuctionDetail({ activeAuction, isPlacingBid, onPlaceBid }: AuctionDetailProps) {
  if (!activeAuction) {
    return (
      <div className="p-5" style={{ background: '#06080F', border: '1px solid #1E2636' }}>
        <p className="font-mono font-black text-lg uppercase tracking-wider" style={{ color: '#E8ECF4' }}>
          Nebula Bids
        </p>
        <p className="mt-3 text-sm font-mono" style={{ color: '#6B7280' }}>
          No round is active right now. Check back when the next auction cycle opens.
        </p>
      </div>
    );
  }

  if (activeAuction.status === 'accepting_submissions' || !activeAuction.part) {
    return (
      <div className="p-5" style={{ background: '#06080F', border: '1px solid #1E2636' }}>
        <p className="font-mono font-black text-lg uppercase tracking-wider" style={{ color: '#E8ECF4' }}>
          Submission Window Open
        </p>
        <p className="mt-3 text-sm font-mono" style={{ color: '#6B7280' }}>
          Sellers are locking Rare-and-above parts right now. Once submissions close, the strongest eligible part enters bidding automatically.
        </p>
      </div>
    );
  }

  const part = activeAuction.part;
  const minBid = computeMinNextBid(activeAuction.currentHighestBid);

  return (
    <div className="p-5" style={{ background: '#06080F', border: '1px solid #1E2636' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono font-black text-lg uppercase tracking-wider" style={{ color: '#E8ECF4' }}>
            {part.name}
          </p>
          <p className="mt-1 text-[10px] font-mono uppercase tracking-wider" style={{ color: '#8A94A8' }}>
            {part.sectionName}
          </p>
        </div>
        <RarityBadge tier={part.rarity} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
          <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#8A94A8' }}>Current Bid</p>
          <p className="mt-2 font-mono font-black text-xl" style={{ color: '#E8ECF4' }}>
            {formatFluxValue(activeAuction.currentHighestBid)}
          </p>
        </div>
        <div className="p-3" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
          <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#8A94A8' }}>Part Value</p>
          <p className="mt-2 font-mono font-black text-xl flex items-center gap-1" style={{ color: '#E8ECF4' }}>
            <PhiSymbol size={12} color="currentColor" />
            {formatFluxValue(part.partValue)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {part.attributes.map((value, index) => (
          <div key={part.attributeNames[index]}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
              <span style={{ color: '#8A94A8' }}>{part.attributeNames[index]}</span>
              <span style={{ color: '#E8ECF4' }}>{value}</span>
            </div>
            <div className="h-1.5 overflow-hidden" style={{ background: '#0C1018', border: '1px solid #1E2636' }}>
              <div
                className="h-full"
                style={{
                  width: `${value}%`,
                  background: 'linear-gradient(90deg, rgba(168,85,247,0.5), #A855F7)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <BidInput
        minBid={minBid}
        isSubmitting={isPlacingBid}
        onSubmit={onPlaceBid}
      />

      <div className="mt-5">
        <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: '#8A94A8' }}>
          Bid History
        </p>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {activeAuction.bids.length === 0 ? (
            <div className="p-3 text-sm font-mono" style={{ background: '#0C1018', border: '1px solid #1E2636', color: '#6B7280' }}>
              Waiting for the first bid.
            </div>
          ) : (
            activeAuction.bids.map((bid) => (
              <div
                key={bid.id}
                className="p-3 flex items-center justify-between gap-3"
                style={{ background: '#0C1018', border: '1px solid #1E2636' }}
              >
                <span className="text-xs font-mono" style={{ color: '#8A94A8' }}>
                  {bid.wallet.slice(0, 6)}...{bid.wallet.slice(-4)}
                </span>
                <span className="font-mono font-semibold text-xs" style={{ color: '#E8ECF4' }}>
                  {formatFluxValue(bid.amount)} FLUX
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

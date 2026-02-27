import { useEffect, useState } from 'react';
import { AUCTION_MAX_BID_FLUX } from '../../config/spec';
import { normalizeAuctionBidAmount } from '../../lib/nebulaBids';
import PhiSymbol from '../brand/PhiSymbol';
import { APP3_CONTROL_STYLE, APP3_TEXT_PRIMARY_STYLE, APP3_TEXT_SECONDARY_STYLE, formatFluxValue } from './ui';

const BID_INPUT_PATTERN = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/;

interface BidInputProps {
  minBid: number;
  isSubmitting: boolean;
  onSubmit: (amount: number) => Promise<void>;
}

export default function BidInput({ minBid, isSubmitting, onSubmit }: BidInputProps) {
  const [amount, setAmount] = useState(() => formatFluxValue(minBid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount(formatFluxValue(minBid));
  }, [minBid]);

  const handleSubmit = async () => {
    const trimmedAmount = amount.trim();
    if (!trimmedAmount) {
      setError('Enter a valid bid amount.');
      return;
    }

    if (!BID_INPUT_PATTERN.test(trimmedAmount)) {
      setError('Use digits only, with up to 2 decimal places.');
      return;
    }

    let parsed: number;

    try {
      parsed = normalizeAuctionBidAmount(Number(trimmedAmount));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Enter a valid bid amount.');
      return;
    }

    if (parsed < minBid) {
      setError(`Bid must be at least ${formatFluxValue(minBid)} FLUX.`);
      return;
    }

    setError(null);
    await onSubmit(parsed);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-2">
        <span style={APP3_TEXT_SECONDARY_STYLE}>Minimum Valid Bid</span>
        <span style={APP3_TEXT_PRIMARY_STYLE}>{formatFluxValue(minBid)} FLUX</span>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="flex items-center gap-2 px-3" style={APP3_CONTROL_STYLE}>
          <PhiSymbol size={12} color="#C084FC" />
          <input
            type="number"
            min={minBid}
            max={AUCTION_MAX_BID_FLUX}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full py-3 bg-transparent outline-none font-mono text-sm"
            style={APP3_TEXT_PRIMARY_STYLE}
          />
        </div>
        <button
          onClick={() => void handleSubmit()}
          disabled={isSubmitting}
          className="px-4 py-3 text-xs font-mono font-semibold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#C084FC' }}
        >
          {isSubmitting ? 'Placing...' : 'Bid'}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs font-mono" style={{ color: '#FCA5A5' }}>
          {error}
        </p>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import PhiSymbol from '../brand/PhiSymbol';

interface BidInputProps {
  minBid: number;
  isSubmitting: boolean;
  onSubmit: (amount: number) => Promise<void>;
}

function formatFluxValue(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export default function BidInput({ minBid, isSubmitting, onSubmit }: BidInputProps) {
  const [amount, setAmount] = useState(() => formatFluxValue(minBid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount(formatFluxValue(minBid));
  }, [minBid]);

  const handleSubmit = async () => {
    const parsed = Number(amount);

    if (!Number.isFinite(parsed) || parsed < minBid) {
      setError(`Bid must be at least ${formatFluxValue(minBid)} FLUX.`);
      return;
    }

    setError(null);
    await onSubmit(parsed);
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-2">
        <span style={{ color: '#8A94A8' }}>Minimum Valid Bid</span>
        <span style={{ color: '#E8ECF4' }}>{formatFluxValue(minBid)} FLUX</span>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div
          className="flex items-center gap-2 px-3"
          style={{ background: '#0C1018', border: '1px solid #1E2636' }}
        >
          <PhiSymbol size={12} color="#C084FC" />
          <input
            type="number"
            min={minBid}
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="w-full py-3 bg-transparent outline-none font-mono text-sm"
            style={{ color: '#E8ECF4' }}
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

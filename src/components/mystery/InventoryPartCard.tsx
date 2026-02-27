import { useState } from 'react';
import RarityBadge from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';
import { AUCTION_MIN_RARITY_TIER } from '../../config/spec';
import type { InventoryPart } from '../../types/domain';

interface InventoryPartCardProps {
  part: InventoryPart;
  onSendToAuction?: (part: InventoryPart) => void;
}

function formatFluxValue(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export default function InventoryPartCard({ part, onSendToAuction }: InventoryPartCardProps) {
  const [showMeta, setShowMeta] = useState(false);
  const canSendToAuction = Boolean(onSendToAuction) && !part.isLocked && part.rarityTierId >= AUCTION_MIN_RARITY_TIER;

  return (
    <div className="p-4" style={{ background: '#06080F', border: '1px solid #1E2636' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono font-black text-sm uppercase tracking-wider" style={{ color: '#E8ECF4' }}>
            {part.name}
          </p>
          <p className="text-[10px] mt-1 font-mono uppercase tracking-wider" style={{ color: '#4A5468' }}>
            {part.sectionName}
          </p>
        </div>
        <RarityBadge tier={part.rarity} size="xs" />
      </div>

      <div className="mt-3 space-y-2">
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
                  background: 'linear-gradient(90deg, rgba(246,197,71,0.6), #F6C547)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-mono">
        <span style={{ color: '#8A94A8' }}>Part Value</span>
        <span className="flex items-center gap-1" style={{ color: '#E8ECF4' }}>
          <PhiSymbol size={10} color="currentColor" />
          {formatFluxValue(part.partValue)}
        </span>
      </div>

      {showMeta && (
        <div className="mt-3 p-2 text-[10px] font-mono uppercase tracking-wider" style={{ background: '#0C1018', color: '#6B7280' }}>
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span>{part.isLocked ? 'Locked' : 'Available'}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Source</span>
            <span>{part.source ?? 'mystery_box'}</span>
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowMeta((current) => !current)}
          className="py-2 text-[10px] font-mono font-semibold uppercase tracking-wider"
          style={{ background: '#0C1018', border: '1px solid #1E2636', color: '#8A94A8' }}
        >
          {showMeta ? 'Hide Stats' : 'View Stats'}
        </button>
        <button
          onClick={() => onSendToAuction?.(part)}
          disabled={!canSendToAuction}
          className="py-2 text-[10px] font-mono font-semibold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.22)', color: '#C084FC' }}
        >
          {part.isLocked ? 'Locked' : 'Send to Auction'}
        </button>
      </div>
    </div>
  );
}

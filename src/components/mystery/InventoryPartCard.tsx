import { useState } from 'react';
import RarityBadge, { getRarityConfig } from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';
import { AUCTION_MIN_RARITY_TIER } from '../../config/spec';
import type { InventoryPart } from '../../types/domain';
import { SectionGlyph } from './metadataVisuals';
import {
  APP3_INSET_STYLE,
  APP3_PANEL_STYLE,
  APP3_SECONDARY_BUTTON_STYLE,
  APP3_TEXT_MUTED_STYLE,
  APP3_TEXT_PRIMARY_STYLE,
  APP3_TEXT_SECONDARY_STYLE,
  formatFluxValue,
} from './ui';

interface InventoryPartCardProps {
  part: InventoryPart;
  onSendToAuction?: (part: InventoryPart) => void;
}

function formatMetadataKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toUpperCase();
}

function formatPartSource(source: InventoryPart['source']): string {
  switch (source) {
    case 'auction_win':
      return 'Auction Win';
    case 'admin':
      return 'Operator';
    case 'mystery_box':
    default:
      return 'Star Vault';
  }
}

function formatReceivedAt(value?: string): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function InventoryPartCard({ part, onSendToAuction }: InventoryPartCardProps) {
  const [showMeta, setShowMeta] = useState(false);
  const canSendToAuction = Boolean(onSendToAuction) && !part.isLocked && part.rarityTierId >= AUCTION_MIN_RARITY_TIER;
  const rarityCfg = getRarityConfig(part.rarity);
  const receivedAt = formatReceivedAt(part.createdAt);

  return (
    <div
      className="p-4"
      style={{
        ...APP3_PANEL_STYLE,
        border: `1px solid ${rarityCfg.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <SectionGlyph asset={part.illustration} fallbackKey={part.slot} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono font-black text-sm uppercase tracking-wider" style={APP3_TEXT_PRIMARY_STYLE}>
                {part.name}
              </p>
              <p className="text-[10px] mt-1 font-mono uppercase tracking-wider" style={APP3_TEXT_MUTED_STYLE}>
                {part.sectionName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <RarityBadge tier={part.rarity} size="xs" />
              <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.18em]" style={APP3_TEXT_MUTED_STYLE}>
                Tier {part.rarityTierId}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
              style={{ background: 'rgba(15,23,42,0.56)', color: '#E2E8F0', border: '1px solid rgba(148,163,184,0.18)' }}
            >
              {formatMetadataKey(part.slot)}
            </span>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
              style={{ background: rarityCfg.bg, color: rarityCfg.color, border: `1px solid ${rarityCfg.border}` }}
            >
              {formatMetadataKey(part.illustration?.key ?? part.slot)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {part.attributes.map((value, index) => (
          <div
            key={part.attributeNames[index]}
            className="p-2"
            style={{
              ...APP3_INSET_STYLE,
              borderTop: `1px solid ${rarityCfg.border}`,
            }}
          >
            <p className="text-[9px] font-mono uppercase tracking-[0.16em]" style={APP3_TEXT_SECONDARY_STYLE}>
              {part.attributeNames[index]}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: 'rgba(15,23,42,0.55)' }}>
              <div
                className="h-full"
                style={{
                  width: `${value}%`,
                  background: `linear-gradient(90deg, ${rarityCfg.border}, ${rarityCfg.color})`,
                }}
              />
            </div>
            <p className="mt-2 font-mono font-bold text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="text-[9px] font-mono uppercase tracking-[0.16em]" style={APP3_TEXT_SECONDARY_STYLE}>Value</p>
          <p className="mt-2 flex items-center gap-1 font-mono font-bold text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
            <PhiSymbol size={10} color="currentColor" />
            {formatFluxValue(part.partValue)}
          </p>
        </div>
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="text-[9px] font-mono uppercase tracking-[0.16em]" style={APP3_TEXT_SECONDARY_STYLE}>Status</p>
          <p className="mt-2 font-mono font-bold text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
            {part.isLocked ? 'Locked' : 'Ready'}
          </p>
        </div>
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="text-[9px] font-mono uppercase tracking-[0.16em]" style={APP3_TEXT_SECONDARY_STYLE}>Source</p>
          <p className="mt-2 font-mono font-bold text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
            {formatPartSource(part.source)}
          </p>
        </div>
      </div>

      {showMeta && (
        <div className="mt-3 p-3 text-[10px] font-mono uppercase tracking-[0.16em]" style={{ ...APP3_INSET_STYLE, ...APP3_TEXT_MUTED_STYLE }}>
          <div className="flex items-center justify-between gap-3">
            <span>Render Key</span>
            <span>{formatMetadataKey(part.illustration?.key ?? part.slot)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Slot Key</span>
            <span>{formatMetadataKey(part.slot)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Auction Status</span>
            <span>{canSendToAuction ? 'Eligible' : part.isLocked ? 'Locked' : 'Below Min'}</span>
          </div>
          {receivedAt && (
            <div className="mt-2 flex items-center justify-between gap-3">
              <span>Received</span>
              <span>{receivedAt}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowMeta((current) => !current)}
          className="py-2 text-[10px] font-mono font-semibold uppercase tracking-wider"
          style={APP3_SECONDARY_BUTTON_STYLE}
        >
          {showMeta ? 'Hide Intel' : 'View Intel'}
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

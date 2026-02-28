import { useState } from 'react';
import { Flame, Gauge, Shield } from 'lucide-react';
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

const ATTRIBUTE_ICONS = [Flame, Gauge, Shield] as const;

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
  const canSendToAuction = Boolean(onSendToAuction) && !part.isLocked && !part.isEquipped && part.rarityTierId >= AUCTION_MIN_RARITY_TIER;
  const rarityCfg = getRarityConfig(part.rarity);
  const receivedAt = formatReceivedAt(part.createdAt);
  const slotKeyLabel = formatMetadataKey(part.slot);
  const renderKeyLabel = formatMetadataKey(part.illustration?.key ?? part.slot);
  const showRenderKeyPill = renderKeyLabel !== slotKeyLabel;
  const partStatus = part.isLocked ? 'Locked' : part.isEquipped ? 'Equipped' : 'Ready';
  const partStatusStyle = part.isLocked
    ? { background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.22)' }
    : part.isEquipped
      ? { background: 'rgba(59,130,246,0.08)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.24)' }
      : { background: 'rgba(34,197,94,0.08)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.22)' };
  const auctionStatus = canSendToAuction ? 'Eligible' : part.isLocked ? 'Locked' : part.isEquipped ? 'Equipped' : 'Below Min';

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
              {slotKeyLabel}
            </span>
            {showRenderKeyPill && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                style={{ background: rarityCfg.bg, color: rarityCfg.color, border: `1px solid ${rarityCfg.border}` }}
              >
                {renderKeyLabel}
              </span>
            )}
            {part.isEquipped && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                style={{ background: 'rgba(59,130,246,0.08)', color: '#93C5FD', border: '1px solid rgba(59,130,246,0.24)' }}
              >
                Equipped
              </span>
            )}
            {part.isShiny && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                style={{ background: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.28)' }}
              >
                Shiny
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {part.attributes.map((value, index) => {
          const Icon = ATTRIBUTE_ICONS[index] ?? Gauge;

          return (
            <div key={part.attributeNames[index]} className="p-2" style={{ ...APP3_INSET_STYLE, borderTop: `1px solid ${rarityCfg.border}` }}>
              <div className="flex items-center gap-1.5">
                <Icon size={11} style={{ color: rarityCfg.color }} />
                <p className="text-[9px] font-mono uppercase tracking-[0.16em]" style={APP3_TEXT_SECONDARY_STYLE}>
                  {part.attributeNames[index]}
                </p>
              </div>
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
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="text-[9px] font-mono uppercase tracking-[0.16em]" style={APP3_TEXT_SECONDARY_STYLE}>Total Power</p>
          <p className="mt-2 font-mono font-bold text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
            {part.totalPower}
          </p>
        </div>
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="text-[9px] font-mono uppercase tracking-[0.16em]" style={APP3_TEXT_SECONDARY_STYLE}>Value</p>
          <p className="mt-2 flex items-center gap-1 font-mono font-bold text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
            <PhiSymbol size={10} color="currentColor" />
            {formatFluxValue(part.partValue)}
          </p>
        </div>
        <div className="p-2" style={APP3_INSET_STYLE}>
          <p className="text-[9px] font-mono uppercase tracking-[0.16em]" style={APP3_TEXT_SECONDARY_STYLE}>Status</p>
          <p
            className="mt-2 inline-flex rounded-full px-2 py-0.5 font-mono font-bold text-[10px] uppercase tracking-[0.16em]"
            style={partStatusStyle}
          >
            {partStatus}
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
            <span>{slotKeyLabel}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Serial</span>
            <span>#{part.serialNumber.toString().padStart(6, '0')}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Serial Trait</span>
            <span>{part.serialTrait}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Condition</span>
            <span>{part.conditionPct}%</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Origin</span>
            <span>{formatPartSource(part.source)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>Auction Status</span>
            <span>{auctionStatus}</span>
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
          {part.isLocked ? 'Locked' : part.isEquipped ? 'Equipped' : 'Send to Auction'}
        </button>
      </div>
    </div>
  );
}

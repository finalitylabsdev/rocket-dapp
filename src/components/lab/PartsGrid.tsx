import { X } from 'lucide-react';
import RarityBadge, { getRarityConfig } from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';
import { SectionIllustration } from './PartIllustrations';
import { getPreviewActionButtonProps, runPreviewGuardedAction } from '../../lib/launchPreview';
import { type RocketLabSlotView, type RocketLabSlots } from './rocketLabAdapter';
import { ROCKET_SECTIONS, type InventoryPart, type RocketSection } from '../../types/domain';
import { estimateRepairCost, getEffectivePartPower, getPartConditionPct } from '../../lib/rocketLab';

interface PartsGridProps {
  slots: RocketLabSlots;
  isSyncing: boolean;
  readOnly?: boolean;
  disabled: boolean;
  actionKey: string | null;
  onEquip: (partId: string, section: RocketSection) => void;
  onUnequip: (section: RocketSection) => void;
  onRepair: (partId: string) => void;
}

function formatFlux(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getSlotSummary(slot: RocketLabSlotView) {
  if (slot.equippedPart) {
    return {
      label: 'Equipped',
      border: slot.equippedPart ? getRarityConfig(slot.equippedPart.rarity).color : '#4ADE80',
      accent: slot.equippedPart ? getRarityConfig(slot.equippedPart.rarity).bg : 'rgba(74,222,128,0.08)',
      copy: 'The server loadout for this slot is active and will be used for launches.',
    };
  }

  if (slot.ownedParts.length > 0) {
    return {
      label: 'Unassigned',
      border: '#F59E0B',
      accent: 'rgba(245,158,11,0.08)',
      copy: slot.equipableCount > 0
        ? 'Select one owned part to equip this slot.'
        : 'Only locked or broken parts are available here right now.',
    };
  }

  return {
    label: 'Empty',
    border: 'var(--color-border-subtle)',
    accent: 'var(--color-bg-base)',
    copy: slot.description,
  };
}

function PartActions({
  part,
  section,
  readOnly,
  disabled,
  actionKey,
  onEquip,
  onRepair,
}: {
  part: InventoryPart;
  section: RocketSection;
  readOnly: boolean;
  disabled: boolean;
  actionKey: string | null;
  onEquip: (partId: string, section: RocketSection) => void;
  onRepair: (partId: string) => void;
}) {
  const conditionPct = getPartConditionPct(part);
  const repairCost = estimateRepairCost(part);
  const isBusy = (key: string) => disabled || actionKey === key;
  const equipAction = readOnly && !part.isLocked && conditionPct > 0
    ? getPreviewActionButtonProps('rocketEquip')
    : {
        disabled: part.isLocked || conditionPct <= 0 || isBusy(`equip:${part.id}`),
        'aria-disabled': part.isLocked || conditionPct <= 0 || isBusy(`equip:${part.id}`),
        title: undefined,
        'data-click-denied': undefined as 'true' | undefined,
      };
  const repairAction = readOnly && !part.isLocked && repairCost > 0
    ? getPreviewActionButtonProps('rocketRepair')
    : {
        disabled: part.isLocked || repairCost <= 0 || isBusy(`repair:${part.id}`),
        'aria-disabled': part.isLocked || repairCost <= 0 || isBusy(`repair:${part.id}`),
        title: undefined,
        'data-click-denied': undefined as 'true' | undefined,
      };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {!part.isEquipped && (
        <button
          onClick={runPreviewGuardedAction('rocketEquip', () => onEquip(part.id, section))}
          disabled={equipAction.disabled}
          aria-disabled={equipAction['aria-disabled']}
          title={equipAction.title}
          data-click-denied={equipAction['data-click-denied']}
          className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] disabled:opacity-50"
          style={{
            background: part.isLocked || conditionPct <= 0 ? 'var(--color-bg-card)' : 'rgba(249,115,22,0.12)',
            border: part.isLocked || conditionPct <= 0 ? '1px solid var(--color-border-subtle)' : '1px solid rgba(249,115,22,0.4)',
            color: part.isLocked || conditionPct <= 0 ? 'var(--color-text-muted)' : '#F97316',
          }}
        >
          {actionKey === `equip:${part.id}` ? 'Equipping…' : 'Equip'}
        </button>
      )}

      {conditionPct < 100 && (
        <button
          onClick={runPreviewGuardedAction('rocketRepair', () => onRepair(part.id))}
          disabled={repairAction.disabled}
          aria-disabled={repairAction['aria-disabled']}
          title={repairAction.title}
          data-click-denied={repairAction['data-click-denied']}
          className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.16em] disabled:opacity-50"
          style={{
            background: repairCost <= 0 ? 'var(--color-bg-card)' : 'rgba(34,197,94,0.10)',
            border: repairCost <= 0 ? '1px solid var(--color-border-subtle)' : '1px solid rgba(34,197,94,0.35)',
            color: repairCost <= 0 ? 'var(--color-text-muted)' : '#22C55E',
          }}
        >
          {actionKey === `repair:${part.id}` ? 'Repairing…' : `Repair ${formatFlux(repairCost)}`}
        </button>
      )}
    </div>
  );
}

function PartRow({
  part,
  section,
  readOnly,
  disabled,
  actionKey,
  onEquip,
  onUnequip,
  onRepair,
}: {
  part: InventoryPart;
  section: RocketSection;
  readOnly: boolean;
  disabled: boolean;
  actionKey: string | null;
  onEquip: (partId: string, section: RocketSection) => void;
  onUnequip: (section: RocketSection) => void;
  onRepair: (partId: string) => void;
}) {
  const conditionPct = getPartConditionPct(part);
  const effectivePower = getEffectivePartPower(part);
  const isBusy = disabled || actionKey === `unequip:${section}`;
  const unequipAction = readOnly
    ? getPreviewActionButtonProps('rocketUnequip')
    : {
        disabled: isBusy,
        'aria-disabled': isBusy,
        title: undefined as string | undefined,
        'data-click-denied': undefined as 'true' | undefined,
      };

  return (
    <div
      className="overflow-hidden"
      style={{
        background: part.isEquipped ? 'var(--color-bg-inset)' : 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono font-bold text-sm leading-tight text-text-primary">
              {part.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {part.isEquipped && (
                <span
                  className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.16em]"
                  style={{ background: 'rgba(74,222,128,0.12)', color: '#4ADE80' }}
                >
                  Equipped
                </span>
              )}
              {part.isLocked && (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-amber-400">
                  Locked
                </span>
              )}
              {part.isShiny && (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.16em] text-yellow-300">
                  Shiny
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.16em] leading-relaxed text-text-muted">
              Serial {part.serialNumber ?? 'Pending'} · {part.serialTrait ?? 'Standard'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RarityBadge tier={part.rarity} size="xs" showIcon={part.isEquipped} />
            {part.isEquipped && (
              <button
                onClick={runPreviewGuardedAction('rocketUnequip', () => onUnequip(section))}
                disabled={unequipAction.disabled}
                aria-disabled={unequipAction['aria-disabled']}
                title={unequipAction.title ?? 'Unequip'}
                data-click-denied={unequipAction['data-click-denied']}
                className="flex items-center justify-center w-6 h-6 disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                <X size={12} style={{ color: '#EF4444' }} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[72px_1fr] gap-3">
          <div
            className="flex aspect-square w-[72px] shrink-0 items-center justify-center overflow-hidden"
            style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
          >
            <SectionIllustration
              section={section}
              equipped={Boolean(part.isEquipped)}
              rarity={part.rarity}
              variantId={part.variantId}
              size={64}
            />
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div
                className="px-2.5 py-2"
                style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">Power</p>
                <p className="mt-1 font-mono font-bold text-sm text-text-primary">
                  {effectivePower}
                  {conditionPct < 100 && (
                    <span className="ml-1 text-[10px] text-text-muted">/ {part.power}</span>
                  )}
                </p>
              </div>
              <div
                className="px-2.5 py-2"
                style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">Value</p>
                <p className="mt-1 flex items-center gap-1 font-mono font-bold text-sm text-text-primary">
                  <PhiSymbol size={10} color="currentColor" />
                  {part.partValue}
                </p>
              </div>
            </div>

            <div
              className="px-2.5 py-2"
              style={{ background: 'var(--color-bg-base)', border: '1px solid var(--color-border-subtle)' }}
            >
              <div className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em]">
                <span className="text-text-muted">Condition</span>
                <span className={conditionPct > 0 ? 'text-text-primary' : 'text-red-400'}>
                  {conditionPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1 overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                <div
                  className="h-full"
                  style={{
                    width: `${conditionPct}%`,
                    background: conditionPct > 50
                      ? 'linear-gradient(90deg, rgba(34,197,94,0.45), #22C55E)'
                      : conditionPct > 0
                        ? 'linear-gradient(90deg, rgba(245,158,11,0.4), #F59E0B)'
                        : 'linear-gradient(90deg, rgba(239,68,68,0.4), #EF4444)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <PartActions
          part={part}
          section={section}
          readOnly={readOnly}
          disabled={disabled}
          actionKey={actionKey}
          onEquip={onEquip}
          onRepair={onRepair}
        />
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  readOnly,
  disabled,
  actionKey,
  onEquip,
  onUnequip,
  onRepair,
}: {
  slot: RocketLabSlotView;
  readOnly: boolean;
  disabled: boolean;
  actionKey: string | null;
  onEquip: (partId: string, section: RocketSection) => void;
  onUnequip: (section: RocketSection) => void;
  onRepair: (partId: string) => void;
}) {
  const summary = getSlotSummary(slot);

  return (
    <div
      className="relative self-start overflow-hidden"
      style={{
        background: 'var(--color-bg-base)',
        border: `1px solid ${summary.border}`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${summary.border}, transparent)` }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono font-bold text-[11px] uppercase tracking-[0.16em] text-text-muted">
              {slot.displayName}
            </p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-text-secondary">{summary.copy}</p>
          </div>
          <span
            className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.16em]"
            style={{ background: summary.accent, color: summary.border }}
          >
            {summary.label}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-text-muted">
          <span>{slot.ownedParts.length} owned</span>
          <span>{slot.equipableCount} ready</span>
          <span>{slot.brokenCount} broken</span>
          <span>{slot.lockedCount} locked</span>
        </div>

        <div className="mt-4 space-y-3">
          {slot.ownedParts.length === 0 ? (
            <div
              className="px-3 py-4 text-center text-xs font-mono text-text-muted"
              style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
            >
              No parts owned for this rocket section yet.
            </div>
          ) : (
            slot.ownedParts.map((part) => (
              <PartRow
                key={part.id}
                part={part}
                section={slot.section}
                readOnly={readOnly}
                disabled={disabled}
                actionKey={actionKey}
                onEquip={onEquip}
                onUnequip={onUnequip}
                onRepair={onRepair}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function PartsGrid({
  slots,
  isSyncing,
  readOnly = false,
  disabled,
  actionKey,
  onEquip,
  onUnequip,
  onRepair,
}: PartsGridProps) {
  const equippedCount = ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].equippedPart ? 1 : 0),
    0,
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono font-bold text-base uppercase tracking-wider text-text-primary">
            Rocket Loadout
          </p>
          <p className="mt-0.5 text-xs font-mono text-text-muted">
            {readOnly
              ? `${equippedCount}/${ROCKET_SECTIONS.length} sections equipped in the sample preview loadout`
              : isSyncing
              ? 'Refreshing server inventory…'
              : `${equippedCount}/${ROCKET_SECTIONS.length} sections equipped and ready for launch management`}
          </p>
        </div>
        <span className="tag text-[10px]">{readOnly ? 'Sample Loadout' : 'Server Loadout'}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 items-start gap-4">
        {ROCKET_SECTIONS.map((section) => (
          <SlotCard
            key={section}
            slot={slots[section]}
            readOnly={readOnly}
            disabled={disabled}
            actionKey={actionKey}
            onEquip={onEquip}
            onUnequip={onUnequip}
            onRepair={onRepair}
          />
        ))}
      </div>
    </div>
  );
}

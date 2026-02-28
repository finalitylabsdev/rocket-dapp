import RarityBadge, { getRarityConfig } from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';
import { SectionIllustration } from './PartIllustrations';
import { type RocketLabSlotView, type RocketLabSlots } from './rocketLabAdapter';
import { ROCKET_SECTIONS, type RocketSection } from '../../types/domain';

interface PartsGridProps {
  slots: RocketLabSlots;
  isSyncing: boolean;
  loadoutError?: string | null;
  onSelectPart: (section: RocketSection, partId: string | null) => void;
}

function getSlotStatusCopy(slot: RocketLabSlotView) {
  if (slot.status === 'ready') {
    return {
      label: 'Equipped',
      summary: 'This saved part is armed for the next launch.',
      border: slot.part ? getRarityConfig(slot.part.rarity).color : '#4ADE80',
      accent: slot.part ? getRarityConfig(slot.part.rarity).bg : 'rgba(74,222,128,0.08)',
      text: slot.part ? getRarityConfig(slot.part.rarity).color : '#4ADE80',
    };
  }

  if (slot.status === 'locked') {
    const hasReplacement = slot.availableCount > 0;
    return {
      label: 'Locked',
      summary: slot.part?.isEquipped
        ? hasReplacement
          ? 'The saved part is locked. Equip an unlocked replacement to restore this slot.'
          : 'The saved part is locked and no unlocked replacement is available yet.'
        : 'Only locked inventory exists for this slot right now.',
      border: '#F59E0B',
      accent: 'rgba(245,158,11,0.08)',
      text: '#F59E0B',
    };
  }

  if (slot.status === 'unassigned') {
    return {
      label: 'Unassigned',
      summary: 'Choose one unlocked part to add this slot to the saved launch loadout.',
      border: '#38BDF8',
      accent: 'rgba(56,189,248,0.08)',
      text: '#38BDF8',
    };
  }

  return {
    label: 'Missing',
    summary: 'No owned part is available for this canonical slot yet.',
    border: 'var(--color-border-subtle)',
    accent: 'var(--color-bg-base)',
    text: 'var(--color-text-muted)',
  };
}

function formatPartOptionLabel(slot: RocketLabSlotView, partId: string) {
  const candidate = slot.availableParts.find((part) => part.id === partId);
  if (!candidate) {
    return 'Unknown Part';
  }

  return `${candidate.name} · P${candidate.power} · ${candidate.partValue.toFixed(2)} FLUX`;
}

function getSelectedValue(slot: RocketLabSlotView) {
  if (!slot.part || slot.part.isLocked) {
    return '';
  }

  return slot.availableParts.some((candidate) => candidate.id === slot.part?.id)
    ? slot.part.id
    : '';
}

function SlotCard({
  slot,
  isSyncing,
  onSelectPart,
}: {
  slot: RocketLabSlotView;
  isSyncing: boolean;
  onSelectPart: (section: RocketSection, partId: string | null) => void;
}) {
  const status = getSlotStatusCopy(slot);
  const part = slot.part;
  const rarity = part?.rarity ?? 'Common';
  const selectedValue = getSelectedValue(slot);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: slot.status === 'ready' ? 'var(--color-bg-inset)' : 'var(--color-bg-base)',
        border: `1px solid ${status.border}`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${status.border}, transparent)` }}
      />

      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-mono font-bold text-[11px] uppercase tracking-[0.16em] text-text-muted">
              {slot.displayName}
            </p>
            <p className="mt-1 font-mono font-bold text-sm leading-tight text-text-primary">
              {slot.part?.name ?? 'Slot Unfilled'}
            </p>
          </div>
          {part ? (
            <RarityBadge tier={rarity} size="xs" showIcon={slot.status === 'ready'} />
          ) : (
            <span
              className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-muted)',
              }}
            >
              Empty
            </span>
          )}
        </div>

        <div
          className="mb-3 flex items-center justify-center"
          style={{
            background: status.accent,
            border: `1px solid ${slot.status === 'missing' ? 'var(--color-border-subtle)' : status.border}`,
          }}
        >
          <SectionIllustration
            section={slot.section}
            equipped={slot.status === 'ready'}
            rarity={rarity}
            size={72}
          />
        </div>

        <div
          className="mb-3 px-2.5 py-2"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: status.text }}>
              {status.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              {slot.availableCount} open / {slot.lockedCount} locked
            </span>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed font-mono text-text-muted">
            {status.summary}
          </p>
        </div>

        {slot.availableParts.length > 0 && (
          <div
            className="mb-3 px-2.5 py-2"
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                Slot Assignment
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
                {slot.availableParts.length} selectable
              </span>
            </div>
            <select
              value={selectedValue}
              disabled={isSyncing}
              onChange={(event) => {
                const nextPartId = event.target.value.trim();
                onSelectPart(slot.section, nextPartId.length > 0 ? nextPartId : null);
              }}
              className="mt-2 w-full bg-transparent px-2.5 py-2 font-mono text-[11px] text-text-primary disabled:opacity-60"
              style={{
                border: '1px solid var(--color-border-subtle)',
                background: 'var(--color-bg-base)',
              }}
            >
              <option value="">
                {slot.status === 'ready' ? 'Unequip this slot' : 'Select an unlocked part'}
              </option>
              {slot.availableParts.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {formatPartOptionLabel(slot, candidate.id)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[10px] leading-relaxed font-mono text-text-muted">
              Launches only use parts saved here. Locked parts cannot be equipped.
            </p>
          </div>
        )}

        {part ? (
          <>
            <div className="space-y-2">
              {part.attributes.map((value, index) => (
                <div key={`${part.id}-${part.attributeNames[index]}`}>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
                    <span className="text-text-muted">{part.attributeNames[index]}</span>
                    <span className="text-text-primary">{value}</span>
                  </div>
                  <div className="h-1 overflow-hidden" style={{ background: 'var(--color-border-subtle)' }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${value}%`,
                        background: slot.status === 'ready'
                          ? `linear-gradient(90deg, ${status.border}66, ${status.border})`
                          : 'linear-gradient(90deg, rgba(245,158,11,0.28), rgba(245,158,11,0.72))',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div
                className="px-2.5 py-2"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">Power</p>
                <p className="mt-1 font-mono font-bold text-sm text-text-primary">{part.power}</p>
              </div>
              <div
                className="px-2.5 py-2"
                style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">Part Value</p>
                <p className="mt-1 flex items-center gap-1 font-mono font-bold text-sm text-text-primary">
                  <PhiSymbol size={10} color="currentColor" />
                  {part.partValue}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[10px] leading-relaxed font-mono text-text-muted">
            {slot.description}
          </p>
        )}
      </div>
    </div>
  );
}

export default function PartsGrid({ slots, isSyncing, loadoutError = null, onSelectPart }: PartsGridProps) {
  const readyCount = ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].status === 'ready' ? 1 : 0),
    0,
  );
  const lockedCount = ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].status === 'locked' ? 1 : 0),
    0,
  );
  const unassignedCount = ROCKET_SECTIONS.reduce(
    (count, section) => count + (slots[section].status === 'unassigned' ? 1 : 0),
    0,
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono font-bold text-base uppercase tracking-wider text-text-primary">
            Saved Rocket Loadout
          </p>
          <p className="mt-0.5 text-xs font-mono text-text-muted">
            {isSyncing
              ? 'Saving slot assignments…'
              : `${readyCount}/${ROCKET_SECTIONS.length} equipped · ${unassignedCount} unassigned · ${lockedCount} locked`}
          </p>
        </div>
        <span className="tag text-[10px]">Editable</span>
      </div>

      {loadoutError && (
        <div
          className="mb-4 px-3 py-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <p className="text-xs font-mono text-red-400">{loadoutError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {ROCKET_SECTIONS.map((section) => (
          <SlotCard
            key={section}
            slot={slots[section]}
            isSyncing={isSyncing}
            onSelectPart={onSelectPart}
          />
        ))}
      </div>
    </div>
  );
}

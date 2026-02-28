import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import RarityBadge, { getRarityConfig } from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';
import { useGameState } from '../../context/GameState';
import { useWallet } from '../../hooks/useWallet';
import { getPreviewActionButtonProps, runPreviewGuardedAction } from '../../lib/launchPreview';
import { formatStarVaultError, openMysteryBox } from '../../lib/starVault';
import type { BoxTierConfig, InventoryPart } from '../../types/domain';
import BoxIllustration, { type BoxAnimationState } from './BoxIllustration';
import { SectionGlyph } from './metadataVisuals';
import {
  APP3_INSET_STYLE,
  APP3_PANEL_STYLE,
  APP3_SECONDARY_BUTTON_STYLE,
  APP3_TEXT_PRIMARY_STYLE,
  APP3_TEXT_SECONDARY_STYLE,
  APP3_TRACK_STYLE,
  formatFluxValue,
} from './ui';

const SHAKE_MS = 350;
const CRACK_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatMetadataKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toUpperCase();
}

function AttributeBars({ part }: { part: InventoryPart }) {
  return (
    <div className="space-y-2 mt-3">
      {part.attributes.map((value, index) => (
        <div key={part.attributeNames[index]}>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
            <span style={APP3_TEXT_SECONDARY_STYLE}>{part.attributeNames[index]}</span>
            <span style={APP3_TEXT_PRIMARY_STYLE}>{value}</span>
          </div>
          <div className="h-1.5 overflow-hidden" style={APP3_TRACK_STYLE}>
            <div
              className="h-full"
              style={{
                width: `${value}%`,
                background: 'linear-gradient(90deg, #F6C547, #F59E0B)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface BoxCardProps {
  tier: BoxTierConfig;
  readOnly?: boolean;
  previewReward?: InventoryPart | null;
}

export default function BoxCard({
  tier,
  readOnly = false,
  previewReward = null,
}: BoxCardProps) {
  const wallet = useWallet();
  const game = useGameState();
  const [state, setState] = useState<BoxAnimationState>(() => (readOnly && previewReward ? 'revealed' : 'idle'));
  const [reward, setReward] = useState<InventoryPart | null>(() => previewReward);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cfg = getRarityConfig(tier.rarity);
  const revealCfg = reward ? getRarityConfig(reward.rarity) : cfg;
  const canOpenAnother = Boolean(wallet.address) && game.fluxBalance >= tier.price && !wallet.isConnecting && !isSubmitting;
  const openAction = readOnly
    ? getPreviewActionButtonProps('boxOpen')
    : {
        disabled: isSubmitting || wallet.isConnecting,
        'aria-disabled': isSubmitting || wallet.isConnecting,
        title: undefined,
        'data-click-denied': undefined as 'true' | undefined,
      };

  useEffect(() => {
    if (!readOnly) {
      return;
    }

    setReward(previewReward);
    setState(previewReward ? 'revealed' : 'idle');
    setError(null);
  }, [previewReward, readOnly]);

  const handleOpen = async () => {
    if (readOnly || isSubmitting || wallet.isConnecting) {
      return;
    }

    setError(null);

    if (!wallet.address) {
      await wallet.connect();
      return;
    }

    setReward(null);
    setIsSubmitting(true);
    setState('shaking');

    try {
      const openPromise = openMysteryBox(wallet.address, tier.id);

      await sleep(SHAKE_MS);
      setState('cracking');

      const [result] = await Promise.all([
        openPromise,
        sleep(CRACK_MS),
      ]);

      const nextInventory = [
        result.part,
        ...game.inventory.filter((part) => part.id !== result.part.id),
      ];

      game.applyServerSnapshot({
        balance: result.balance,
        inventory: nextInventory,
      });
      void game.refreshInventory();

      setReward(result.part);
      setState('revealed');
    } catch (nextError) {
      setError(formatStarVaultError(nextError, 'Failed to open box.'));
      setReward(null);
      setState('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setState('idle');
    setReward(null);
    setError(null);
  };

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        ...APP3_PANEL_STYLE,
        border: `1px solid ${state === 'revealed' ? `${revealCfg.color}66` : cfg.border}`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${(state === 'revealed' ? revealCfg : cfg).color}80, transparent)` }}
      />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4 gap-3 min-h-[7.5rem]">
          <div>
            <RarityBadge tier={tier.rarity} />
            <h3
              className="mt-2 font-mono font-black text-lg leading-none uppercase tracking-wider"
              style={{ color: state === 'revealed' ? revealCfg.color : 'var(--color-text-primary)' }}
            >
              {tier.name}
            </h3>
            <p className="text-[11px] mt-1 font-mono text-text-muted">
              {tier.tagline}
            </p>
            <p
              className="text-[9px] mt-2 font-mono uppercase tracking-[0.18em]"
              style={state === 'revealed' ? { color: revealCfg.color } : APP3_TEXT_SECONDARY_STYLE}
            >
              Catalog Key {formatMetadataKey(tier.illustration?.key ?? tier.id)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <PhiSymbol size={15} color={cfg.color} />
              <span className="font-mono font-black text-xl" style={APP3_TEXT_PRIMARY_STYLE}>
                {formatFluxValue(tier.price)}
              </span>
            </div>
            <p className="text-[10px] mt-0.5 font-mono uppercase text-text-muted">Φ</p>
          </div>
        </div>

        <div className="flex items-center justify-center py-3 mb-4">
          <BoxIllustration
            rarity={tier.rarity}
            state={state}
            asset={tier.illustration}
            fallbackKey={tier.id}
            label={tier.name}
          />
        </div>

        {reward ? (
          <div
            className="mb-4 p-4"
            style={{
              background: getRarityConfig(reward.rarity).bg,
              border: `1px solid ${getRarityConfig(reward.rarity).border}`,
            }}
          >
            <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
              {readOnly ? 'Preview Reveal' : 'You Received'}
            </p>
            <div className="mt-3 flex items-start gap-3">
              <SectionGlyph asset={reward.illustration} fallbackKey={reward.slot} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-mono font-black text-lg uppercase" style={{ color: getRarityConfig(reward.rarity).color }}>
                  {reward.name}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <RarityBadge tier={reward.rarity} size="xs" />
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                    style={{ background: 'rgba(15,23,42,0.65)', color: '#E2E8F0', border: '1px solid rgba(148,163,184,0.2)' }}
                  >
                    {reward.sectionName}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                    style={{ background: 'rgba(15,23,42,0.52)', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.16)' }}
                  >
                    {formatMetadataKey(reward.illustration?.key ?? reward.slot)}
                  </span>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                    style={{ background: 'rgba(15,23,42,0.58)', color: '#E2E8F0', border: '1px solid rgba(148,163,184,0.18)' }}
                  >
                    #{(reward.serialNumber ?? 0).toString().padStart(6, '0')}
                  </span>
                  {reward.isShiny && (
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-[0.16em]"
                      style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.28)' }}
                    >
                      Shiny
                    </span>
                  )}
                </div>
              </div>
            </div>
            <AttributeBars part={reward} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-xl px-3 py-2" style={APP3_INSET_STYLE}>
                <span style={APP3_TEXT_SECONDARY_STYLE}>Total Power</span>
                <p className="mt-1 font-mono font-black text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
                  {reward.totalPower}
                </p>
              </div>
              <div className="rounded-xl px-3 py-2" style={APP3_INSET_STYLE}>
                <span style={APP3_TEXT_SECONDARY_STYLE}>Serial Trait</span>
                <p className="mt-1 font-mono font-black text-sm" style={APP3_TEXT_PRIMARY_STYLE}>
                  {reward.serialTrait}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex-1">
            <p className="text-[10px] font-mono font-bold mb-2 uppercase tracking-widest text-text-muted">
              Possible Drops
            </p>
            {tier.rewards.length === 0 ? (
              <div className="p-3 text-[11px] font-mono" style={{ ...APP3_INSET_STYLE, ...APP3_TEXT_SECONDARY_STYLE }}>
                Reward metadata is unavailable for this box tier.
              </div>
            ) : (
              <div className="space-y-2">
                {tier.rewards.map((rewardLabel) => (
                  <div key={rewardLabel} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 shrink-0 flex items-center justify-center"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      <div className="h-1 w-1" style={{ background: cfg.color }} />
                    </div>
                    <span className="text-[11px] font-mono text-text-secondary">
                      {rewardLabel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tier.possible.length === 0 ? (
          <div className="mb-4 p-3 text-[11px] font-mono" style={{ ...APP3_INSET_STYLE, ...APP3_TEXT_SECONDARY_STYLE }}>
            Drop intel is unavailable until catalog metadata syncs.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {tier.possible.map((item) => (
              <div key={item.label} className="p-2 text-center" style={APP3_INSET_STYLE}>
                <p className="font-mono font-bold text-xs text-text-primary">{item.value}</p>
                <p className="text-[9px] font-mono mt-0.5 uppercase text-text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {readOnly ? (
          <button
            onClick={runPreviewGuardedAction('boxOpen', () => void handleOpen())}
            disabled={openAction.disabled}
            aria-disabled={openAction['aria-disabled']}
            title={openAction.title}
            data-click-denied={openAction['data-click-denied']}
            className="w-full py-3 font-mono font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-wider"
            style={APP3_SECONDARY_BUTTON_STYLE}
          >
            {reward ? 'Preview Locked' : 'Open Box'}
          </button>
        ) : reward ? (
          <button
            onClick={canOpenAnother ? () => void handleOpen() : handleReset}
            className="w-full py-3 font-mono font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-wider"
            style={canOpenAnother
              ? {
                background: `${cfg.color}14`,
                color: cfg.color,
                border: `1px solid ${cfg.border}`,
              }
              : APP3_SECONDARY_BUTTON_STYLE}
          >
            <RotateCcw size={13} />
            {canOpenAnother ? 'Open Another' : 'Back to Box'}
          </button>
        ) : (
          <button
            onClick={() => void handleOpen()}
            disabled={isSubmitting || wallet.isConnecting}
            className="w-full py-3 font-mono font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'transparent',
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            {wallet.address ? (
              isSubmitting ? 'Opening...' : (
                <>
                  <PhiSymbol size={13} color="currentColor" />
                  Open Box
                </>
              )
            ) : (
              wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'
            )}
          </button>
        )}

        {error && (
          <p className="text-center text-xs mt-2 font-mono font-semibold" style={{ color: '#EF4444' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import RarityBadge, { getRarityConfig } from '../brand/RarityBadge';
import PhiSymbol from '../brand/PhiSymbol';
import { useGameState } from '../../context/GameState';
import { useWallet } from '../../hooks/useWallet';
import { formatStarVaultError, openMysteryBox } from '../../lib/starVault';
import type { BoxTierConfig, InventoryPart } from '../../types/domain';
import BoxIllustration, { type BoxAnimationState } from './BoxIllustration';

const SHAKE_MS = 350;
const CRACK_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatFluxValue(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

function AttributeBars({ part }: { part: InventoryPart }) {
  return (
    <div className="space-y-2 mt-3">
      {part.attributes.map((value, index) => (
        <div key={part.attributeNames[index]}>
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-1">
            <span style={{ color: 'var(--color-text-secondary)' }}>{part.attributeNames[index]}</span>
            <span style={{ color: 'var(--color-text-primary)' }}>{value}</span>
          </div>
          <div className="h-1.5 overflow-hidden" style={{ background: 'var(--color-bg-inset)', border: '1px solid var(--color-border-subtle)' }}>
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

export default function BoxCard({ tier }: { tier: BoxTierConfig }) {
  const wallet = useWallet();
  const game = useGameState();
  const [state, setState] = useState<BoxAnimationState>('idle');
  const [reward, setReward] = useState<InventoryPart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cfg = getRarityConfig(tier.rarity);

  const handleOpen = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);

    if (!wallet.address) {
      await wallet.connect();
      return;
    }

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
        background: 'var(--color-bg-base)',
        border: `1px solid ${state === 'revealed' ? `${cfg.color}66` : cfg.border}`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}80, transparent)` }}
      />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <RarityBadge tier={tier.rarity} />
            <h3 className="mt-2 font-mono font-black text-lg leading-none uppercase tracking-wider text-text-primary">
              {tier.name}
            </h3>
            <p className="text-[11px] mt-1 font-mono text-text-muted">
              {tier.tagline}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <PhiSymbol size={15} color={cfg.color} />
              <span className="font-mono font-black text-xl text-text-primary">
                {formatFluxValue(tier.price)}
              </span>
            </div>
            <p className="text-[10px] mt-0.5 font-mono uppercase text-text-muted">FLUX</p>
          </div>
        </div>

        <div className="flex items-center justify-center py-3 mb-4">
          <BoxIllustration rarity={tier.rarity} state={state} />
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
              You Received
            </p>
            <p className="mt-2 font-mono font-black text-lg uppercase" style={{ color: getRarityConfig(reward.rarity).color }}>
              {reward.name}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <RarityBadge tier={reward.rarity} size="xs" />
              <span className="text-[10px] font-mono uppercase text-text-secondary">
                {reward.sectionName}
              </span>
            </div>
            <AttributeBars part={reward} />
            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span style={{ color: 'var(--color-text-secondary)' }}>Part Value</span>
              <span style={{ color: 'var(--color-text-primary)' }}>
                <PhiSymbol size={10} color="currentColor" /> {formatFluxValue(reward.partValue)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex-1">
            <p className="text-[10px] font-mono font-bold mb-2 uppercase tracking-widest text-text-muted">
              Possible Drops
            </p>
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
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          {tier.possible.map((item) => (
            <div key={item.label} className="p-2 text-center" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)' }}>
              <p className="font-mono font-bold text-xs text-text-primary">{item.value}</p>
              <p className="text-[9px] font-mono mt-0.5 uppercase text-text-muted">{item.label}</p>
            </div>
          ))}
        </div>

        {reward ? (
          <button
            onClick={handleReset}
            className="w-full py-3 font-mono font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-wider"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-secondary)' }}
          >
            <RotateCcw size={13} />
            Open Another
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

import { readBooleanEnv } from './env';

/**
 * Feature flags for staged rollout.
 *
 * Each flag reads a VITE_FLAG_* env var via the same boolean parsing used in
 * spec.ts.  All flags default to **true** so the app works unchanged without
 * any env vars set — disable a feature by setting its var to "false" / "0".
 */

export const STAR_VAULT_ENABLED = readBooleanEnv('VITE_FLAG_STAR_VAULT_ENABLED') ?? true;
export const NEBULA_BIDS_ENABLED = readBooleanEnv('VITE_FLAG_NEBULA_BIDS_ENABLED') ?? true;
export const ROCKET_LAB_ENABLED = readBooleanEnv('VITE_FLAG_ROCKET_LAB_ENABLED') ?? true;
export const DEX_ENABLED = readBooleanEnv('VITE_FLAG_DEX_ENABLED') ?? true;
export const FAUCET_ENABLED = readBooleanEnv('VITE_FLAG_FAUCET_ENABLED') ?? true;
export const AUCTION_SCHEDULER_ENABLED = readBooleanEnv('VITE_FLAG_AUCTION_SCHEDULER_ENABLED') ?? true;

export const PREVIEW_READ_ONLY_ENABLED = readBooleanEnv('VITE_FLAG_PREVIEW_READ_ONLY_ENABLED') ?? true;
export const LAUNCH_COUNTDOWN_ENABLED = readBooleanEnv('VITE_FLAG_LAUNCH_COUNTDOWN_ENABLED') ?? true;
export const LAUNCH_COUNTDOWN_TARGET_UTC_MS = Date.UTC(2026, 2, 3, 23, 11, 0);
export const CLICK_DENIED_TITLE = 'Operation not allowed in preview';

function readPreviewViewFlag(key: string, previewDefault: boolean): boolean {
  const override = readBooleanEnv(key);
  if (override !== null) {
    return override;
  }

  return PREVIEW_READ_ONLY_ENABLED ? previewDefault : false;
}

function readPreviewMutationFlag(key: string): boolean {
  const override = readBooleanEnv(key);
  if (override !== null) {
    return override;
  }

  return !PREVIEW_READ_ONLY_ENABLED;
}

export const PREVIEW_ALLOW_GATE_LOCK = readPreviewMutationFlag('VITE_FLAG_PREVIEW_ALLOW_GATE_LOCK');
export const PREVIEW_ALLOW_GATE_CLAIM = readPreviewMutationFlag('VITE_FLAG_PREVIEW_ALLOW_GATE_CLAIM');
export const PREVIEW_ALLOW_BOX_OPEN = readPreviewMutationFlag('VITE_FLAG_PREVIEW_ALLOW_BOX_OPEN');
export const PREVIEW_ALLOW_AUCTION_SUBMIT = readPreviewMutationFlag('VITE_FLAG_PREVIEW_ALLOW_AUCTION_SUBMIT');
export const PREVIEW_ALLOW_AUCTION_BID = readPreviewMutationFlag('VITE_FLAG_PREVIEW_ALLOW_AUCTION_BID');
export const PREVIEW_ALLOW_ROCKET_EQUIP = readPreviewMutationFlag('VITE_FLAG_PREVIEW_ALLOW_ROCKET_EQUIP');
export const PREVIEW_ALLOW_ROCKET_UNEQUIP = readPreviewMutationFlag('VITE_FLAG_PREVIEW_ALLOW_ROCKET_UNEQUIP');
export const PREVIEW_ALLOW_ROCKET_REPAIR = readPreviewMutationFlag('VITE_FLAG_PREVIEW_ALLOW_ROCKET_REPAIR');
export const PREVIEW_ALLOW_ROCKET_LAUNCH = readPreviewMutationFlag('VITE_FLAG_PREVIEW_ALLOW_ROCKET_LAUNCH');

export const PREVIEW_ALLOW_ANON_AUCTION_VIEW = readPreviewViewFlag('VITE_FLAG_PREVIEW_ALLOW_ANON_AUCTION_VIEW', true);
export const PREVIEW_SAMPLE_INVENTORY_ENABLED = readPreviewViewFlag('VITE_FLAG_PREVIEW_SAMPLE_INVENTORY_ENABLED', true);
export const PREVIEW_SAMPLE_BOX_REVEALS_ENABLED = readPreviewViewFlag('VITE_FLAG_PREVIEW_SAMPLE_BOX_REVEALS_ENABLED', true);
export const PREVIEW_SAMPLE_LAUNCH_HISTORY_ENABLED = readPreviewViewFlag('VITE_FLAG_PREVIEW_SAMPLE_LAUNCH_HISTORY_ENABLED', true);
export const PREVIEW_SAMPLE_FLUX_BALANCE = 1800;

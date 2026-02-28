import type { CSSProperties } from 'react';

export function formatFluxValue(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export function formatAuctionDurationLabel(seconds: number): string {
  const totalMinutes = Math.max(0, Math.round(seconds / 60));

  if (totalMinutes >= 60 && totalMinutes % 60 === 0) {
    return `${totalMinutes / 60}h`;
  }

  return `${totalMinutes}m`;
}

export function formatAuctionSerialNumber(serialNumber: number): string {
  const normalizedSerial = Math.max(0, Math.trunc(serialNumber));
  return normalizedSerial > 0 ? `#${normalizedSerial}` : 'Pending';
}

export const APP3_PANEL_STYLE: CSSProperties = {
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border-subtle)',
};

export const APP3_INSET_STYLE: CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-subtle)',
};

export const APP3_META_CHIP_STYLE: CSSProperties = {
  background: 'rgba(148,163,184,0.08)',
  border: '1px solid var(--color-border-subtle)',
  color: 'var(--color-text-secondary)',
};

export const APP3_SHINY_BADGE_STYLE: CSSProperties = {
  background: 'rgba(246,197,71,0.12)',
  border: '1px solid rgba(246,197,71,0.28)',
  color: '#F6C547',
};

export const APP3_TRACK_STYLE: CSSProperties = {
  background: 'var(--color-bg-inset)',
  border: '1px solid var(--color-border-subtle)',
};

export const APP3_TEXT_PRIMARY_STYLE: CSSProperties = {
  color: 'var(--color-text-primary)',
};

export const APP3_TEXT_SECONDARY_STYLE: CSSProperties = {
  color: 'var(--color-text-secondary)',
};

export const APP3_TEXT_MUTED_STYLE: CSSProperties = {
  color: 'var(--color-text-muted)',
};

export const APP3_CONTROL_STYLE: CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-subtle)',
  color: 'var(--color-text-primary)',
};

export const APP3_SECONDARY_BUTTON_STYLE: CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-default)',
  color: 'var(--color-text-secondary)',
};

import type { CSSProperties } from 'react';

export function formatFluxValue(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}

export const APP3_PANEL_STYLE: CSSProperties = {
  background: 'var(--color-bg-base)',
  border: '1px solid var(--color-border-subtle)',
};

export const APP3_INSET_STYLE: CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-subtle)',
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

export const WEB3_ONBOARD_MAINNET_CHAIN_ID = '0x1' as const;
export const WEB3_ONBOARD_MAINNET_CHAIN_DECIMAL = 1;

export function dismissWeb3OnboardModal(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const closeButton = document
    .querySelector('onboard-v2')
    ?.shadowRoot
    ?.querySelector('.close-button');

  if (closeButton instanceof HTMLElement) {
    closeButton.click();
  }
}

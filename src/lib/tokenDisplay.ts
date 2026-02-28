export const PHI_SYMBOL = 'Φ';

export function isPhiTokenSymbol(symbol: string): boolean {
  return symbol === 'FLUX' || symbol === 'Flux';
}

export function formatTokenSymbol(symbol: string): string {
  return isPhiTokenSymbol(symbol) ? PHI_SYMBOL : symbol;
}

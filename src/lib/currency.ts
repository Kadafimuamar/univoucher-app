// Amounts sent through the wallet are always integer strings in the coin's
// smallest unit, so we convert using the decimals reported by the wallet for
// the selected asset rather than a hardcoded constant.
export function uctToBaseUnits(amount: number, decimals: number): string {
  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 0;
  return String(Math.round(amount * 10 ** safeDecimals));
}

export function baseUnitsToUct(baseUnits: string | number, decimals: number): number {
  const safeDecimals = Number.isInteger(decimals) && decimals >= 0 ? decimals : 0;
  return Number(baseUnits) / 10 ** safeDecimals;
}

export function formatUct(amount: number): string {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} UCT`;
}

// Amounts sent through the wallet are always integer strings in the coin's
// smallest unit, so we convert using the decimals reported by the wallet for
// the selected asset rather than a hardcoded constant.
function normalizeDecimals(decimals: number): number {
  return Number.isInteger(decimals) && decimals >= 0 ? decimals : 0;
}

export function uctToBaseUnits(amount: number, decimals: number): string {
  const safeDecimals = normalizeDecimals(decimals);
  if (!Number.isFinite(amount)) {
    return '0';
  }

  const scaled = amount.toFixed(safeDecimals).replace('.', '');
  return scaled.replace(/^0+(?=\d)/, '') || '0';
}

export function baseUnitsToUct(baseUnits: string | number, decimals: number): number {
  const safeDecimals = normalizeDecimals(decimals);
  const raw = String(baseUnits).trim();
  const sign = raw.startsWith('-') ? '-' : '';
  const digits = raw.replace(/^-/, '');
  if (!digits) {
    return 0;
  }

  const padded = digits.padStart(safeDecimals + 1, '0');
  const whole = padded.slice(0, padded.length - safeDecimals) || '0';
  const fraction = safeDecimals > 0 ? padded.slice(-safeDecimals).replace(/0+$/, '') : '';
  const formatted = fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
  return Number(formatted);
}

export function formatUct(amount: number): string {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} UCT`;
}

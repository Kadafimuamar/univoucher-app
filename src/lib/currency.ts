// UCT (Unicity's default testnet coin) uses 6 decimal places, same as the
// SDK's own quick-start example (1,000,000 base units = 1 UCT). Amounts sent
// through sphere.payments / the Connect 'send' intent are always integer
// strings in the coin's smallest unit — never floating point.
export const UCT_DECIMALS = 6;

export function uctToBaseUnits(amount: number): string {
  return String(Math.round(amount * 10 ** UCT_DECIMALS));
}

export function baseUnitsToUct(baseUnits: string | number): number {
  return Number(baseUnits) / 10 ** UCT_DECIMALS;
}

export function formatUct(amount: number): string {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} UCT`;
}

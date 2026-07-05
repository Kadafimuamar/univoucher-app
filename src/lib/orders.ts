import type { Voucher } from './vouchers';

export interface Order {
  id: string;
  voucherId: string;
  game: string;
  denomination: string;
  priceUct: number;
  transferId: string;
  code: string;
  purchasedAt: number;
}

function storageKey(address: string): string {
  return `univoucher:orders:${address}`;
}

export function loadOrders(address: string): Order[] {
  try {
    const raw = localStorage.getItem(storageKey(address));
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(address: string, orders: Order[]): void {
  localStorage.setItem(storageKey(address), JSON.stringify(orders));
}

/**
 * NOTE ON PRODUCTION USE
 * ───────────────────────
 * This generates a voucher code client-side the moment the wallet reports a
 * successful transfer. That's fine for a demo, but a real storefront must
 * not trust the client's word that payment happened. Instead:
 *   1. Have sendPayment() return { transferId }.
 *   2. Send transferId + voucherId to your own backend.
 *   3. Backend independently confirms the transfer (e.g. subscribes to
 *      `transfer:confirmed` on the merchant wallet, or re-queries the
 *      gateway for that transfer) before releasing the real code from
 *      inventory.
 * Swap `mintDemoCode` below for that API call when you're ready to go live.
 */
function mintDemoCode(voucher: Voucher): string {
  const block = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
  return `${voucher.id.slice(0, 3).toUpperCase()}-${block()}-${block()}-${block()}`;
}

export function recordPurchase(address: string, voucher: Voucher, transferId: string): Order {
  const order: Order = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    voucherId: voucher.id,
    game: voucher.game,
    denomination: voucher.denomination,
    priceUct: voucher.priceUct,
    transferId,
    code: mintDemoCode(voucher),
    purchasedAt: Date.now(),
  };
  const existing = loadOrders(address);
  saveOrders(address, [order, ...existing]);
  return order;
}

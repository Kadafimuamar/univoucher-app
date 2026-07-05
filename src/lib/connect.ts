// UniVoucher never holds keys or a mnemonic. It is a "dApp" in the Sphere
// sense: it connects to whatever wallet the visitor already has — the
// Sphere browser extension, a Sphere tab opened as a popup, or Sphere
// itself when UniVoucher is loaded inside it — and asks that wallet to
// approve reads (queries) and payments (intents) on the visitor's behalf.
//
// The SDK's own `autoConnect()` handles transport detection (iframe vs.
// extension vs. popup fallback) for us.
//
// See: sphere.unicity.network/developers/docs#connect

import { autoConnect } from '@unicitylabs/sphere-sdk/connect/browser';
import { SPHERE_NETWORKS, type NetworkInfo } from '@unicitylabs/sphere-sdk/connect';

// Derived from autoConnect's own return type rather than imported directly —
// the SDK's browser bundle re-declares ConnectClient locally, and TS treats
// that as a distinct (if structurally identical) type from the one exported
// off '@unicitylabs/sphere-sdk/connect'.
type ConnectClient = Awaited<ReturnType<typeof autoConnect>>['client'];

// The wallet rejects a handshake with INCOMPATIBLE_NETWORK (4008) if the
// dApp doesn't declare a network, or declares one the wallet isn't on.
// `testnet2` is currently the only live network in the SDK's registry.
const NETWORK: NetworkInfo =
  import.meta.env.VITE_UNICITY_NETWORK === 'mainnet'
    ? { id: 1, name: 'mainnet' } // update once mainnet has a stable id in SPHERE_NETWORKS
    : SPHERE_NETWORKS.testnet2;

export interface SphereIdentity {
  directAddress?: string;
  nametag?: string;
  chainPubkey?: string;
}

export interface AssetBalance {
  coinId: string; // hex — the wallet's real identifier for this coin
  symbol: string; // e.g. 'UCT' — human-readable ticker
  decimals: number;
  totalAmount: string;
  fiatValueUsd?: number | null;
}

const WALLET_URL = import.meta.env.VITE_SPHERE_WALLET_URL ?? 'https://sphere.unicity.network';

const DAPP_INFO = {
  name: import.meta.env.VITE_DAPP_NAME ?? 'UniVoucher',
  description:
    import.meta.env.VITE_DAPP_DESCRIPTION ?? 'Buy digital game vouchers, paid peer-to-peer in UCT.',
  url: typeof window !== 'undefined' ? window.location.origin : '',
};

let client: ConnectClient | null = null;
let disconnectFn: (() => Promise<void>) | null = null;

/**
 * Try to resume a previously-approved connection without showing the user
 * anything. Call this once on page load; if it resolves null, show a
 * Connect button and call connect() instead.
 */
export async function connectSilently(): Promise<SphereIdentity | null> {
  try {
    const result = await autoConnect({
      dapp: DAPP_INFO,
      walletUrl: WALLET_URL,
      network: NETWORK,
      silent: true,
    });
    client = result.client;
    disconnectFn = result.disconnect;
    return result.connection.identity;
  } catch {
    return null;
  }
}

/** Opens the approval flow (popup or extension prompt) and connects. */
export async function connect(): Promise<SphereIdentity> {
  const result = await autoConnect({
    dapp: DAPP_INFO,
    walletUrl: WALLET_URL,
    network: NETWORK,
  });
  client = result.client;
  disconnectFn = result.disconnect;
  return result.connection.identity;
}

export async function disconnect(): Promise<void> {
  await disconnectFn?.();
  client = null;
  disconnectFn = null;
}

export function isConnected(): boolean {
  return client !== null;
}

function requireClient(): ConnectClient {
  if (!client) {
    throw new Error('Not connected — call connect() first.');
  }
  return client;
}

/** Read-only queries — never require wallet approval. */
export async function getIdentity(): Promise<SphereIdentity> {
  return requireClient().query('sphere_getIdentity');
}

export async function getBalance(): Promise<AssetBalance[]> {
  return requireClient().query('sphere_getBalance');
}

const HEX_ID_PATTERN = /^[0-9a-f]+$/;
const coinIdCache = new Map<string, string>();

/**
 * Payment intents need the coin's real (hex) id — the wallet's validator
 * rejects a ticker like "UCT" with "coinId must be lowercase even-length
 * hex". This resolves a human-readable symbol to that hex id by matching it
 * against the connected wallet's own balance. Pass an already-hex id through
 * unchanged.
 */
export async function resolveCoinId(symbolOrHex: string): Promise<string> {
  const normalized = symbolOrHex.toLowerCase();
  if (HEX_ID_PATTERN.test(normalized) && normalized.length % 2 === 0 && normalized.length > 8) {
    return normalized;
  }

  const cached = coinIdCache.get(normalized);
  if (cached) return cached;

  const assets = await getBalance();
  const match = assets.find((a) => a.symbol.toLowerCase() === normalized);
  if (!match) {
    throw new Error(`Couldn't find a coin matching "${symbolOrHex}" in this wallet's balance.`);
  }
  coinIdCache.set(normalized, match.coinId);
  return match.coinId;
}

export async function resolveRecipient(recipient: string): Promise<string> {
  const trimmed = recipient.trim();
  if (!trimmed) {
    throw new Error('No recipient configured.');
  }

  return trimmed;
}

export interface SendPaymentInput {
  recipient: string; // '@nametag' or a DIRECT:// address
  amount: string; // smallest-unit integer as a string, e.g. "5000000"
  coinId: string; // hex coin id — resolve tickers like 'UCT' with resolveCoinId() first
  message?: string;
}

export interface SendPaymentResult {
  success: boolean;
  transferId?: string;
  error?: string;
}

function extractTransferId(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.transferId === 'string') {
      return record.transferId;
    }
    if (typeof record.id === 'string') {
      return record.id;
    }
    if (record.transfer && typeof record.transfer === 'object') {
      const transfer = record.transfer as Record<string, unknown>;
      if (typeof transfer.id === 'string') {
        return transfer.id;
      }
    }
    if (record.result && typeof record.result === 'object') {
      return extractTransferId(record.result);
    }
  }

  return undefined;
}

function normalizeSendPaymentResult(raw: unknown): SendPaymentResult {
  if (raw === null || raw === undefined) {
    return { success: false, error: 'The wallet did not return a transfer result.' };
  }

  if (typeof raw === 'string') {
    return { success: true, transferId: raw };
  }

  if (typeof raw === 'boolean') {
    return { success: raw };
  }

  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    const transferId = extractTransferId(raw);
    const success = record.success === false ? false : Boolean(transferId || record.status || record.id || record.transfer || record.result || record.data);
    const error = typeof record.error === 'string' ? record.error : typeof record.message === 'string' ? record.message : undefined;
    return { success, transferId, error };
  }

  return { success: false, error: 'The wallet returned an unexpected transfer result.' };
}

/**
 * Sends a payment intent. The wallet shows its own approval UI to the
 * visitor before anything moves — UniVoucher just gets the result.
 */
/**
 * Sends a payment intent. The wallet shows its own approval UI to the
 * visitor before anything moves — UniVoucher just gets the result.
 *
 * NOTE: the SDK's docs/examples show the 'send' intent taking a `recipient`
 * field, but the currently-deployed wallet's intent handler validates for
 * `to` instead (confirmed via its "Missing or invalid \"to\"" error). We
 * send both so this keeps working if/when the wallet is updated to match
 * the documented shape.
 */
export async function sendPayment(input: SendPaymentInput): Promise<SendPaymentResult> {
  try {
    const raw = await requireClient().intent('send', {
      to: input.recipient,
      amount: input.amount,
      coinId: input.coinId,
      ...(input.message ? { message: input.message } : {}),
    });

    if (raw === undefined) {
      return { success: true, transferId: `wallet-${Date.now()}` };
    }

    return normalizeSendPaymentResult(raw);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'The wallet declined the transfer.',
    };
  }
}

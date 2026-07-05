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
  coinId: string;
  symbol: string;
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

/** Resolves a nametag (e.g. '@univoucher') to its underlying address. */
export async function resolveNametag(nametag: string): Promise<string> {
  return requireClient().query('sphere_resolve', { nametag });
}

export interface SendPaymentInput {
  recipient: string; // '@nametag' or a DIRECT:// address
  amount: string; // smallest-unit integer as a string, e.g. "5000000"
  coinId: string; // e.g. 'UCT'
  message?: string;
}

export interface SendPaymentResult {
  success: boolean;
  transferId?: string;
  error?: string;
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
  return requireClient().intent('send', {
    to: input.recipient,
    recipient: input.recipient,
    amount: input.amount,
    coinId: input.coinId,
    message: input.message,
  });
}

# UniVoucher

A dApp for buying digital game top-up vouchers, paid for directly from a
visitor's [Unicity Sphere](https://sphere.unicity.network) wallet — no
account, no card, no payment processor in the middle.

UniVoucher never touches a private key. It's a **Connect-protocol dApp**: it
asks whatever Sphere wallet the visitor already has (browser extension,
a Sphere popup, or Sphere itself if UniVoucher is opened inside it) to
approve a payment, and gets back a transfer id once the visitor approves it
in their own wallet UI.

## How it works

```
Visitor                 UniVoucher (this app)         Sphere wallet
   │                            │                            │
   │  picks a voucher            │                            │
   │ ───────────────────────────►│                            │
   │                            │  ConnectClient.connect()    │
   │                            │ ───────────────────────────►│
   │                            │        identity              │
   │                            │◄───────────────────────────  │
   │                            │  intent('send', {...})       │
   │                            │ ───────────────────────────►│
   │                            │                    (visitor approves in
   │                            │                     their own wallet UI)
   │                            │      { transferId }          │
   │                            │◄───────────────────────────  │
   │       code revealed         │                            │
   │◄───────────────────────────│                            │
```

See `src/lib/connect.ts` for the transport wiring (iframe / extension /
popup detection) and `src/components/PurchaseModal.tsx` for the purchase
flow itself.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

- `VITE_UNICITY_NETWORK` — `testnet` while building, `mainnet` for real value.
- `VITE_MERCHANT_NAMETAG` — the Unicity ID that should receive payment. This
  needs to be a registered nametag on a wallet you control (see the SDK's
  `docs/UNICITY-ID.md` for how nametag registration works).
- `VITE_SPHERE_WALLET_URL` — only used for the popup fallback, when the
  visitor has neither the extension installed nor is browsing from inside
  Sphere itself.

Then:

```bash
npm run dev
```

Open the printed local URL. If you don't have the Sphere browser extension
installed, the app will open Sphere as a popup for you to connect from.

## What's simulated vs. what's real

- **Real**: the wallet connection, balance query, and the payment itself
  all go through the actual Sphere Connect protocol (`@unicitylabs/sphere-sdk/connect`).
  A payment your wallet approves is a real UCT transfer on testnet or mainnet.
- **Simulated**: voucher code fulfillment. The moment `sendPayment()` reports
  success, this demo mints a fake code client-side (`src/lib/orders.ts`) so
  you can see the full flow end-to-end without standing up a backend.

Before taking this to production, replace `mintDemoCode()` with a call to
your own backend, and have that backend independently confirm the transfer
(e.g. by subscribing to `transfer:confirmed` on the merchant wallet, or
re-querying the gateway for that transfer id) before it releases a real
voucher code from inventory. Never release inventory purely because the
browser says a payment succeeded.

## Project layout

```
src/
  lib/
    connect.ts     — Connect-protocol client: connect, queries, send intent
    detection.ts    — iframe / extension detection for transport selection
    currency.ts     — UCT ⇄ base-unit conversion (6 decimals)
    vouchers.ts     — the voucher catalog (swap in your real inventory/API)
    orders.ts       — order history + demo code minting (see note above)
  components/
    Header.tsx        — wallet pill / connect button
    VoucherGrid.tsx    — catalog grid
    VoucherCard.tsx    — a single ticket-stub voucher card
    PurchaseModal.tsx  — connect → pay → reveal-code flow
    OrderHistory.tsx   — past purchases for the connected wallet
  App.tsx
  main.tsx
  styles.css
```

## Reference

- [Installation](https://sphere.unicity.network/developers/docs#installation)
- [Quick start](https://sphere.unicity.network/developers/docs#quick-start)
- [Browser setup](https://sphere.unicity.network/developers/docs#browser-setup)
- [Core concepts](https://sphere.unicity.network/developers/docs#core-concepts)
- [Payments API](https://sphere.unicity.network/developers/docs#api-payments)
- [Connect protocol](https://sphere.unicity.network/developers/docs#connect)
- SDK repo: [unicity-sphere/sphere-sdk](https://github.com/unicity-sphere/sphere-sdk)
  — see `docs/CONNECT.md` and `docs/API.md` in that repo for the full
  protocol reference.

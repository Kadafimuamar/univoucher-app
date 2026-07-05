import { useState } from 'react';
import type { Voucher } from '../lib/vouchers';
import type { SphereIdentity } from '../lib/connect';
import { sendPayment, resolveCoinId } from '../lib/connect';
import { uctToBaseUnits } from '../lib/currency';
import { recordPurchase, type Order } from '../lib/orders';

const MERCHANT_NAMETAG = `@${import.meta.env.VITE_MERCHANT_NAMETAG ?? 'univoucher'}`;

type Stage = 'confirm' | 'paying' | 'done' | 'error';

interface PurchaseModalProps {
  voucher: Voucher;
  identity: SphereIdentity | null;
  onConnect: () => Promise<SphereIdentity | null>;
  onClose: () => void;
  onPurchased: (order: Order) => void;
}

export function PurchaseModal({ voucher, identity, onConnect, onClose, onPurchased }: PurchaseModalProps) {
  const [stage, setStage] = useState<Stage>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  async function handlePay() {
    setStage('paying');
    setError(null);
    try {
      // Make sure a wallet is actually attached before asking it to pay.
      const activeIdentity = identity ?? (await onConnect());
      if (!activeIdentity?.directAddress) {
        throw new Error('No wallet connected.');
      }

      const coinId = await resolveCoinId('UCT');
      const result = await sendPayment({
        recipient: MERCHANT_NAMETAG,
        amount: uctToBaseUnits(voucher.priceUct),
        coinId,
        message: `UniVoucher — ${voucher.game} (${voucher.denomination})`,
      });

      if (!result.success || !result.transferId) {
        throw new Error(result.error ?? 'The wallet declined or the transfer failed.');
      }

      // In production: hand `result.transferId` to your backend and let it
      // confirm the transfer before releasing a real code. Here we simulate
      // instant fulfillment — see orders.ts for the production note.
      const placedOrder = recordPurchase(activeIdentity.directAddress, voucher, result.transferId);
      setOrder(placedOrder);
      setStage('done');
      onPurchased(placedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStage('error');
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-ticket" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="eyebrow">Voucher purchase</div>
          <h3>{voucher.game}</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>{voucher.denomination}</p>
        </div>

        <div className="modal-body">
          <div className="line-item">
            <span>Paid to</span>
            <strong>{MERCHANT_NAMETAG}</strong>
          </div>
          <div className="line-item">
            <span>Coin</span>
            <strong>UCT</strong>
          </div>
          <div className="line-item total">
            <span>Total</span>
            <strong>{voucher.priceUct} UCT</strong>
          </div>
        </div>

        {stage === 'error' && <p className="status-note error">{error}</p>}
        {stage === 'paying' && (
          <p className="status-note">Waiting for approval in your Sphere wallet…</p>
        )}
        {!identity && stage === 'confirm' && (
          <p className="status-note">You'll be asked to connect a Sphere wallet, then approve the payment.</p>
        )}

        {stage === 'done' && order && (
          <div className="code-reveal">
            <div className="label">Your code</div>
            <div className="code">{order.code}</div>
          </div>
        )}

        <div className="modal-actions">
          {stage === 'done' ? (
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={onClose} disabled={stage === 'paying'}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handlePay} disabled={stage === 'paying'}>
                {stage === 'paying' ? 'Confirming…' : `Pay ${voucher.priceUct} UCT`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

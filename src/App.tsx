import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { VoucherGrid } from './components/VoucherGrid';
import { PurchaseModal } from './components/PurchaseModal';
import { OrderHistory } from './components/OrderHistory';
import { connect, connectSilently, getBalance, type SphereIdentity } from './lib/connect';
import { baseUnitsToUct } from './lib/currency';
import { loadOrders, type Order } from './lib/orders';
import type { Voucher } from './lib/vouchers';

export default function App() {
  const [identity, setIdentity] = useState<SphereIdentity | null>(null);
  const [balanceUct, setBalanceUct] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [selected, setSelected] = useState<Voucher | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Try to resume a previously-approved connection on load — no popup shown.
  useEffect(() => {
    connectSilently().then((id) => {
      if (id) applyIdentity(id);
    });
  }, []);

  async function applyIdentity(id: SphereIdentity) {
    setIdentity(id);
    if (id.directAddress) {
      setOrders(loadOrders(id.directAddress));
    }
    try {
      const assets = await getBalance();
      const uct = assets.find((a) => a.symbol.toUpperCase() === 'UCT');
      if (uct) setBalanceUct(baseUnitsToUct(uct.totalAmount));
    } catch {
      // Balance is a nice-to-have; a failed query shouldn't block the page.
    }
  }

  async function handleConnect(): Promise<SphereIdentity | null> {
    setConnecting(true);
    try {
      const id = await connect();
      await applyIdentity(id);
      return id;
    } catch {
      return null;
    } finally {
      setConnecting(false);
    }
  }

  function handlePurchased(order: Order) {
    setOrders((prev) => [order, ...prev]);
  }

  return (
    <>
      <Header identity={identity} balanceUct={balanceUct} connecting={connecting} onConnect={handleConnect} />

      <main>
        <section className="hero">
          <div className="container">
            <h1>
              Game vouchers, <span>paid peer-to-peer.</span>
            </h1>
            <p>
              Buy top-up codes for the games you're already playing. Payment goes directly from your
              Sphere wallet to ours — no card, no account, no waiting on a payment processor.
            </p>
          </div>
        </section>

        <VoucherGrid onSelect={setSelected} />

        {identity && <OrderHistory orders={orders} />}
      </main>

      <footer className="site-footer">
        <div className="container">Built with the Unicity Sphere SDK · Connect protocol</div>
      </footer>

      {selected && (
        <PurchaseModal
          voucher={selected}
          identity={identity}
          onConnect={handleConnect}
          onClose={() => setSelected(null)}
          onPurchased={handlePurchased}
        />
      )}
    </>
  );
}

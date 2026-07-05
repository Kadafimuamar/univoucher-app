import type { Order } from '../lib/orders';

interface OrderHistoryProps {
  orders: Order[];
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  return (
    <section className="orders-section">
      <div className="container">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 16 }}>Your vouchers</h2>
        {orders.length === 0 ? (
          <p className="empty-state">Purchases you make will show up here, with the code, for this session.</p>
        ) : (
          orders.map((order) => (
            <div className="order-row" key={order.id}>
              <div className="game-col">
                <strong>{order.game}</strong>
                <span>{order.denomination}</span>
              </div>
              <div className="code-col">{order.code}</div>
              <div>{order.priceUct} UCT</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

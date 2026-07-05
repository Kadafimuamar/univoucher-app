import { VOUCHERS, type Voucher } from '../lib/vouchers';
import { VoucherCard } from './VoucherCard';

interface VoucherGridProps {
  onSelect: (voucher: Voucher) => void;
}

export function VoucherGrid({ onSelect }: VoucherGridProps) {
  return (
    <section className="grid-section">
      <div className="container">
        <h2>Available vouchers</h2>
        <div className="voucher-grid">
          {VOUCHERS.map((voucher) => (
            <VoucherCard key={voucher.id} voucher={voucher} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </section>
  );
}

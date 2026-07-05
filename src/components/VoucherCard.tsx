import type { Voucher } from '../lib/vouchers';

interface VoucherCardProps {
  voucher: Voucher;
  onSelect: (voucher: Voucher) => void;
}

export function VoucherCard({ voucher, onSelect }: VoucherCardProps) {
  return (
    <article
      className="voucher-card"
      style={{ ['--stub-accent' as any]: voucher.accent }}
    >
      <div className="stub-top">
        <h3 className="game-name">{voucher.game}</h3>
        <p className="publisher">{voucher.publisher}</p>
        <p className="blurb">{voucher.blurb}</p>
      </div>
      <div className="tear-line" />
      <div className="stub-bottom">
        <span className="denomination">{voucher.denomination}</span>
        <span className="price">{voucher.priceUct} UCT</span>
      </div>
      <div className="stub-bottom" style={{ paddingTop: 0 }}>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onSelect(voucher)}>
          Buy voucher
        </button>
      </div>
    </article>
  );
}

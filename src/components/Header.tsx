import type { SphereIdentity } from '../lib/connect';

interface HeaderProps {
  identity: SphereIdentity | null;
  balanceUct: number | null;
  connecting: boolean;
  onConnect: () => void;
}

function shortAddress(addr?: string): string {
  if (!addr) return '';
  return addr.length > 18 ? `${addr.slice(0, 10)}…${addr.slice(-6)}` : addr;
}

export function Header({ identity, balanceUct, connecting, onConnect }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container row">
        <div className="brand">
          UniVoucher<span className="dot">.</span>
          <span className="tag">Unicity Sphere</span>
        </div>

        <div className="wallet-box">
          {identity ? (
            <div className="wallet-pill">
              <span className="dot-live" />
              <span>{identity.nametag ? `@${identity.nametag}` : shortAddress(identity.directAddress)}</span>
              {balanceUct !== null && <span className="wallet-balance">{balanceUct.toFixed(2)} UCT</span>}
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onConnect} disabled={connecting}>
              {connecting ? 'Connecting…' : 'Connect wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

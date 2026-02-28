import { ArrowLeftRight, Wallet } from 'lucide-react';
import TokenIcon from '../components/dex/TokenIcon';
import { useGameState } from '../context/GameState';
import { useWallet } from '../hooks/useWallet';
import { formatTokenSymbol, PHI_SYMBOL } from '../lib/tokenDisplay';
import { TOKEN_SYMBOLS, type TokenSymbol } from '../types/domain';

export default function WalletPage() {
  const game = useGameState();
  const wallet = useWallet();

  const allRows = TOKEN_SYMBOLS.map((symbol) => {
    if (symbol === 'Flux') {
      return {
        symbol,
        value: wallet.isConnected ? String(game.fluxBalance) : '--',
        status: wallet.isConnected
          ? game.isFluxSyncing
            ? 'Refreshing live balance'
            : 'Live from GameState'
          : 'Connect wallet to load',
        live: wallet.isConnected,
      };
    }

    return {
      symbol,
      value: 'Pending',
      status: 'Scaffolded until a live balance source is wired',
      live: false,
    };
  });

  const entropyRows = allRows.filter((r) => r.symbol === 'Flux' || r.symbol === 'UVD');
  const wrappedRows = allRows.filter((r) => r.symbol === 'wBTC' || r.symbol === 'wETH');

  return (
    <div className="pt-20 md:pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="tag">
              <Wallet size={11} />
              Wallet
            </span>
            <span className="tag">
              Balance Overview
            </span>
          </div>
          <h1 className="font-mono font-black text-3xl md:text-4xl lg:text-5xl text-text-primary leading-tight uppercase tracking-tight">
            Wallet Overview
          </h1>
          <p className="mt-4 text-lg text-text-muted leading-relaxed">
            {PHI_SYMBOL} is live here when a wallet is connected. The wrapped asset rows are intentionally
            scaffolded until their balance sources are wired into the app.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
          <section className="bg-bg-card border border-border-subtle overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.16em]">
                  Asset Balances
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  {wallet.isConnected
                    ? `Connected as ${wallet.displayAddress}`
                    : 'No wallet connected'}
                </p>
              </div>
              {wallet.isConnected ? (
                <button
                  onClick={() => void wallet.disconnect()}
                  disabled={wallet.isConnecting}
                  className="border border-border-default px-3 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-text-primary hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => void wallet.connect()}
                  disabled={wallet.isConnecting}
                  className="btn-primary text-xs px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>

            <div className="p-5 space-y-5">
              {[
                { label: 'Entropy Network', rows: entropyRows },
                { label: 'Legacy Assets', rows: wrappedRows },
              ].map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-[0.18em] mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-2">
                    {group.rows.map((row) => (
                      <div
                        key={row.symbol}
                        className="flex items-center gap-3 p-3 bg-bg-inset border border-border-subtle"
                      >
                        <TokenIcon symbol={row.symbol} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-text-primary text-sm leading-none">
                              {formatTokenSymbol(row.symbol)}
                            </p>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider ${
                                row.live ? 'bg-dot-green text-black' : 'bg-bg-inset text-text-muted'
                              }`}
                            >
                              {row.live ? 'Live' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-text-muted text-[10px] mt-0.5">{row.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-text-primary text-sm leading-none">{row.value}</p>
                          <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mt-0.5">
                            {formatTokenSymbol(row.symbol)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-bg-card border border-border-subtle p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 flex items-center justify-center bg-bg-inset border border-border-default">
                  <ArrowLeftRight size={15} className="text-text-secondary" />
                </div>
                <p className="font-mono font-bold text-text-primary text-sm uppercase tracking-wider">
                  Entropy Exchange
                </p>
              </div>
              <p className="text-sm text-text-muted leading-relaxed mb-4">
                Swap tokens on the constant-product AMM. Trade {PHI_SYMBOL} against wrapped assets directly on the ɸ-net testnet.
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block w-1.5 h-1.5 bg-text-muted" />
                <span className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider">
                  Live data source disconnected
                </span>
              </div>
              <button
                onClick={() => { window.location.hash = 'dex'; window.scrollTo(0, 0); }}
                className="w-full border border-border-default py-2.5 font-mono font-semibold text-xs uppercase tracking-wider text-text-primary hover:border-border-strong transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ArrowLeftRight size={12} />
                Open Exchange
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

import { Clock3, Wallet } from 'lucide-react';
import TokenIcon from '../components/dex/TokenIcon';
import { useGameState } from '../context/GameState';
import { useWallet } from '../hooks/useWallet';
import { TOKEN_SYMBOLS, type TokenSymbol } from '../types/domain';

function getDisplaySymbol(symbol: TokenSymbol): string {
  return symbol === 'Flux' ? 'FLUX' : symbol;
}

export default function WalletPage() {
  const game = useGameState();
  const wallet = useWallet();

  const rows = TOKEN_SYMBOLS.map((symbol) => {
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
            FLUX is live here when a wallet is connected. The wrapped asset rows are intentionally
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

            <div className="divide-y divide-border-subtle">
              {rows.map((row) => (
                <div key={row.symbol} className="px-5 py-4 flex items-center gap-4">
                  <TokenIcon symbol={getDisplaySymbol(row.symbol)} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-semibold text-text-primary uppercase tracking-wider">
                        {getDisplaySymbol(row.symbol)}
                      </p>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider ${
                          row.live ? 'bg-dot-green text-black' : 'bg-bg-inset text-text-muted'
                        }`}
                      >
                        {row.live ? 'Live' : 'Pending'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">{row.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-text-primary text-lg">{row.value}</p>
                    <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
                      {getDisplaySymbol(row.symbol)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-bg-card border border-border-subtle p-5">
              <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.16em]">
                Live Source
              </p>
              <p className="mt-3 text-sm text-text-muted leading-relaxed">
                FLUX reads from the shared game state and updates after gate claims, spending, and wallet refreshes.
              </p>
            </div>

            <div className="bg-bg-card border border-border-subtle p-5">
              <div className="flex items-center gap-2">
                <Clock3 size={15} className="text-dot-green" />
                <p className="font-mono font-semibold text-text-primary uppercase tracking-wider">Scaffolded Rows</p>
              </div>
              <p className="mt-3 text-sm text-text-muted leading-relaxed">
                wETH, wBTC, and UVD remain explicit placeholders here until the app exposes real balance reads for those assets.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

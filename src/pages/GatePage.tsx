import { ArrowLeftRight, Lock, Trophy, Wallet } from 'lucide-react';
import EntropyGatePanel from '../components/EntropyGatePanel';

interface GatePageProps {
  onOpenDex: () => void;
  onOpenWallet: () => void;
}

export default function GatePage({ onOpenDex, onOpenWallet }: GatePageProps) {
  return (
    <div className="pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="tag">
              <Lock size={11} />
              App 1
            </span>
            <span className="tag">
              Daily Claim Flow
            </span>
          </div>
          <h1 className="font-mono font-black text-3xl md:text-4xl lg:text-5xl text-text-primary leading-tight uppercase tracking-tight">
            Entropy Gate
          </h1>
          <p className="mt-4 text-lg text-text-muted leading-relaxed max-w-2xl">
            This is the protocol entry point. Lock once, verify on-chain, then return here to claim
            FLUX on cadence before routing capital into the exchange and the rest of the testnet loop.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_320px] gap-6 items-start">
          <EntropyGatePanel onOpenDex={onOpenDex} onOpenWallet={onOpenWallet} />

          <aside className="space-y-4">
            <div className="bg-bg-card border border-border-subtle p-5">
              <p className="text-[11px] font-mono font-semibold text-text-muted uppercase tracking-[0.16em]">
                Flow
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-bg-inset border border-border-default flex items-center justify-center">
                    <Lock size={15} className="text-dot-green" />
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-text-primary uppercase tracking-wider">1. Lock</p>
                    <p className="text-sm text-text-muted mt-1">Whitelist this wallet with a one-time ETH lock.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-bg-inset border border-border-default flex items-center justify-center">
                    <Wallet size={15} className="text-dot-green" />
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-text-primary uppercase tracking-wider">2. Track</p>
                    <p className="text-sm text-text-muted mt-1">Use the wallet page for live FLUX and token scaffolding.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-bg-inset border border-border-default flex items-center justify-center">
                    <ArrowLeftRight size={15} className="text-dot-green" />
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-text-primary uppercase tracking-wider">3. Deploy</p>
                    <p className="text-sm text-text-muted mt-1">Route claimed FLUX into swaps, liquidity, and the wider app loop.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-card border border-border-subtle p-5">
              <div className="flex items-center gap-2">
                <Trophy size={15} className="text-dot-green" />
                <p className="font-mono font-semibold text-text-primary uppercase tracking-wider">Jackpot Note</p>
              </div>
              <p className="mt-3 text-sm text-text-muted leading-relaxed">
                The ETH you lock feeds the reward loop. Leaderboard access stays available from the home dashboard and footer.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

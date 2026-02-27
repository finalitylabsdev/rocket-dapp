import { useState } from 'react';
import { ChevronDown, Plus, Info } from 'lucide-react';
import TokenIcon from './TokenIcon';
import { usePrices, getRate, getTokenUsdPrice } from '../../hooks/usePrices';

const TOKENS = ['FLUX', 'wETH', 'wBTC', 'UVD'];

const POOL_TOTALS: Record<string, number> = {
  'FLUX-wETH': 842000,
  'FLUX-wBTC': 295000,
  'FLUX-UVD': 1247590,
  'wETH-wBTC': 4120000,
  'wETH-UVD': 983000,
  'wBTC-UVD': 2340000,
};

function SmallTokenSelect({ value, onChange, exclude }: { value: string; onChange: (v: string) => void; exclude: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 app-control hover:bg-bg-card-hover px-3 py-2 transition-all duration-150"
      >
        <TokenIcon symbol={value} size="sm" />
        <span className="font-mono font-bold text-text-primary text-sm">{value}</span>
        <ChevronDown size={13} className="text-text-secondary" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-40 app-window z-50 overflow-hidden p-1">
          {TOKENS.filter((t) => t !== exclude).map((t) => (
            <button
              key={t}
              onClick={() => { onChange(t); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-card-hover transition-colors text-left rounded-[1rem] ${value === t ? 'bg-bg-card-hover' : ''}`}
            >
              <TokenIcon symbol={t} size="sm" />
              <span className="font-mono font-semibold text-text-primary text-sm">{t}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LiquidityTab() {
  const [tokenA, setTokenA] = useState('FLUX');
  const [tokenB, setTokenB] = useState('wETH');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const { prices } = usePrices();

  const pairKey = [tokenA, tokenB].sort().join('-');
  const poolTotal = POOL_TOTALS[pairKey] ?? 500000;

  const tokenAUsd = getTokenUsdPrice(prices, tokenA);
  const poolShare =
    amountA && parseFloat(amountA) > 0
      ? Math.min(((parseFloat(amountA) * tokenAUsd) / poolTotal) * 100, 99.9).toFixed(4)
      : '0.0000';

  const rateAtoB = getRate(prices, tokenA, tokenB);
  const rateBtoA = getRate(prices, tokenB, tokenA);

  const handleAmountA = (v: string) => {
    setAmountA(v);
    if (v && parseFloat(v) > 0) {
      setAmountB((parseFloat(v) * rateAtoB).toFixed(6));
    } else {
      setAmountB('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="app-panel-muted p-4">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-muted leading-relaxed">
            Add liquidity to earn <span className="text-text-primary font-semibold">0.3%</span> of all swaps on this pair, proportional to your pool share.
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-text-muted font-mono font-medium mb-2 tracking-wide">Select Pair</p>
        <div className="app-panel p-4">
          <div className="flex items-center gap-3">
            <SmallTokenSelect value={tokenA} onChange={setTokenA} exclude={tokenB} />
            <div className="flex-1 flex justify-center">
              <div className="w-8 h-8 app-control flex items-center justify-center">
                <Plus size={14} className="text-text-secondary" />
              </div>
            </div>
            <SmallTokenSelect value={tokenB} onChange={setTokenB} exclude={tokenA} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-text-muted font-mono font-medium tracking-wide">Deposit Amounts</p>

        <div className="app-panel hover:border-border-strong p-4 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              value={amountA}
              onChange={(e) => handleAmountA(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-xl font-mono font-bold text-text-primary placeholder:text-text-faint focus:outline-none min-w-0"
            />
            <div className="flex items-center gap-2 app-control px-2.5 py-1.5">
              <TokenIcon symbol={tokenA} size="xs" />
              <span className="font-mono font-bold text-text-primary text-sm">{tokenA}</span>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-text-muted font-mono">Balance: 4,200.00</span>
            <button className="text-xs text-text-secondary hover:text-text-primary font-mono font-semibold transition-colors">MAX</button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 app-control flex items-center justify-center">
            <Plus size={14} className="text-text-muted" />
          </div>
        </div>

        <div className="app-panel hover:border-border-strong p-4 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-xl font-mono font-bold text-text-primary placeholder:text-text-faint focus:outline-none min-w-0"
            />
            <div className="flex items-center gap-2 app-control px-2.5 py-1.5">
              <TokenIcon symbol={tokenB} size="xs" />
              <span className="font-mono font-bold text-text-primary text-sm">{tokenB}</span>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-text-muted font-mono">Balance: 0.00</span>
            <button className="text-xs text-text-secondary hover:text-text-primary font-mono font-semibold transition-colors">MAX</button>
          </div>
        </div>
      </div>

      <div className="app-panel-muted p-4 space-y-2.5">
        <p className="text-xs font-mono font-semibold text-text-secondary mb-3 tracking-wide">Pool Information</p>
        {[
          { label: `${tokenA} per ${tokenB}`, value: rateBtoA.toFixed(rateBtoA >= 1 ? 2 : 6) },
          { label: `${tokenB} per ${tokenA}`, value: rateAtoB.toFixed(rateAtoB >= 1 ? 2 : 6) },
          { label: 'Your Pool Share', value: `${poolShare}%` },
          { label: 'Pool Liquidity', value: `$${poolTotal.toLocaleString()}` },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-text-muted font-mono">{row.label}</span>
            <span className="text-text-primary font-mono font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <button
        disabled={!amountA || parseFloat(amountA) <= 0}
        className="w-full py-4 font-mono font-bold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
        style={{
          background: amountA && parseFloat(amountA) > 0 ? 'linear-gradient(135deg, var(--color-accent-lime) 0%, #d7ff8f 100%)' : 'var(--color-bg-inset)',
          color: amountA && parseFloat(amountA) > 0 ? '#09100a' : 'var(--color-text-faint)',
          border: amountA && parseFloat(amountA) > 0 ? '1px solid rgba(184,255,85,0.72)' : '1px solid var(--color-border-default)',
          borderRadius: '999px',
          boxShadow: amountA && parseFloat(amountA) > 0 ? '0 16px 28px rgba(184,255,85,0.2)' : 'var(--surface-gloss)',
        }}
      >
        {amountA && parseFloat(amountA) > 0 ? 'Add Liquidity' : 'Enter amounts'}
      </button>
    </div>
  );
}

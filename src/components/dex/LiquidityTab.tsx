import { useState } from 'react';
import { ChevronDown, Plus, Info } from 'lucide-react';

const TOKENS = ['FLUX', 'wETH', 'wBTC', 'UVD'];

const TOKEN_ICONS: Record<string, { bg: string; label: string }> = {
  FLUX: { bg: 'bg-zinc-200', label: 'F' },
  wETH: { bg: 'bg-zinc-300', label: 'Ξ' },
  wBTC: { bg: 'bg-zinc-400', label: '₿' },
  UVD:  { bg: 'bg-zinc-500', label: 'U' },
};

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
  const tok = TOKEN_ICONS[value];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-border-default hover:border-border-strong px-3 py-2 transition-all duration-150"
      >
        <div className={`w-6 h-6 ${tok.bg} flex items-center justify-center text-black font-mono font-black text-xs`}>
          {tok.label}
        </div>
        <span className="font-mono font-bold text-white text-sm">{value}</span>
        <ChevronDown size={13} className="text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-40 bg-zinc-900 border border-border-default z-50 overflow-hidden">
          {TOKENS.filter((t) => t !== exclude).map((t) => (
            <button
              key={t}
              onClick={() => { onChange(t); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left ${value === t ? 'bg-zinc-800' : ''}`}
            >
              <div className={`w-6 h-6 ${TOKEN_ICONS[t].bg} flex items-center justify-center text-black font-mono font-black text-xs flex-shrink-0`}>
                {TOKEN_ICONS[t].label}
              </div>
              <span className="font-mono font-semibold text-white text-sm">{t}</span>
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

  const pairKey = [tokenA, tokenB].sort().join('-');
  const poolTotal = POOL_TOTALS[pairKey] ?? 500000;
  const poolShare =
    amountA && parseFloat(amountA) > 0
      ? Math.min(((parseFloat(amountA) * 0.042) / poolTotal) * 100, 99.9).toFixed(4)
      : '0.0000';

  const handleAmountA = (v: string) => {
    setAmountA(v);
    if (v && parseFloat(v) > 0) {
      const ratio = tokenA === 'ET' && tokenB === 'ETH' ? 0.000351 : 1;
      setAmountB((parseFloat(v) * ratio).toFixed(6));
    } else {
      setAmountB('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-zinc-900/60 border border-border-subtle p-4">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-zinc-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-zinc-500 leading-relaxed">
            Add liquidity to earn <span className="text-zinc-300 font-semibold">0.3%</span> of all swaps on this pair, proportional to your pool share.
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-zinc-500 font-mono font-medium mb-2 uppercase tracking-wider">Select Pair</p>
        <div className="bg-zinc-900 border border-border-default p-4">
          <div className="flex items-center gap-3">
            <SmallTokenSelect value={tokenA} onChange={setTokenA} exclude={tokenB} />
            <div className="flex-1 flex justify-center">
              <div className="w-7 h-7 bg-zinc-800 border border-border-default flex items-center justify-center">
                <Plus size={14} className="text-zinc-400" />
              </div>
            </div>
            <SmallTokenSelect value={tokenB} onChange={setTokenB} exclude={tokenA} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-zinc-500 font-mono font-medium uppercase tracking-wider">Deposit Amounts</p>

        <div className="bg-zinc-900 border border-border-default hover:border-border-strong p-4 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              value={amountA}
              onChange={(e) => handleAmountA(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-xl font-mono font-bold text-white placeholder:text-zinc-700 focus:outline-none min-w-0"
            />
            <div className="flex items-center gap-2 bg-zinc-800 px-2.5 py-1.5">
              <div className={`w-5 h-5 ${TOKEN_ICONS[tokenA].bg} flex items-center justify-center text-black font-mono font-black text-[10px]`}>
                {TOKEN_ICONS[tokenA].label}
              </div>
              <span className="font-mono font-bold text-white text-sm">{tokenA}</span>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-zinc-600 font-mono">Balance: 4,200.00</span>
            <button className="text-xs text-zinc-400 hover:text-white font-mono font-semibold transition-colors">MAX</button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-7 h-7 bg-zinc-800 border border-border-default flex items-center justify-center">
            <Plus size={14} className="text-zinc-500" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-border-default hover:border-border-strong p-4 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              value={amountB}
              onChange={(e) => setAmountB(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-xl font-mono font-bold text-white placeholder:text-zinc-700 focus:outline-none min-w-0"
            />
            <div className="flex items-center gap-2 bg-zinc-800 px-2.5 py-1.5">
              <div className={`w-5 h-5 ${TOKEN_ICONS[tokenB].bg} flex items-center justify-center text-black font-mono font-black text-[10px]`}>
                {TOKEN_ICONS[tokenB].label}
              </div>
              <span className="font-mono font-bold text-white text-sm">{tokenB}</span>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-zinc-600 font-mono">Balance: 0.00</span>
            <button className="text-xs text-zinc-400 hover:text-white font-mono font-semibold transition-colors">MAX</button>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-border-subtle p-4 space-y-2.5">
        <p className="text-xs font-mono font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Pool Information</p>
        {[
          { label: `${tokenA} per ${tokenB}`, value: `${(1 / 0.000351).toFixed(2)}` },
          { label: `${tokenB} per ${tokenA}`, value: '0.000351' },
          { label: 'Your Pool Share', value: `${poolShare}%` },
          { label: 'Pool Liquidity', value: `$${poolTotal.toLocaleString()}` },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 font-mono">{row.label}</span>
            <span className="text-zinc-200 font-mono font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <button
        disabled={!amountA || parseFloat(amountA) <= 0}
        className="w-full py-4 font-mono font-bold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
        style={{
          background: 'transparent',
          color: amountA && parseFloat(amountA) > 0 ? '#4ADE80' : '#555555',
          border: amountA && parseFloat(amountA) > 0 ? '1px solid #4ADE80' : '1px solid #2A3348',
        }}
      >
        {amountA && parseFloat(amountA) > 0 ? 'Add Liquidity' : 'Enter amounts'}
      </button>
    </div>
  );
}

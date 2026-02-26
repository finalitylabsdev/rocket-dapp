import { useState, useCallback } from 'react';
import { ArrowUpDown, ChevronDown, Info, Settings2 } from 'lucide-react';

const TOKENS = [
  { symbol: 'FLUX', name: 'Flux Token', decimals: 4 },
  { symbol: 'wETH', name: 'Wrapped Ethereum', decimals: 6 },
  { symbol: 'wBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  { symbol: 'UVD', name: 'Universe Dollar', decimals: 2 },
];

const RATES: Record<string, Record<string, number>> = {
  FLUX: { wETH: 0.000351, wBTC: 0.0000114, UVD: 0.042, FLUX: 1 },
  wETH: { FLUX: 2847, wBTC: 0.03256, UVD: 2847 * 0.042, wETH: 1 },
  wBTC: { FLUX: 87340, wETH: 30.7, UVD: 87340 * 0.042, wBTC: 1 },
  UVD:  { FLUX: 23.8, wETH: 0.000351, wBTC: 0.0000115, UVD: 1 },
};

const TOKEN_ICONS: Record<string, { bg: string; label: string }> = {
  FLUX: { bg: 'bg-zinc-200', label: 'F' },
  wETH: { bg: 'bg-zinc-300', label: 'Ξ' },
  wBTC: { bg: 'bg-zinc-400', label: '₿' },
  UVD:  { bg: 'bg-zinc-500', label: 'U' },
};

function TokenSelector({
  value,
  onChange,
  exclude,
}: {
  value: string;
  onChange: (t: string) => void;
  exclude: string;
}) {
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
        <div className="absolute top-full left-0 mt-2 w-44 bg-zinc-900 border border-border-default z-50 overflow-hidden">
          {TOKENS.filter((t) => t.symbol !== exclude).map((t) => (
            <button
              key={t.symbol}
              onClick={() => { onChange(t.symbol); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left ${value === t.symbol ? 'bg-zinc-800' : ''}`}
            >
              <div className={`w-7 h-7 ${TOKEN_ICONS[t.symbol].bg} flex items-center justify-center text-black font-mono font-black text-xs flex-shrink-0`}>
                {TOKEN_ICONS[t.symbol].label}
              </div>
              <div>
                <p className="font-mono font-semibold text-white text-sm leading-none">{t.symbol}</p>
                <p className="text-zinc-500 text-[10px] mt-0.5">{t.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SwapTab() {
  const [fromToken, setFromToken] = useState('FLUX');
  const [toToken, setToToken] = useState('wETH');
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [showSettings, setShowSettings] = useState(false);

  const rate = RATES[fromToken]?.[toToken] ?? 0;
  const toAmount = fromAmount ? (parseFloat(fromAmount) * rate * (1 - 0.003)).toFixed(6) : '';
  const priceImpact = fromAmount && parseFloat(fromAmount) > 10000 ? '0.12' : '< 0.01';
  const fee = fromAmount ? (parseFloat(fromAmount) * 0.003).toFixed(4) : '0.0000';

  const flip = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount || '');
  }, [fromToken, toToken, toAmount]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">You Pay</span>
        <button
          onClick={() => setShowSettings((p) => !p)}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-mono"
        >
          <Settings2 size={13} />
          Slippage: {slippage}%
        </button>
      </div>

      {showSettings && (
        <div className="bg-zinc-900 border border-border-default p-4">
          <p className="text-xs font-mono font-semibold text-zinc-400 mb-3 uppercase tracking-wider">Slippage Tolerance</p>
          <div className="flex gap-2">
            {['0.1', '0.5', '1.0'].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`flex-1 py-2 text-sm font-mono font-semibold transition-all duration-150 ${
                  slippage === s
                    ? 'bg-dot-green/10 text-dot-green border border-dot-green'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-border-subtle'
                }`}
              >
                {s}%
              </button>
            ))}
            <input
              type="number"
              value={!['0.1', '0.5', '1.0'].includes(slippage) ? slippage : ''}
              onChange={(e) => setSlippage(e.target.value)}
              placeholder="Custom"
              className="flex-1 bg-zinc-800 border border-border-default px-3 py-2 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-border-strong"
            />
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-border-default p-4 hover:border-border-strong transition-colors">
        <div className="flex items-center justify-between gap-3">
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-2xl font-mono font-bold text-white placeholder:text-zinc-700 focus:outline-none min-w-0"
          />
          <TokenSelector value={fromToken} onChange={setFromToken} exclude={toToken} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-600 font-mono">
            {fromAmount ? `≈ $${(parseFloat(fromAmount) * (fromToken === 'FLUX' ? 0.042 : fromToken === 'wETH' ? 2847 * 0.042 : fromToken === 'wBTC' ? 87340 * 0.042 : 1)).toFixed(2)}` : '$0.00'}
          </span>
          <span className="text-xs text-zinc-600 font-mono">Balance: 4,200.00</span>
        </div>
      </div>

      <div className="flex justify-center -my-1 relative z-10">
        <button
          onClick={flip}
          className="w-10 h-10 bg-zinc-800 border border-border-default hover:bg-zinc-700 hover:border-border-strong flex items-center justify-center transition-all duration-200 active:scale-90"
        >
          <ArrowUpDown size={16} className="text-zinc-300" />
        </button>
      </div>

      <div>
        <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">You Receive</span>
      </div>

      <div className="bg-zinc-900 border border-border-default p-4">
        <div className="flex items-center justify-between gap-3">
          <input
            type="number"
            value={toAmount}
            readOnly
            placeholder="0.00"
            className="flex-1 bg-transparent text-2xl font-mono font-bold text-white placeholder:text-zinc-700 focus:outline-none min-w-0 cursor-default"
          />
          <TokenSelector value={toToken} onChange={setToToken} exclude={fromToken} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-600 font-mono">
            {toAmount ? `≈ $${(parseFloat(toAmount) * (toToken === 'FLUX' ? 0.042 : toToken === 'wETH' ? 2847 * 0.042 : toToken === 'wBTC' ? 87340 * 0.042 : 1)).toFixed(2)}` : '$0.00'}
          </span>
          <span className="text-xs text-zinc-600 font-mono">Balance: 0.00</span>
        </div>
      </div>

      {fromAmount && parseFloat(fromAmount) > 0 && (
        <div className="bg-zinc-900/60 border border-border-subtle p-4 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 flex items-center gap-1.5 font-mono">
              <Info size={12} />
              Rate
            </span>
            <span className="text-zinc-300 font-mono font-medium">
              1 {fromToken} = {rate.toFixed(6)} {toToken}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 font-mono">Price Impact</span>
            <span className={`font-mono font-medium ${parseFloat(priceImpact) > 0.1 ? 'text-zinc-200' : 'text-dot-green'}`}>
              {priceImpact}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 font-mono">Fee (0.3%)</span>
            <span className="text-zinc-300 font-mono font-medium">{fee} {fromToken}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 font-mono">Slippage</span>
            <span className="text-zinc-300 font-mono font-medium">{slippage}%</span>
          </div>
          <div className="pt-1 border-t border-border-subtle flex items-center justify-between text-sm">
            <span className="text-zinc-500 font-mono">Min. Received</span>
            <span className="text-white font-mono font-semibold">
              {(parseFloat(toAmount || '0') * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken}
            </span>
          </div>
        </div>
      )}

      <button
        disabled={!fromAmount || parseFloat(fromAmount) <= 0}
        className="w-full py-4 font-mono font-bold text-base transition-all duration-200 relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
        style={{
          background: 'transparent',
          color: fromAmount && parseFloat(fromAmount) > 0 ? '#4ADE80' : '#555555',
          border: fromAmount && parseFloat(fromAmount) > 0 ? '1px solid #4ADE80' : '1px solid #2A3348',
        }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {fromAmount && parseFloat(fromAmount) > 0 ? 'Swap Tokens' : 'Enter an amount'}
        </span>
      </button>
    </div>
  );
}

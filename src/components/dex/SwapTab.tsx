import { useState, useCallback } from 'react';
import { ArrowUpDown, ChevronDown, Info, Settings2 } from 'lucide-react';
import TokenIcon from './TokenIcon';
import { usePrices, getRate, getTokenUsdPrice } from '../../hooks/usePrices';
import { formatTokenSymbol, PHI_SYMBOL } from '../../lib/tokenDisplay';

const TOKENS = [
  { symbol: 'FLUX', name: PHI_SYMBOL, decimals: 4 },
  { symbol: 'wETH', name: 'Wrapped Ethereum', decimals: 6 },
  { symbol: 'wBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  { symbol: 'UVD', name: 'Universe Dollar', decimals: 2 },
];

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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 bg-bg-inset hover:bg-bg-card-hover border border-border-default hover:border-border-strong px-3 py-2 transition-all duration-150"
      >
        <TokenIcon symbol={value} size="sm" />
        <span className="font-mono font-bold text-text-primary text-sm">{formatTokenSymbol(value)}</span>
        <ChevronDown size={13} className="text-text-secondary" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-bg-card border border-border-default z-50 overflow-hidden">
          {TOKENS.filter((t) => t.symbol !== exclude).map((t) => (
            <button
              key={t.symbol}
              onClick={() => { onChange(t.symbol); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-card-hover transition-colors text-left ${value === t.symbol ? 'bg-bg-card-hover' : ''}`}
            >
              <TokenIcon symbol={t.symbol} size="md" />
              <div>
                <p className="font-mono font-semibold text-text-primary text-sm leading-none">{formatTokenSymbol(t.symbol)}</p>
                <p className="text-text-muted text-[10px] mt-0.5">{t.name}</p>
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
  const { prices } = usePrices();

  const rate = getRate(prices, fromToken, toToken);
  const toAmount = fromAmount ? (parseFloat(fromAmount) * rate * (1 - 0.003)).toFixed(6) : '';
  const priceImpact = fromAmount && parseFloat(fromAmount) > 10000 ? '0.12' : '< 0.01';
  const fee = fromAmount ? (parseFloat(fromAmount) * 0.003).toFixed(4) : '0.0000';

  const flip = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount || '');
  }, [fromToken, toToken, toAmount]);

  const fromUsd = fromAmount
    ? (parseFloat(fromAmount) * getTokenUsdPrice(prices, fromToken)).toFixed(2)
    : '0.00';
  const toUsd = toAmount
    ? (parseFloat(toAmount) * getTokenUsdPrice(prices, toToken)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted font-mono uppercase tracking-wider">You Pay</span>
        <button
          onClick={() => setShowSettings((p) => !p)}
          className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors text-xs font-mono"
        >
          <Settings2 size={13} />
          Slippage: {slippage}%
        </button>
      </div>

      {showSettings && (
        <div className="bg-bg-card border border-border-default p-4">
          <p className="text-xs font-mono font-semibold text-text-secondary mb-3 uppercase tracking-wider">Slippage Tolerance</p>
          <div className="flex gap-2">
            {['0.1', '0.5', '1.0'].map((s) => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`flex-1 py-2 text-sm font-mono font-semibold transition-all duration-150 ${
                  slippage === s
                    ? 'bg-dot-green/10 text-dot-green border border-dot-green'
                    : 'bg-bg-inset text-text-secondary hover:bg-bg-card-hover border border-border-subtle'
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
              className="flex-1 bg-bg-inset border border-border-default px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-faint focus:outline-none focus:border-border-strong"
            />
          </div>
        </div>
      )}

      <div className="bg-bg-card border border-border-default p-4 hover:border-border-strong transition-colors">
        <div className="flex items-center justify-between gap-3">
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-2xl font-mono font-bold text-text-primary placeholder:text-text-faint focus:outline-none min-w-0"
          />
          <TokenSelector value={fromToken} onChange={setFromToken} exclude={toToken} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-text-muted font-mono">
            {fromAmount ? `\u2248 $${fromUsd}` : '$0.00'}
          </span>
          <span className="text-xs text-text-muted font-mono">Balance: 4,200.00</span>
        </div>
      </div>

      <div className="flex justify-center -my-1 relative z-10">
        <button
          onClick={flip}
          className="w-10 h-10 bg-bg-inset border border-border-default hover:bg-bg-card-hover hover:border-border-strong flex items-center justify-center transition-all duration-200 active:scale-90"
        >
          <ArrowUpDown size={16} className="text-text-primary" />
        </button>
      </div>

      <div>
        <span className="text-xs text-text-muted font-mono uppercase tracking-wider">You Receive</span>
      </div>

      <div className="bg-bg-card border border-border-default p-4">
        <div className="flex items-center justify-between gap-3">
          <input
            type="number"
            value={toAmount}
            readOnly
            placeholder="0.00"
            className="flex-1 bg-transparent text-2xl font-mono font-bold text-text-primary placeholder:text-text-faint focus:outline-none min-w-0 cursor-default"
          />
          <TokenSelector value={toToken} onChange={setToToken} exclude={fromToken} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-text-muted font-mono">
            {toAmount ? `\u2248 $${toUsd}` : '$0.00'}
          </span>
          <span className="text-xs text-text-muted font-mono">Balance: 0.00</span>
        </div>
      </div>

      {fromAmount && parseFloat(fromAmount) > 0 && (
        <div className="bg-bg-card/60 border border-border-subtle p-4 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted flex items-center gap-1.5 font-mono">
              <Info size={12} />
              Rate
            </span>
            <span className="text-text-primary font-mono font-medium">
              1 {formatTokenSymbol(fromToken)} = {rate.toFixed(6)} {formatTokenSymbol(toToken)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted font-mono">Price Impact</span>
            <span className={`font-mono font-medium ${parseFloat(priceImpact) > 0.1 ? 'text-text-primary' : 'text-dot-green'}`}>
              {priceImpact}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted font-mono">Fee (0.3%)</span>
            <span className="text-text-primary font-mono font-medium">{fee} {formatTokenSymbol(fromToken)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted font-mono">Slippage</span>
            <span className="text-text-primary font-mono font-medium">{slippage}%</span>
          </div>
          <div className="pt-1 border-t border-border-subtle flex items-center justify-between text-sm">
            <span className="text-text-muted font-mono">Min. Received</span>
            <span className="text-text-primary font-mono font-semibold">
              {(parseFloat(toAmount || '0') * (1 - parseFloat(slippage) / 100)).toFixed(6)} {formatTokenSymbol(toToken)}
            </span>
          </div>
        </div>
      )}

      <button
        disabled={!fromAmount || parseFloat(fromAmount) <= 0}
        className="w-full py-4 font-mono font-bold text-base transition-all duration-200 relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
        style={{
          background: 'transparent',
          color: fromAmount && parseFloat(fromAmount) > 0 ? '#4ADE80' : 'var(--color-text-faint)',
          border: fromAmount && parseFloat(fromAmount) > 0 ? '1px solid #4ADE80' : '1px solid var(--color-border-default)',
        }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {fromAmount && parseFloat(fromAmount) > 0 ? 'Swap Tokens' : 'Enter an amount'}
        </span>
      </button>
    </div>
  );
}

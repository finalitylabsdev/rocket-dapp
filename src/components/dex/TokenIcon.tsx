import UvdIcon from '../brand/UvdIcon';

const TOKEN_ICONS: Record<string, { bg: string; label: string }> = {
  FLUX: { bg: 'bg-zinc-200', label: 'F' },
  wETH: { bg: 'bg-zinc-300', label: '\u039E' },
  wBTC: { bg: 'bg-zinc-400', label: '\u20BF' },
  UVD:  { bg: 'bg-zinc-200', label: '' },
};

const SIZE_MAP = {
  xs: { box: 'w-5 h-5', text: 'text-[10px]', icon: 10 },
  sm: { box: 'w-6 h-6', text: 'text-xs', icon: 13 },
  md: { box: 'w-7 h-7', text: 'text-xs', icon: 15 },
  lg: { box: 'w-8 h-8', text: 'text-xs', icon: 18 },
} as const;

interface TokenIconProps {
  symbol: string;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

export default function TokenIcon({ symbol, size = 'sm', className = '' }: TokenIconProps) {
  const tok = TOKEN_ICONS[symbol] ?? { bg: 'bg-zinc-500', label: '?' };
  const s = SIZE_MAP[size];

  return (
    <div
      className={`${s.box} ${tok.bg} flex items-center justify-center text-black font-mono font-black ${s.text} flex-shrink-0 ${className}`}
    >
      {symbol === 'UVD' ? (
        <UvdIcon size={s.icon} color="black" />
      ) : (
        tok.label
      )}
    </div>
  );
}

export { TOKEN_ICONS };

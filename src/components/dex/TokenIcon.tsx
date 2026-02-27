import UvdIcon from '../brand/UvdIcon';

const TOKEN_ICONS: Record<string, { bg: string; label: string; color?: string }> = {
  FLUX: { bg: 'linear-gradient(135deg, #d9ff9c 0%, #b8ff55 100%)', label: 'F', color: '#09100a' },
  wETH: { bg: 'linear-gradient(135deg, #d9dee9 0%, #aeb7c8 100%)', label: '\u039E', color: '#111827' },
  wBTC: { bg: 'linear-gradient(135deg, #ffe8af 0%, #ffb84d 100%)', label: '\u20BF', color: '#1f1605' },
  UVD:  { bg: 'linear-gradient(135deg, #f8f9ff 0%, #d4dbf7 100%)', label: '', color: '#111827' },
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
  const tok = TOKEN_ICONS[symbol] ?? { bg: 'linear-gradient(135deg, #a1a1aa 0%, #71717a 100%)', label: '?', color: '#111827' };
  const s = SIZE_MAP[size];

  return (
    <div
      className={`${s.box} flex items-center justify-center font-mono font-black ${s.text} flex-shrink-0 rounded-full ${className}`}
      style={{
        background: tok.bg,
        color: tok.color ?? '#111827',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 20px rgba(7,10,18,0.12)',
      }}
    >
      {symbol === 'UVD' ? (
        <UvdIcon size={s.icon} color={tok.color ?? '#111827'} />
      ) : (
        tok.label
      )}
    </div>
  );
}

export { TOKEN_ICONS };

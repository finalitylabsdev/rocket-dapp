interface PhiSymbolProps {
  size?: number;
  color?: string;
  animated?: boolean;
  className?: string;
}

export default function PhiSymbol({ size = 24, color = 'currentColor', animated = false, className = '' }: PhiSymbolProps) {
  const strokeWidth = Math.max(1.2, size / 16);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.32;
  const vTop = cy - size * 0.42;
  const vBot = cy + size * 0.42;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
      style={animated ? { animation: 'phiSpin 6s linear infinite' } : undefined}
      aria-label="φ Entropy token"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      <line
        x1={cx}
        y1={vTop}
        x2={cx}
        y2={vBot}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

interface PhiBadgeProps {
  value: string | number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function PhiBadge({ value, size = 'md', color }: PhiBadgeProps) {
  const sizeMap = { sm: 14, md: 16, lg: 20 };
  const textSize = { sm: 'text-[11px]', md: 'text-xs', lg: 'text-sm' };
  const iconSize = sizeMap[size];
  const accent = color ?? '#E8ECF4';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold ${textSize[size]}`}
      style={{ color: accent }}
    >
      <PhiSymbol size={iconSize} color={accent} />
      {value}
    </span>
  );
}

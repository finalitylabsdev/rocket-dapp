export type RocketSection =
  | 'core-engine'
  | 'wing-plates'
  | 'fuel-cells'
  | 'navigation'
  | 'payload-bay'
  | 'thruster-array'
  | 'propulsion-cables'
  | 'shielding';

export const SECTION_META: Record<RocketSection, { label: string; description: string }> = {
  'core-engine':        { label: 'Core Engine',        description: 'Primary thrust generation' },
  'wing-plates':        { label: 'Wing-Plates',        description: 'Aerodynamic stability' },
  'fuel-cells':         { label: 'Fuel Cells',         description: 'Energy storage' },
  'navigation':         { label: 'Navigation',         description: 'Sensors & guidance' },
  'payload-bay':        { label: 'Payload Bay',        description: 'Cargo storage' },
  'thruster-array':     { label: 'Thruster Array',     description: 'Secondary propulsion' },
  'propulsion-cables':  { label: 'Propulsion Cables',  description: 'Power transmission' },
  'shielding':          { label: 'Shielding',          description: 'Defensive armour' },
};

interface SectionIconProps {
  section: RocketSection;
  size?: number;
  color?: string;
  filled?: boolean;
  className?: string;
}

export default function SectionIcon({ section, size = 24, color = 'currentColor', filled = false, className = '' }: SectionIconProps) {
  const sw = Math.max(1, size / 16);
  const cap: React.SVGProps<SVGLineElement>['strokeLinecap'] = 'round';
  const join: React.SVGProps<SVGPolylineElement>['strokeLinejoin'] = 'round';
  const s = size;

  const shared = { stroke: color, strokeWidth: sw, strokeLinecap: cap, strokeLinejoin: join, fill: 'none' } as const;
  const fill = filled ? color : 'none';

  const icons: Record<RocketSection, React.ReactNode> = {
    'core-engine': (
      <>
        <ellipse cx={s*0.5} cy={s*0.45} rx={s*0.22} ry={s*0.28} {...shared} />
        <circle cx={s*0.5} cy={s*0.45} r={s*0.1} fill={filled ? color : undefined} stroke={color} strokeWidth={sw} />
        <path d={`M${s*0.28} ${s*0.73} L${s*0.2} ${s*0.9} L${s*0.38} ${s*0.84} L${s*0.5} ${s*0.92} L${s*0.62} ${s*0.84} L${s*0.8} ${s*0.9} L${s*0.72} ${s*0.73}`} {...shared} fill={fill} fillOpacity="0.3" />
        <line x1={s*0.5} y1={s*0.17} x2={s*0.5} y2={s*0.1} {...shared} />
      </>
    ),
    'wing-plates': (
      <>
        <path d={`M${s*0.5} ${s*0.2} L${s*0.5} ${s*0.8}`} {...shared} />
        <path d={`M${s*0.5} ${s*0.35} L${s*0.08} ${s*0.55} L${s*0.08} ${s*0.65} L${s*0.5} ${s*0.5}`} {...shared} fill={fill} fillOpacity="0.3" />
        <path d={`M${s*0.5} ${s*0.35} L${s*0.92} ${s*0.55} L${s*0.92} ${s*0.65} L${s*0.5} ${s*0.5}`} {...shared} fill={fill} fillOpacity="0.3" />
      </>
    ),
    'fuel-cells': (
      <>
        <rect x={s*0.28} y={s*0.18} width={s*0.44} height={s*0.64} rx={s*0.1} {...shared} fill={fill} fillOpacity="0.2" />
        <line x1={s*0.28} y1={s*0.38} x2={s*0.72} y2={s*0.38} {...shared} />
        <line x1={s*0.28} y1={s*0.54} x2={s*0.72} y2={s*0.54} {...shared} />
        <line x1={s*0.28} y1={s*0.7} x2={s*0.72} y2={s*0.7} {...shared} />
        <circle cx={s*0.5} cy={s*0.28} r={s*0.06} fill={color} />
      </>
    ),
    'navigation': (
      <>
        <circle cx={s*0.5} cy={s*0.5} r={s*0.34} {...shared} />
        <line x1={s*0.5} y1={s*0.16} x2={s*0.5} y2={s*0.84} {...shared} />
        <line x1={s*0.16} y1={s*0.5} x2={s*0.84} y2={s*0.5} {...shared} />
        <circle cx={s*0.5} cy={s*0.5} r={s*0.1} fill={filled ? color : 'none'} stroke={color} strokeWidth={sw} />
      </>
    ),
    'payload-bay': (
      <>
        <rect x={s*0.18} y={s*0.28} width={s*0.64} height={s*0.48} rx={s*0.06} {...shared} fill={fill} fillOpacity="0.2" />
        <path d={`M${s*0.28} ${s*0.28} L${s*0.32} ${s*0.18} L${s*0.68} ${s*0.18} L${s*0.72} ${s*0.28}`} {...shared} />
        <line x1={s*0.5} y1={s*0.28} x2={s*0.5} y2={s*0.76} {...shared} />
        <line x1={s*0.18} y1={s*0.52} x2={s*0.82} y2={s*0.52} {...shared} />
      </>
    ),
    'thruster-array': (
      <>
        <rect x={s*0.22} y={s*0.16} width={s*0.56} height={s*0.38} rx={s*0.06} {...shared} fill={fill} fillOpacity="0.2" />
        <line x1={s*0.3} y1={s*0.54} x2={s*0.26} y2={s*0.84} {...shared} />
        <line x1={s*0.42} y1={s*0.54} x2={s*0.4} y2={s*0.88} {...shared} />
        <line x1={s*0.58} y1={s*0.54} x2={s*0.6} y2={s*0.88} {...shared} />
        <line x1={s*0.7} y1={s*0.54} x2={s*0.74} y2={s*0.84} {...shared} />
        <line x1={s*0.22} y1={s*0.35} x2={s*0.78} y2={s*0.35} {...shared} strokeOpacity={0.4} />
      </>
    ),
    'propulsion-cables': (
      <>
        <path d={`M${s*0.2} ${s*0.3} C${s*0.3} ${s*0.3} ${s*0.2} ${s*0.5} ${s*0.5} ${s*0.5} C${s*0.8} ${s*0.5} ${s*0.7} ${s*0.7} ${s*0.8} ${s*0.7}`} {...shared} />
        <circle cx={s*0.2} cy={s*0.3} r={s*0.06} fill={color} />
        <circle cx={s*0.8} cy={s*0.7} r={s*0.06} fill={color} />
        <path d={`M${s*0.25} ${s*0.55} C${s*0.35} ${s*0.55} ${s*0.25} ${s*0.72} ${s*0.55} ${s*0.72}`} {...shared} strokeOpacity={0.5} />
      </>
    ),
    'shielding': (
      <>
        <path d={`M${s*0.5} ${s*0.1} L${s*0.85} ${s*0.26} L${s*0.85} ${s*0.56} C${s*0.85} ${s*0.74} ${s*0.67} ${s*0.88} ${s*0.5} ${s*0.92} C${s*0.33} ${s*0.88} ${s*0.15} ${s*0.74} ${s*0.15} ${s*0.56} L${s*0.15} ${s*0.26} Z`} {...shared} fill={fill} fillOpacity="0.2" />
        <path d={`M${s*0.5} ${s*0.22} L${s*0.74} ${s*0.33} L${s*0.74} ${s*0.54} C${s*0.74} ${s*0.66} ${s*0.63} ${s*0.76} ${s*0.5} ${s*0.8} C${s*0.37} ${s*0.76} ${s*0.26} ${s*0.66} ${s*0.26} ${s*0.54} L${s*0.26} ${s*0.33} Z`} {...shared} strokeOpacity={0.5} />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={className}
      aria-label={SECTION_META[section].label}
    >
      {icons[section]}
    </svg>
  );
}

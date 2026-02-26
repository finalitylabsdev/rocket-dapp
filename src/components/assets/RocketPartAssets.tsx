interface PartAssetProps {
  size?: number;
  animated?: boolean;
}

export function RocketBaseFrame({ size = 200, animated = true }: PartAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rbf-body" cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#3A4050" />
          <stop offset="50%" stopColor="#1E2432" />
          <stop offset="100%" stopColor="#0C1018" />
        </radialGradient>
        <linearGradient id="rbf-panel" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A5268" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#8A94A8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#2A3040" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="rbf-seam" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8A94A8" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#C0C8D4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#4A5268" stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id="rbf-light" cx="40%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#C0C8D4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="rbf-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="rbf-shadow">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000" floodOpacity="0.75" />
        </filter>
      </defs>

      <ellipse cx="100" cy="186" rx="45" ry="7" fill="black" fillOpacity="0.55" />

      <g filter="url(#rbf-shadow)">
        <path d="M100 28 C100 28 72 50 72 80 L72 152 L128 152 L128 80 C128 50 100 28 100 28 Z" fill="url(#rbf-body)" />
        <path d="M72 80 L60 90 L60 148 L72 152 Z" fill="#0E1420" fillOpacity="0.8" />
        <path d="M128 80 L140 90 L140 148 L128 152 Z" fill="#0A0E18" fillOpacity="0.9" />

        <path d="M72 80 L60 90 L60 148 L72 152 Z" fill="url(#rbf-panel)" fillOpacity="0.5" />
        <path d="M128 80 L140 90 L140 148 L128 152 Z" fill="url(#rbf-panel)" fillOpacity="0.4" />

        <rect x="72" y="108" width="56" height="44" rx="0" fill="#0C0E18" fillOpacity="0.6" />
        <rect x="80" y="152" width="40" height="10" rx="3" fill="#141824" fillOpacity="0.9" />
        <rect x="84" y="162" width="32" height="6" rx="2" fill="#0E1020" />
      </g>

      <path d="M100 28 C100 28 72 50 72 80 L128 80 C128 50 100 28 100 28 Z" fill="url(#rbf-light)" />

      <line x1="72" y1="80" x2="128" y2="80" stroke="url(#rbf-seam)" strokeWidth="1.5" />
      <line x1="72" y1="108" x2="128" y2="108" stroke="url(#rbf-seam)" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="72" y1="130" x2="128" y2="130" stroke="url(#rbf-seam)" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="72" y1="152" x2="128" y2="152" stroke="url(#rbf-seam)" strokeWidth="1.5" />

      <line x1="100" y1="30" x2="100" y2="168" stroke="#8A94A8" strokeWidth="0.8" strokeOpacity="0.25" />
      <line x1="86" y1="80" x2="86" y2="152" stroke="#8A94A8" strokeWidth="0.5" strokeOpacity="0.2" />
      <line x1="114" y1="80" x2="114" y2="152" stroke="#8A94A8" strokeWidth="0.5" strokeOpacity="0.2" />

      <rect x="84" y="86" width="32" height="20" rx="4" fill="#0A0E18" stroke="#3A4258" strokeWidth="0.8" />
      <rect x="87" y="89" width="26" height="14" rx="3" fill="#06B6D4" fillOpacity="0.06" />
      <line x1="87" y1="96" x2="113" y2="96" stroke="#4A5268" strokeWidth="0.6" />

      <rect x="84" y="113" width="14" height="14" rx="3" fill="#0A0E18" stroke="#3A4258" strokeWidth="0.8" />
      <rect x="102" y="113" width="14" height="14" rx="3" fill="#0A0E18" stroke="#3A4258" strokeWidth="0.8" />
      <rect x="84" y="132" width="14" height="14" rx="3" fill="#0A0E18" stroke="#3A4258" strokeWidth="0.8" />
      <rect x="102" y="132" width="14" height="14" rx="3" fill="#0A0E18" stroke="#3A4258" strokeWidth="0.8" />

      <g filter="url(#rbf-glow)" stroke="#8A94A8" strokeWidth="1.2" fill="none">
        <path d="M100 28 C100 28 72 50 72 80 L128 80 C128 50 100 28 100 28 Z" strokeOpacity="0.4" />
        <line x1="72" y1="80" x2="60" y2="90" strokeOpacity="0.5" />
        <line x1="128" y1="80" x2="140" y2="90" strokeOpacity="0.5" />
        <line x1="60" y1="90" x2="60" y2="148" strokeOpacity="0.4" />
        <line x1="140" y1="90" x2="140" y2="148" strokeOpacity="0.4" />
        <line x1="60" y1="148" x2="72" y2="152" strokeOpacity="0.5" />
        <line x1="140" y1="148" x2="128" y2="152" strokeOpacity="0.5" />
      </g>

      <circle cx="100" cy="42" r="5" fill="#8A94A8" fillOpacity="0.2" />
      <circle cx="100" cy="42" r="2" fill="#C0C8D4" fillOpacity="0.5" />
      <line x1="100" y1="28" x2="100" y2="46" stroke="#8A94A8" strokeWidth="0.8" strokeOpacity="0.4" />

      <ellipse cx="100" cy="100" rx="44" ry="44" fill="#8A94A8" fillOpacity="0.03" style={{ filter: 'blur(16px)' }} />
      <ellipse cx="100" cy="38" rx="22" ry="8" fill="#C0C8D4" fillOpacity="0.08" style={{ filter: 'blur(8px)' }} />

      {animated && (
        <style>{`@keyframes rbf-shine{0%,100%{opacity:0.4}50%{opacity:0.9}}`}</style>
      )}
    </svg>
  );
}

export function RocketCore({ size = 200, animated = true }: PartAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rc-body" cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#302010" />
          <stop offset="45%" stopColor="#1A1208" />
          <stop offset="100%" stopColor="#0A0804" />
        </radialGradient>
        <linearGradient id="rc-inlay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD060" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#F09020" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#C06010" stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id="rc-energy" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF0A0" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#FF8C20" stopOpacity="0.6" />
          <stop offset="65%" stopColor="#E05010" stopOpacity="0.25" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="rc-exhaust" cx="50%" cy="0%" r="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#FFC840" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#FF6010" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="rc-vent-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8020" stopOpacity="0.8" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="rc-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="rc-core-glow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="rc-shadow">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000" floodOpacity="0.8" />
        </filter>
      </defs>

      <ellipse cx="100" cy="176" rx="46" ry="16" fill="#FF6010" fillOpacity="0.08" style={{ filter: 'blur(12px)' }} />
      <ellipse cx="100" cy="186" rx="44" ry="7" fill="black" fillOpacity="0.6" />

      <g filter="url(#rc-shadow)">
        <path d="M100 30 C100 30 74 52 74 82 L74 148 L126 148 L126 82 C126 52 100 30 100 30 Z" fill="url(#rc-body)" />

        <rect x="68" y="100" width="10" height="30" rx="4" fill="#1A1208" stroke="url(#rc-inlay)" strokeWidth="1" />
        <rect x="122" y="100" width="10" height="30" rx="4" fill="#1A1208" stroke="url(#rc-inlay)" strokeWidth="1" />

        <rect x="68" y="82" width="10" height="14" rx="3" fill="#1A1208" stroke="url(#rc-inlay)" strokeWidth="0.8" />
        <rect x="122" y="82" width="10" height="14" rx="3" fill="#1A1208" stroke="url(#rc-inlay)" strokeWidth="0.8" />
      </g>

      <line x1="74" y1="82" x2="126" y2="82" stroke="url(#rc-inlay)" strokeWidth="1.5" />
      <line x1="74" y1="105" x2="126" y2="105" stroke="url(#rc-inlay)" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="74" y1="125" x2="126" y2="125" stroke="url(#rc-inlay)" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="74" y1="148" x2="126" y2="148" stroke="url(#rc-inlay)" strokeWidth="1.5" />
      <line x1="100" y1="32" x2="100" y2="148" stroke="url(#rc-inlay)" strokeWidth="0.8" strokeOpacity="0.3" />

      <g filter="url(#rc-glow)" stroke="url(#rc-inlay)" strokeWidth="1.5" fill="none">
        <path d="M100 30 C100 30 74 52 74 82 L126 82 C126 52 100 30 100 30 Z" strokeOpacity="0.6" />
        <line x1="74" y1="82" x2="68" y2="82" />
        <line x1="126" y1="82" x2="132" y2="82" />
        <line x1="68" y1="82" x2="68" y2="96" />
        <line x1="132" y1="82" x2="132" y2="96" />
        <line x1="68" y1="130" x2="68" y2="148" />
        <line x1="132" y1="130" x2="132" y2="148" />
        <line x1="68" y1="148" x2="74" y2="148" />
        <line x1="132" y1="148" x2="126" y2="148" />
      </g>

      <g filter="url(#rc-glow)">
        {[110, 118, 126, 134].map((y, i) => (
          <rect key={i} x="68" y={y} width="10" height="5" rx="1" fill="url(#rc-vent-glow)" fillOpacity={0.6 - i * 0.1} />
        ))}
        {[110, 118, 126, 134].map((y, i) => (
          <rect key={i + 10} x="122" y={y} width="10" height="5" rx="1" fill="url(#rc-vent-glow)" fillOpacity={0.6 - i * 0.1} />
        ))}
      </g>

      <g filter="url(#rc-core-glow)">
        <ellipse cx="100" cy="102" rx="20" ry="20" fill="url(#rc-energy)" />
        <ellipse cx="100" cy="102" rx="9" ry="9" fill="#FFF0A0" fillOpacity="0.7" />
        <ellipse cx="100" cy="102" rx="3.5" ry="3.5" fill="white" fillOpacity="0.9" />
        <ellipse cx="98" cy="100" rx="1.5" ry="1.5" fill="white" />
      </g>

      <path d="M80 148 Q85 162 100 170 Q115 162 120 148 Z" fill="url(#rc-exhaust)" />
      <ellipse cx="100" cy="165" rx="12" ry="5" fill="#FFA020" fillOpacity="0.6" style={{ filter: 'blur(3px)' }} />
      <ellipse cx="100" cy="170" rx="7" ry="3" fill="white" fillOpacity="0.7" style={{ filter: 'blur(2px)' }} />

      <ellipse cx="100" cy="40" rx="20" ry="7" fill="#FFD040" fillOpacity="0.1" style={{ filter: 'blur(8px)' }} />
      <ellipse cx="100" cy="100" rx="48" ry="48" fill="#FF6010" fillOpacity="0.06" style={{ filter: 'blur(20px)' }} />

      {animated && (
        <style>{`
          @keyframes rc-flame { 0%,100%{opacity:0.7;transform:scaleY(1)} 50%{opacity:1;transform:scaleY(1.15)} }
          @keyframes rc-core { 0%,100%{opacity:0.8} 50%{opacity:1} }
        `}</style>
      )}
    </svg>
  );
}

export function FuelTank({ size = 200, animated = true }: PartAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ft-body" cx="32%" cy="25%" r="72%">
          <stop offset="0%" stopColor="#2A3040" />
          <stop offset="50%" stopColor="#161C28" />
          <stop offset="100%" stopColor="#080C12" />
        </radialGradient>
        <linearGradient id="ft-side" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1A2030" />
          <stop offset="100%" stopColor="#0A0E18" />
        </linearGradient>
        <linearGradient id="ft-panel-seam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A5878" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#7A8AA0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#3A4868" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="ft-indicator" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0" />
          <stop offset="40%" stopColor="#22C55E" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#4ADE80" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#86EFAC" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="ft-cap-top" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#404A5A" />
          <stop offset="100%" stopColor="#181E28" />
        </radialGradient>
        <radialGradient id="ft-cap-bot" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#303844" />
          <stop offset="100%" stopColor="#101418" />
        </radialGradient>
        <filter id="ft-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="ft-indicator-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="ft-shadow">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000" floodOpacity="0.75" />
        </filter>
      </defs>

      <ellipse cx="100" cy="186" rx="38" ry="6" fill="black" fillOpacity="0.55" />

      <g filter="url(#ft-shadow)">
        <ellipse cx="100" cy="48" rx="28" ry="16" fill="url(#ft-cap-top)" />
        <rect x="72" y="48" width="56" height="106" rx="0" fill="url(#ft-body)" />
        <rect x="66" y="48" width="6" height="106" rx="0" fill="url(#ft-side)" />
        <rect x="128" y="48" width="6" height="106" rx="0" fill="#080A10" />
        <ellipse cx="100" cy="154" rx="28" ry="16" fill="url(#ft-cap-bot)" />
      </g>

      <rect x="72" y="48" width="56" height="106" fill="#22C55E" fillOpacity="0.03" />

      <line x1="72" y1="48" x2="128" y2="48" stroke="url(#ft-panel-seam)" strokeWidth="1.5" />
      {[70, 90, 110, 130].map((y) => (
        <line key={y} x1="72" y1={y} x2="128" y2={y} stroke="url(#ft-panel-seam)" strokeWidth="0.7" strokeOpacity="0.5" />
      ))}
      <line x1="72" y1="154" x2="128" y2="154" stroke="url(#ft-panel-seam)" strokeWidth="1.5" />

      <rect x="96" y="52" width="8" height="98" rx="4" fill="#080C14" stroke="#2A3848" strokeWidth="0.8" />
      <g filter="url(#ft-indicator-glow)">
        <rect x="97" y="82" width="6" height="68" rx="3" fill="url(#ft-indicator)" />
      </g>
      <ellipse cx="100" cy="82" rx="4" ry="2.5" fill="#86EFAC" fillOpacity="0.7" style={{ filter: 'blur(2px)' }} />

      <rect x="76" y="58" width="14" height="20" rx="3" fill="#0C1018" stroke="#2A3848" strokeWidth="0.8" />
      <rect x="78" y="61" width="10" height="14" rx="2" fill="#22C55E" fillOpacity="0.08" />
      <line x1="78" y1="68" x2="88" y2="68" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.4" />

      <rect x="110" y="72" width="14" height="22" rx="3" fill="#0C1018" stroke="#2A3848" strokeWidth="0.8" />
      <line x1="110" y1="79" x2="124" y2="79" stroke="#4A5868" strokeWidth="0.5" />
      <line x1="110" y1="84" x2="124" y2="84" stroke="#4A5868" strokeWidth="0.5" />
      <line x1="110" y1="89" x2="124" y2="89" stroke="#4A5868" strokeWidth="0.5" />

      <rect x="76" y="115" width="14" height="14" rx="3" fill="#0C1018" stroke="#2A3848" strokeWidth="0.8" />
      <circle cx="83" cy="122" r="3" fill="none" stroke="#22C55E" strokeWidth="0.8" strokeOpacity="0.5" />
      <circle cx="83" cy="122" r="1" fill="#22C55E" fillOpacity="0.7" />

      <g filter="url(#ft-glow)" stroke="#6A7A98" strokeWidth="1.2" fill="none">
        <ellipse cx="100" cy="48" rx="28" ry="16" strokeOpacity="0.6" />
        <line x1="72" y1="48" x2="66" y2="48" strokeOpacity="0.5" />
        <line x1="128" y1="48" x2="134" y2="48" strokeOpacity="0.5" />
        <line x1="66" y1="48" x2="66" y2="154" strokeOpacity="0.4" />
        <line x1="134" y1="48" x2="134" y2="154" strokeOpacity="0.4" />
        <line x1="66" y1="154" x2="72" y2="154" strokeOpacity="0.5" />
        <line x1="134" y1="154" x2="128" y2="154" strokeOpacity="0.5" />
        <ellipse cx="100" cy="154" rx="28" ry="16" strokeOpacity="0.5" />
      </g>

      <ellipse cx="100" cy="100" rx="40" ry="60" fill="#22C55E" fillOpacity="0.03" style={{ filter: 'blur(16px)' }} />
      <ellipse cx="100" cy="48" rx="18" ry="6" fill="#6A7A98" fillOpacity="0.1" style={{ filter: 'blur(6px)' }} />

      {animated && (
        <style>{`@keyframes ft-fill{0%,100%{opacity:0.6}50%{opacity:1}}`}</style>
      )}
    </svg>
  );
}

export function StabilizerWings({ size = 200, animated = true }: PartAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sw-left" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3A4458" />
          <stop offset="50%" stopColor="#1E2838" />
          <stop offset="100%" stopColor="#0C1018" />
        </linearGradient>
        <linearGradient id="sw-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2A3248" />
          <stop offset="50%" stopColor="#161C28" />
          <stop offset="100%" stopColor="#080C14" />
        </linearGradient>
        <linearGradient id="sw-top" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#3E4A5E" />
          <stop offset="100%" stopColor="#1A2030" />
        </linearGradient>
        <linearGradient id="sw-edge-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8A94A8" stopOpacity="0.8" />
          <stop offset="40%" stopColor="#C0C8D8" stopOpacity="1" />
          <stop offset="100%" stopColor="#5A6478" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id="sw-joint-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8A94A8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="sw-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="sw-shadow">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000" floodOpacity="0.75" />
        </filter>
      </defs>

      <ellipse cx="100" cy="186" rx="55" ry="7" fill="black" fillOpacity="0.5" />

      <g filter="url(#sw-shadow)">
        <path d="M86 80 L30 155 L58 148 L86 118 Z" fill="url(#sw-left)" />
        <path d="M114 80 L170 155 L142 148 L114 118 Z" fill="url(#sw-right)" />

        <path d="M86 80 L30 155 L38 158 L86 126 Z" fill="#0C1018" fillOpacity="0.5" />
        <path d="M114 80 L170 155 L162 158 L114 126 Z" fill="#080A12" fillOpacity="0.5" />

        <rect x="82" y="40" width="36" height="120" rx="8" fill="url(#sw-top)" />
        <rect x="82" y="40" width="8" height="120" rx="4" fill="#1A2030" fillOpacity="0.7" />
        <rect x="110" y="40" width="8" height="120" rx="4" fill="#0C1018" fillOpacity="0.8" />
      </g>

      <line x1="86" y1="80" x2="30" y2="155" stroke="url(#sw-edge-accent)" strokeWidth="1.5" />
      <line x1="30" y1="155" x2="58" y2="148" stroke="url(#sw-edge-accent)" strokeWidth="1" strokeOpacity="0.7" />
      <line x1="86" y1="118" x2="58" y2="148" stroke="url(#sw-edge-accent)" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="86" y1="80" x2="86" y2="118" stroke="url(#sw-edge-accent)" strokeWidth="1.2" strokeOpacity="0.5" />

      <line x1="114" y1="80" x2="170" y2="155" stroke="url(#sw-edge-accent)" strokeWidth="1.5" />
      <line x1="170" y1="155" x2="142" y2="148" stroke="url(#sw-edge-accent)" strokeWidth="1" strokeOpacity="0.7" />
      <line x1="114" y1="118" x2="142" y2="148" stroke="url(#sw-edge-accent)" strokeWidth="1" strokeOpacity="0.6" />
      <line x1="114" y1="80" x2="114" y2="118" stroke="url(#sw-edge-accent)" strokeWidth="1.2" strokeOpacity="0.5" />

      {[0, 1, 2].map((i) => {
        const t = i / 3;
        const x1 = 86 - t * 56;
        const y1 = 80 + t * 75;
        const x2 = 86 + t * (58 - 86);
        const y2 = 80 + t * (148 - 80);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#8A94A8" strokeWidth="0.6" strokeOpacity="0.25" />
        );
      })}

      {[0, 1, 2].map((i) => {
        const t = i / 3;
        const x1 = 114 + t * 56;
        const y1 = 80 + t * 75;
        const x2 = 114 + t * (142 - 114);
        const y2 = 80 + t * (148 - 80);
        return (
          <line key={i + 10} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#8A94A8" strokeWidth="0.6" strokeOpacity="0.25" />
        );
      })}

      <line x1="82" y1="40" x2="118" y2="40" stroke="url(#sw-edge-accent)" strokeWidth="1.5" />
      {[60, 80, 100, 120, 140].map((y) => (
        <line key={y} x1="82" y1={y} x2="118" y2={y} stroke="#8A94A8" strokeWidth="0.7" strokeOpacity="0.3" />
      ))}
      <line x1="82" y1="160" x2="118" y2="160" stroke="url(#sw-edge-accent)" strokeWidth="1.5" />

      <g filter="url(#sw-glow)">
        <ellipse cx="86" cy="80" rx="6" ry="6" fill="url(#sw-joint-glow)" />
        <circle cx="86" cy="80" r="3.5" fill="#8A94A8" fillOpacity="0.4" stroke="#C0C8D8" strokeWidth="0.8" />
        <circle cx="86" cy="80" r="1.5" fill="#E0E8F0" fillOpacity="0.7" />

        <ellipse cx="114" cy="80" rx="6" ry="6" fill="url(#sw-joint-glow)" />
        <circle cx="114" cy="80" r="3.5" fill="#8A94A8" fillOpacity="0.4" stroke="#C0C8D8" strokeWidth="0.8" />
        <circle cx="114" cy="80" r="1.5" fill="#E0E8F0" fillOpacity="0.7" />

        <ellipse cx="86" cy="118" rx="5" ry="5" fill="url(#sw-joint-glow)" />
        <circle cx="86" cy="118" r="2.5" fill="#8A94A8" fillOpacity="0.3" stroke="#C0C8D8" strokeWidth="0.8" />

        <ellipse cx="114" cy="118" rx="5" ry="5" fill="url(#sw-joint-glow)" />
        <circle cx="114" cy="118" r="2.5" fill="#8A94A8" fillOpacity="0.3" stroke="#C0C8D8" strokeWidth="0.8" />
      </g>

      <ellipse cx="100" cy="100" rx="55" ry="55" fill="#8A94A8" fillOpacity="0.03" style={{ filter: 'blur(18px)' }} />
      <ellipse cx="100" cy="42" rx="20" ry="5" fill="#C0C8D8" fillOpacity="0.08" style={{ filter: 'blur(6px)' }} />

      {animated && (
        <style>{`@keyframes sw-shine{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>
      )}
    </svg>
  );
}

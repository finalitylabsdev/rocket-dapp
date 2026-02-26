interface BoxAssetProps {
  size?: number;
  animated?: boolean;
}

export function CommonBox({ size = 200, animated = true }: BoxAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cb-bg" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#1C2030" />
          <stop offset="100%" stopColor="#06080F" />
        </radialGradient>
        <radialGradient id="cb-face-top" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#3A3F50" />
          <stop offset="50%" stopColor="#22273A" />
          <stop offset="100%" stopColor="#141824" />
        </radialGradient>
        <radialGradient id="cb-face-front" cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#2C3144" />
          <stop offset="60%" stopColor="#1A1F2E" />
          <stop offset="100%" stopColor="#0E1118" />
        </radialGradient>
        <radialGradient id="cb-face-right" cx="30%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#1E2232" />
          <stop offset="100%" stopColor="#0C0F18" />
        </radialGradient>
        <linearGradient id="cb-edge-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A84B" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#F0C060" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#A87830" stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id="cb-nebula" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2A3050" stopOpacity="0.5" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="cb-glow-edge">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="cb-soft-shadow">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000000" floodOpacity="0.7" />
        </filter>
      </defs>

      <ellipse cx="100" cy="185" rx="58" ry="8" fill="black" fillOpacity="0.5" />

      <g filter="url(#cb-soft-shadow)">
        <polygon points="100,38 152,62 152,138 100,162 48,138 48,62" fill="url(#cb-face-front)" />
        <polygon points="100,38 152,62 178,50 126,26" fill="url(#cb-face-top)" />
        <polygon points="152,62 178,50 178,126 152,138" fill="url(#cb-face-right)" />
      </g>

      <polygon points="100,38 152,62 152,138 100,162 48,138 48,62" fill="url(#cb-nebula)" fillOpacity="0.4" />

      <g filter="url(#cb-glow-edge)" stroke="url(#cb-edge-glow)" strokeWidth="1.2" fill="none">
        <line x1="100" y1="38" x2="152" y2="62" />
        <line x1="152" y1="62" x2="152" y2="138" />
        <line x1="152" y1="138" x2="100" y2="162" />
        <line x1="100" y1="162" x2="48" y2="138" />
        <line x1="48" y1="138" x2="48" y2="62" />
        <line x1="48" y1="62" x2="100" y2="38" />
        <line x1="100" y1="38" x2="126" y2="26" />
        <line x1="126" y1="26" x2="178" y2="50" />
        <line x1="178" y1="50" x2="152" y2="62" />
        <line x1="178" y1="50" x2="178" y2="126" />
        <line x1="178" y1="126" x2="152" y2="138" />
      </g>

      <line x1="100" y1="38" x2="100" y2="162" stroke="#D4A84B" strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="48" y1="100" x2="152" y2="100" stroke="#D4A84B" strokeWidth="0.5" strokeOpacity="0.25" />

      <line x1="48" y1="62" x2="152" y2="62" stroke="#D4A84B" strokeWidth="0.6" strokeOpacity="0.35" />

      <ellipse cx="100" cy="100" rx="14" ry="14" fill="#D4A84B" fillOpacity="0.08" />
      <ellipse cx="100" cy="100" rx="6" ry="6" fill="#D4A84B" fillOpacity="0.15" />
      <ellipse cx="100" cy="100" rx="2" ry="2" fill="#D4A84B" fillOpacity="0.5" />

      <line x1="88" y1="100" x2="112" y2="100" stroke="#D4A84B" strokeWidth="0.8" strokeOpacity="0.4" />
      <line x1="100" y1="88" x2="100" y2="112" stroke="#D4A84B" strokeWidth="0.8" strokeOpacity="0.4" />

      <rect x="87" y="58" width="26" height="4" rx="2" fill="#D4A84B" fillOpacity="0.2" />

      <ellipse cx="126" cy="38" rx="28" ry="10" fill="#D4A84B" fillOpacity="0.06" style={{ filter: 'blur(6px)' }} />
      <ellipse cx="100" cy="100" rx="35" ry="35" fill="#D4A84B" fillOpacity="0.04" style={{ filter: 'blur(14px)' }} />

      {animated && (
        <style>{`
          @keyframes cb-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        `}</style>
      )}
    </svg>
  );
}

export function RareBox({ size = 200, animated = true }: BoxAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rb-face-top" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#3A3220" />
          <stop offset="45%" stopColor="#241E10" />
          <stop offset="100%" stopColor="#10100A" />
        </radialGradient>
        <radialGradient id="rb-face-front" cx="35%" cy="25%" r="78%">
          <stop offset="0%" stopColor="#2E2618" />
          <stop offset="55%" stopColor="#1C1810" />
          <stop offset="100%" stopColor="#0C0C08" />
        </radialGradient>
        <radialGradient id="rb-face-right" cx="25%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#201C10" />
          <stop offset="100%" stopColor="#0A0A06" />
        </radialGradient>
        <linearGradient id="rb-gold-edge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE080" stopOpacity="1" />
          <stop offset="30%" stopColor="#F0C030" stopOpacity="0.9" />
          <stop offset="70%" stopColor="#C89020" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#806010" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="rb-inner-light" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFD060" stopOpacity="0.5" />
          <stop offset="40%" stopColor="#F0A020" stopOpacity="0.25" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <radialGradient id="rb-core-glow" cx="50%" cy="55%" r="40%">
          <stop offset="0%" stopColor="#FFD060" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#F09020" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="rb-edge-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="rb-shadow">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000" floodOpacity="0.75" />
        </filter>
      </defs>

      <ellipse cx="100" cy="186" rx="60" ry="8" fill="black" fillOpacity="0.55" />

      <g filter="url(#rb-shadow)">
        <polygon points="100,36 152,60 152,138 100,162 48,138 48,60" fill="url(#rb-face-front)" />
        <polygon points="100,36 152,60 178,48 126,24" fill="url(#rb-face-top)" />
        <polygon points="152,60 178,48 178,126 152,138" fill="url(#rb-face-right)" />
      </g>

      <polygon points="100,36 152,60 152,138 100,162 48,138 48,60" fill="url(#rb-inner-light)" />
      <polygon points="100,36 152,60 152,138 100,162 48,138 48,60" fill="url(#rb-core-glow)" />

      <g filter="url(#rb-edge-glow)" stroke="url(#rb-gold-edge)" strokeWidth="1.5" fill="none">
        <line x1="100" y1="36" x2="152" y2="60" />
        <line x1="152" y1="60" x2="152" y2="138" />
        <line x1="152" y1="138" x2="100" y2="162" />
        <line x1="100" y1="162" x2="48" y2="138" />
        <line x1="48" y1="138" x2="48" y2="60" />
        <line x1="48" y1="60" x2="100" y2="36" />
        <line x1="100" y1="36" x2="126" y2="24" />
        <line x1="126" y1="24" x2="178" y2="48" />
        <line x1="178" y1="48" x2="152" y2="60" />
        <line x1="178" y1="48" x2="178" y2="126" />
        <line x1="178" y1="126" x2="152" y2="138" />
      </g>

      <line x1="100" y1="36" x2="100" y2="162" stroke="#FFD060" strokeWidth="0.8" strokeOpacity="0.35" />
      <line x1="48" y1="99" x2="152" y2="99" stroke="#FFD060" strokeWidth="0.8" strokeOpacity="0.3" />
      <line x1="48" y1="60" x2="152" y2="60" stroke="#FFD060" strokeWidth="0.9" strokeOpacity="0.4" />
      <line x1="48" y1="79" x2="152" y2="79" stroke="#FFD060" strokeWidth="0.4" strokeOpacity="0.18" />
      <line x1="48" y1="119" x2="152" y2="119" stroke="#FFD060" strokeWidth="0.4" strokeOpacity="0.18" />

      <rect x="63" y="38" width="74" height="18" rx="0" fill="#FFD060" fillOpacity="0.06" />

      <ellipse cx="100" cy="102" rx="18" ry="18" fill="#FFD060" fillOpacity="0.12" />
      <ellipse cx="100" cy="102" rx="9" ry="9" fill="#FFD060" fillOpacity="0.2" />
      <ellipse cx="100" cy="102" rx="3.5" ry="3.5" fill="#FFD060" fillOpacity="0.7" />
      <ellipse cx="97" cy="99" rx="1.2" ry="1.2" fill="white" fillOpacity="0.6" />

      <line x1="85" y1="102" x2="115" y2="102" stroke="#FFD060" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="100" y1="87" x2="100" y2="117" stroke="#FFD060" strokeWidth="0.8" strokeOpacity="0.5" />

      <path d="M85 102 L100 86 L115 102 L100 118 Z" stroke="#FFD060" strokeWidth="0.5" strokeOpacity="0.3" fill="none" />

      <ellipse cx="126" cy="36" rx="32" ry="12" fill="#FFD060" fillOpacity="0.1" style={{ filter: 'blur(8px)' }} />
      <ellipse cx="100" cy="100" rx="42" ry="42" fill="#F0A020" fillOpacity="0.06" style={{ filter: 'blur(18px)' }} />

      {animated && (
        <style>{`
          @keyframes rb-shine { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
        `}</style>
      )}
    </svg>
  );
}

export function LegendaryBox({ size = 200, animated = true }: BoxAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lb-face-top" cx="38%" cy="25%" r="72%">
          <stop offset="0%" stopColor="#302818" />
          <stop offset="40%" stopColor="#201808" />
          <stop offset="100%" stopColor="#0C0A04" />
        </radialGradient>
        <radialGradient id="lb-face-front" cx="32%" cy="22%" r="80%">
          <stop offset="0%" stopColor="#281E0E" />
          <stop offset="50%" stopColor="#181208" />
          <stop offset="100%" stopColor="#080604" />
        </radialGradient>
        <radialGradient id="lb-face-right" cx="22%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#1E1608" />
          <stop offset="100%" stopColor="#060604" />
        </radialGradient>
        <linearGradient id="lb-inlay" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE890" stopOpacity="1" />
          <stop offset="25%" stopColor="#FFC840" stopOpacity="1" />
          <stop offset="60%" stopColor="#D49020" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#906010" stopOpacity="0.7" />
        </linearGradient>
        <radialGradient id="lb-energy-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF0A0" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#FFD040" stopOpacity="0.6" />
          <stop offset="65%" stopColor="#F09020" stopOpacity="0.25" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="lb-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD040" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#F09020" stopOpacity="0.08" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="lb-edge-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="lb-core-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="lb-shadow">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000" floodOpacity="0.8" />
        </filter>
      </defs>

      <ellipse cx="100" cy="168" rx="64" ry="18" fill="#FFD040" fillOpacity="0.06" style={{ filter: 'blur(12px)' }} />
      <ellipse cx="100" cy="186" rx="58" ry="7" fill="black" fillOpacity="0.6" />

      <g filter="url(#lb-shadow)">
        <polygon points="100,34 152,58 152,138 100,162 48,138 48,58" fill="url(#lb-face-front)" />
        <polygon points="100,34 152,58 178,46 126,22" fill="url(#lb-face-top)" />
        <polygon points="152,58 178,46 178,124 152,138" fill="url(#lb-face-right)" />
      </g>

      <polygon points="100,34 152,58 152,138 100,162 48,138 48,58" fill="url(#lb-aura)" />

      <polygon points="100,34 152,58 152,138 100,162 48,138 48,58" fill="url(#lb-energy-core)" fillOpacity="0.15" />

      <rect x="56" y="58" width="88" height="4" fill="url(#lb-inlay)" fillOpacity="0.3" />
      <rect x="56" y="80" width="88" height="2" fill="url(#lb-inlay)" fillOpacity="0.15" />
      <rect x="56" y="100" width="88" height="2" fill="url(#lb-inlay)" fillOpacity="0.15" />
      <rect x="56" y="120" width="88" height="2" fill="url(#lb-inlay)" fillOpacity="0.15" />
      <rect x="56" y="138" width="88" height="2" fill="url(#lb-inlay)" fillOpacity="0.2" />

      <line x1="100" y1="58" x2="100" y2="162" stroke="url(#lb-inlay)" strokeWidth="1.5" strokeOpacity="0.3" />
      <line x1="152" y1="78" x2="178" y2="66" stroke="url(#lb-inlay)" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="152" y1="98" x2="178" y2="86" stroke="url(#lb-inlay)" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="152" y1="118" x2="178" y2="106" stroke="url(#lb-inlay)" strokeWidth="0.8" strokeOpacity="0.2" />

      <g filter="url(#lb-edge-glow)" stroke="url(#lb-inlay)" strokeWidth="1.8" fill="none">
        <line x1="100" y1="34" x2="152" y2="58" />
        <line x1="152" y1="58" x2="152" y2="138" />
        <line x1="152" y1="138" x2="100" y2="162" />
        <line x1="100" y1="162" x2="48" y2="138" />
        <line x1="48" y1="138" x2="48" y2="58" />
        <line x1="48" y1="58" x2="100" y2="34" />
        <line x1="100" y1="34" x2="126" y2="22" />
        <line x1="126" y1="22" x2="178" y2="46" />
        <line x1="178" y1="46" x2="152" y2="58" />
        <line x1="178" y1="46" x2="178" y2="124" />
        <line x1="178" y1="124" x2="152" y2="138" />
      </g>

      <g filter="url(#lb-core-glow)">
        <ellipse cx="100" cy="100" rx="22" ry="22" fill="url(#lb-energy-core)" />
        <ellipse cx="100" cy="100" rx="10" ry="10" fill="#FFF0A0" fillOpacity="0.7" />
        <ellipse cx="100" cy="100" rx="4" ry="4" fill="white" fillOpacity="0.9" />
        <ellipse cx="98" cy="98" rx="1.5" ry="1.5" fill="white" />
      </g>

      <path d="M100 78 L104 96 L122 100 L104 104 L100 122 L96 104 L78 100 L96 96 Z" fill="#FFD040" fillOpacity="0.15" />

      <ellipse cx="126" cy="34" rx="36" ry="14" fill="#FFD040" fillOpacity="0.15" style={{ filter: 'blur(10px)' }} />
      <ellipse cx="100" cy="100" rx="50" ry="50" fill="#F09020" fillOpacity="0.08" style={{ filter: 'blur(22px)' }} />

      {animated && (
        <style>{`
          @keyframes lb-core { 0%,100%{opacity:0.7} 50%{opacity:1} }
          @keyframes lb-aura { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        `}</style>
      )}
    </svg>
  );
}

export function QuantumBox({ size = 200, animated = true }: BoxAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="qb-face-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0A1018" />
          <stop offset="50%" stopColor="#060810" />
          <stop offset="100%" stopColor="#020408" />
        </linearGradient>
        <linearGradient id="qb-face-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0E1420" />
          <stop offset="100%" stopColor="#04060C" />
        </linearGradient>
        <linearGradient id="qb-face-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#080C14" />
          <stop offset="100%" stopColor="#020408" />
        </linearGradient>
        <linearGradient id="qb-prism1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="1" />
          <stop offset="33%" stopColor="#A855F7" stopOpacity="1" />
          <stop offset="66%" stopColor="#EF4444" stopOpacity="1" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="qb-prism2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="qb-prism3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#EF4444" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id="qb-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#06B6D4" stopOpacity="0.6" />
          <stop offset="55%" stopColor="#A855F7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="qb-distort" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="qb-edge-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="qb-core-glow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="qb-shadow">
          <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#000" floodOpacity="0.85" />
        </filter>
        <filter id="qb-distortion">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      <ellipse cx="100" cy="172" rx="66" ry="22" fill="#06B6D4" fillOpacity="0.05" style={{ filter: 'blur(16px)' }} />
      <ellipse cx="100" cy="172" rx="46" ry="14" fill="#A855F7" fillOpacity="0.05" style={{ filter: 'blur(12px)' }} />
      <ellipse cx="100" cy="186" rx="55" ry="7" fill="black" fillOpacity="0.65" />

      <g filter="url(#qb-shadow)">
        <polygon points="100,32 152,56 152,138 100,162 48,138 48,56" fill="url(#qb-face-front)" />
        <polygon points="100,32 152,56 178,44 126,20" fill="url(#qb-face-top)" />
        <polygon points="152,56 178,44 178,122 152,138" fill="url(#qb-face-right)" />
      </g>

      <polygon points="100,32 152,56 152,138 100,162 48,138 48,56" fill="url(#qb-distort)" />

      <g filter="url(#qb-edge-glow)" fill="none">
        <line x1="100" y1="32" x2="152" y2="56" stroke="url(#qb-prism1)" strokeWidth="2" />
        <line x1="152" y1="56" x2="152" y2="138" stroke="url(#qb-prism2)" strokeWidth="2" />
        <line x1="152" y1="138" x2="100" y2="162" stroke="url(#qb-prism3)" strokeWidth="2" />
        <line x1="100" y1="162" x2="48" y2="138" stroke="url(#qb-prism1)" strokeWidth="2" />
        <line x1="48" y1="138" x2="48" y2="56" stroke="url(#qb-prism2)" strokeWidth="2" />
        <line x1="48" y1="56" x2="100" y2="32" stroke="url(#qb-prism3)" strokeWidth="2" />
        <line x1="100" y1="32" x2="126" y2="20" stroke="url(#qb-prism1)" strokeWidth="2" />
        <line x1="126" y1="20" x2="178" y2="44" stroke="url(#qb-prism2)" strokeWidth="2" />
        <line x1="178" y1="44" x2="152" y2="56" stroke="url(#qb-prism3)" strokeWidth="2" />
        <line x1="178" y1="44" x2="178" y2="122" stroke="url(#qb-prism1)" strokeWidth="2" />
        <line x1="178" y1="122" x2="152" y2="138" stroke="url(#qb-prism2)" strokeWidth="2" />
      </g>

      <line x1="100" y1="32" x2="100" y2="162" stroke="#06B6D4" strokeWidth="0.8" strokeOpacity="0.25" />
      <line x1="48" y1="97" x2="152" y2="97" stroke="#A855F7" strokeWidth="0.8" strokeOpacity="0.2" />
      <line x1="68" y1="44" x2="132" y2="74" stroke="#EF4444" strokeWidth="0.5" strokeOpacity="0.2" />
      <line x1="68" y1="128" x2="132" y2="152" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.2" />

      <g filter="url(#qb-core-glow)">
        <ellipse cx="100" cy="99" rx="26" ry="26" fill="url(#qb-distort)" />
        <ellipse cx="100" cy="99" rx="14" ry="14" fill="url(#qb-core)" />
        <ellipse cx="100" cy="99" rx="5" ry="5" fill="white" fillOpacity="0.95" />
        <ellipse cx="98" cy="97" rx="2" ry="2" fill="white" />
      </g>

      <circle cx="100" cy="99" r="30" stroke="#06B6D4" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />
      <circle cx="100" cy="99" r="22" stroke="#A855F7" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />

      <path d="M100 75 L105 93 L123 99 L105 105 L100 123 L95 105 L77 99 L95 93 Z" fill="#06B6D4" fillOpacity="0.08" />
      <path d="M100 82 L103 95 L116 99 L103 103 L100 116 L97 103 L84 99 L97 95 Z" stroke="white" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />

      <ellipse cx="100" cy="60" rx="24" ry="8" fill="#06B6D4" fillOpacity="0.04" />
      <ellipse cx="152" cy="97" rx="12" ry="24" fill="#A855F7" fillOpacity="0.04" />
      <ellipse cx="126" cy="32" rx="36" ry="14" fill="white" fillOpacity="0.08" style={{ filter: 'blur(10px)' }} />
      <ellipse cx="100" cy="99" rx="55" ry="55" fill="#A855F7" fillOpacity="0.04" style={{ filter: 'blur(24px)' }} />

      {animated && (
        <style>{`
          @keyframes qb-prism { 0%{opacity:0.7} 33%{opacity:1} 66%{opacity:0.8} 100%{opacity:0.7} }
          @keyframes qb-rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>
      )}
    </svg>
  );
}

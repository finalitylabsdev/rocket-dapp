interface ModuleAssetProps {
  size?: number;
  animated?: boolean;
}

export function AuctionPodium({ size = 200, animated = true }: ModuleAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ap-base" cx="50%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#1A1A28" />
          <stop offset="60%" stopColor="#0E0E1C" />
          <stop offset="100%" stopColor="#060610" />
        </radialGradient>
        <radialGradient id="ap-surface" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#28283A" />
          <stop offset="55%" stopColor="#181825" />
          <stop offset="100%" stopColor="#0A0A14" />
        </radialGradient>
        <linearGradient id="ap-ring" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9333EA" stopOpacity="0.9" />
          <stop offset="25%" stopColor="#C026D3" stopOpacity="1" />
          <stop offset="50%" stopColor="#7C3AED" stopOpacity="1" />
          <stop offset="75%" stopColor="#9333EA" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id="ap-ring-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9333EA" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.1" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="ap-shimmer" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C026D3" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#9333EA" stopOpacity="0.1" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="ap-ring-glow-fx">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="ap-shimmer-fx">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="ap-shadow">
          <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000" floodOpacity="0.8" />
        </filter>
      </defs>

      <ellipse cx="100" cy="185" rx="62" ry="9" fill="black" fillOpacity="0.6" />
      <ellipse cx="100" cy="175" rx="55" ry="18" fill="#9333EA" fillOpacity="0.06" style={{ filter: 'blur(14px)' }} />

      <g filter="url(#ap-shadow)">
        <ellipse cx="100" cy="120" rx="66" ry="22" fill="url(#ap-base)" />
        <rect x="34" y="100" width="132" height="20" rx="2" fill="url(#ap-base)" />
        <ellipse cx="100" cy="100" rx="66" ry="22" fill="url(#ap-surface)" />
      </g>

      <ellipse cx="100" cy="148" rx="50" ry="11" fill="#0A0A14" />
      <rect x="50" y="136" width="100" height="12" rx="0" fill="#0A0A14" />
      <ellipse cx="100" cy="136" rx="50" ry="11" fill="#141424" />
      <rect x="50" y="120" width="100" height="16" rx="0" fill="#141424" />
      <ellipse cx="100" cy="120" rx="50" ry="11" fill="#1C1C30" />

      <g filter="url(#ap-shimmer-fx)">
        <ellipse cx="100" cy="100" rx="62" ry="20" fill="url(#ap-shimmer)" />
      </g>

      <g filter="url(#ap-ring-glow-fx)">
        <ellipse cx="100" cy="100" rx="60" ry="20" stroke="url(#ap-ring)" strokeWidth="2.5" fill="none" />
      </g>

      <ellipse cx="100" cy="100" rx="60" ry="20" fill="url(#ap-ring-glow)" />

      <line x1="40" y1="120" x2="160" y2="120" stroke="#9333EA" strokeWidth="0.8" strokeOpacity="0.3" />
      <line x1="50" y1="136" x2="150" y2="136" stroke="#9333EA" strokeWidth="0.8" strokeOpacity="0.25" />
      <line x1="50" y1="148" x2="150" y2="148" stroke="#9333EA" strokeWidth="0.6" strokeOpacity="0.2" />
      <line x1="34" y1="100" x2="34" y2="120" stroke="#9333EA" strokeWidth="0.8" strokeOpacity="0.3" />
      <line x1="166" y1="100" x2="166" y2="120" stroke="#9333EA" strokeWidth="0.8" strokeOpacity="0.3" />

      <ellipse cx="100" cy="100" rx="28" ry="9" fill="#9333EA" fillOpacity="0.06" />
      <ellipse cx="100" cy="100" rx="12" ry="4" fill="#C026D3" fillOpacity="0.15" />

      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = 100 + Math.cos(angle) * 46;
        const y = 100 + Math.sin(angle) * 15;
        return (
          <ellipse key={i} cx={x} cy={y} rx="2.5" ry="1.5"
            fill="#9333EA" fillOpacity="0.7"
            style={{ filter: 'blur(1px)' }} />
        );
      })}

      <ellipse cx="100" cy="100" rx="4" ry="2" fill="#C026D3" fillOpacity="0.5" />
      <ellipse cx="100" cy="100" rx="1.5" ry="1" fill="white" fillOpacity="0.6" />

      <g filter="url(#ap-ring-glow-fx)">
        <ellipse cx="100" cy="100" rx="60" ry="20" stroke="#C026D3" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
        <ellipse cx="100" cy="100" rx="48" ry="16" stroke="#9333EA" strokeWidth="0.5" strokeOpacity="0.2" fill="none" />
      </g>

      <ellipse cx="100" cy="98" rx="20" ry="7" fill="#C026D3" fillOpacity="0.08" style={{ filter: 'blur(8px)' }} />

      <rect x="60" y="62" width="80" height="38" rx="8" fill="#0C0C1A" stroke="#9333EA" strokeWidth="0.6" strokeOpacity="0.2" />
      <line x1="60" y1="78" x2="140" y2="78" stroke="#9333EA" strokeWidth="0.5" strokeOpacity="0.2" />
      <rect x="68" y="66" width="64" height="10" rx="2" fill="#9333EA" fillOpacity="0.06" />
      <line x1="68" y1="83" x2="120" y2="83" stroke="#6A7A98" strokeWidth="0.5" strokeOpacity="0.4" />
      <line x1="68" y1="88" x2="108" y2="88" stroke="#6A7A98" strokeWidth="0.5" strokeOpacity="0.3" />

      <line x1="100" y1="62" x2="100" y2="100" stroke="#9333EA" strokeWidth="0.6" strokeOpacity="0.2" strokeDasharray="2 3" />

      {animated && (
        <style>{`
          @keyframes ap-ring { 0%,100%{opacity:0.7} 50%{opacity:1} }
          @keyframes ap-shimmer { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
        `}</style>
      )}
    </svg>
  );
}

export function LaunchPlatform({ size = 200, animated = true }: ModuleAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="lp-surface" cx="40%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#2E2E3A" />
          <stop offset="50%" stopColor="#1A1A24" />
          <stop offset="100%" stopColor="#0A0A10" />
        </radialGradient>
        <radialGradient id="lp-rim" cx="50%" cy="50%" r="50%">
          <stop offset="75%" stopColor="transparent" />
          <stop offset="88%" stopColor="#3A3A48" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2A2A36" stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id="lp-side" cx="40%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#1E1E28" />
          <stop offset="100%" stopColor="#0A0A10" />
        </radialGradient>
        <radialGradient id="lp-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8C20" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#FF5010" stopOpacity="0.1" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="lp-light-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="lp-smoke">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="lp-shadow">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000" floodOpacity="0.8" />
        </filter>
      </defs>

      <ellipse cx="100" cy="186" rx="70" ry="9" fill="black" fillOpacity="0.6" />

      <g filter="url(#lp-shadow)">
        <ellipse cx="100" cy="130" rx="72" ry="24" fill="#080810" />
        <rect x="28" y="107" width="144" height="24" rx="0" fill="#0C0C14" />
        <ellipse cx="100" cy="107" rx="72" ry="24" fill="url(#lp-surface)" />
      </g>

      <ellipse cx="100" cy="107" rx="72" ry="24" fill="url(#lp-rim)" />
      <ellipse cx="100" cy="107" rx="55" ry="18" fill="#141420" fillOpacity="0.9" />

      <line x1="28" y1="107" x2="172" y2="107" stroke="#3A3A50" strokeWidth="0.8" strokeOpacity="0.5" />
      <line x1="28" y1="130" x2="172" y2="130" stroke="#2A2A38" strokeWidth="0.6" strokeOpacity="0.4" />
      <line x1="28" y1="107" x2="28" y2="130" stroke="#2A2A38" strokeWidth="0.6" strokeOpacity="0.4" />
      <line x1="172" y1="107" x2="172" y2="130" stroke="#2A2A38" strokeWidth="0.6" strokeOpacity="0.4" />

      <ellipse cx="100" cy="107" rx="50" ry="16" fill="url(#lp-center)" />

      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x = 100 + Math.cos(angle) * 60;
        const y = 107 + Math.sin(angle) * 20;
        return (
          <g key={i} filter="url(#lp-light-glow)">
            <ellipse cx={x} cy={y} rx="3" ry="2" fill="#FF6010" fillOpacity="0.9" />
            <ellipse cx={x} cy={y} rx="5" ry="3.5" fill="#FF4000" fillOpacity="0.3" />
          </g>
        );
      })}

      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = 100 + Math.cos(angle) * 38;
        const y = 107 + Math.sin(angle) * 13;
        return (
          <g key={i + 20}>
            <line x1="100" y1="107"
              x2={x} y2={y}
              stroke="#3A3A50" strokeWidth="0.7" strokeOpacity="0.4" />
          </g>
        );
      })}

      {[...Array(4)].map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const x = 100 + Math.cos(angle) * 38;
        const y = 107 + Math.sin(angle) * 13;
        return (
          <g key={i + 30} filter="url(#lp-light-glow)">
            <ellipse cx={x} cy={y} rx="2" ry="1.5" fill="#FF8020" fillOpacity="0.6" />
          </g>
        );
      })}

      <ellipse cx="100" cy="107" rx="14" ry="5" fill="#FF5010" fillOpacity="0.15" />
      <ellipse cx="100" cy="107" rx="6" ry="2.5" fill="#FF6020" fillOpacity="0.3" />
      <ellipse cx="100" cy="107" rx="2.5" ry="1.5" fill="#FF8030" fillOpacity="0.7" />

      <g filter="url(#lp-smoke)">
        <ellipse cx="80" cy="100" rx="10" ry="6" fill="white" fillOpacity="0.04" />
        <ellipse cx="120" cy="96" rx="8" ry="5" fill="white" fillOpacity="0.03" />
        <ellipse cx="90" cy="90" rx="12" ry="7" fill="white" fillOpacity="0.03" />
      </g>

      {[...Array(3)].map((_, i) => {
        const angle = (i / 3) * Math.PI * 2 + 0.5;
        return (
          <line key={i}
            x1={100 + Math.cos(angle) * 28}
            y1={107 + Math.sin(angle) * 10}
            x2={100 + Math.cos(angle) * 70}
            y2={107 + Math.sin(angle) * 24}
            stroke="#2A2A38" strokeWidth="1.5" strokeOpacity="0.4" />
        );
      })}

      <ellipse cx="100" cy="107" rx="70" ry="23" stroke="#3A3A52" strokeWidth="1" fill="none" strokeOpacity="0.4" />
      <ellipse cx="100" cy="107" rx="55" ry="18" stroke="#FF4010" strokeWidth="0.5" fill="none" strokeOpacity="0.2" />

      <ellipse cx="100" cy="107" rx="62" ry="22" fill="#FF4010" fillOpacity="0.04" style={{ filter: 'blur(14px)' }} />

      {animated && (
        <style>{`
          @keyframes lp-lights { 0%,100%{opacity:0.7} 50%{opacity:1} }
          @keyframes lp-smoke { 0%{opacity:0;transform:translateY(0)} 100%{opacity:0.06;transform:translateY(-20px)} }
        `}</style>
      )}
    </svg>
  );
}

export function TrophyAsset({ size = 200, animated = true }: ModuleAssetProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tr-body" cx="35%" cy="22%" r="75%">
          <stop offset="0%" stopColor="#B08040" />
          <stop offset="30%" stopColor="#907030" />
          <stop offset="65%" stopColor="#604820" />
          <stop offset="100%" stopColor="#301808" />
        </radialGradient>
        <radialGradient id="tr-upper" cx="38%" cy="20%" r="70%">
          <stop offset="0%" stopColor="#D0A050" />
          <stop offset="35%" stopColor="#A07830" />
          <stop offset="70%" stopColor="#684E20" />
          <stop offset="100%" stopColor="#2C1608" />
        </radialGradient>
        <linearGradient id="tr-highlight" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#FFE890" stopOpacity="0.7" />
          <stop offset="30%" stopColor="#FFD050" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#C08020" stopOpacity="0.2" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <linearGradient id="tr-base" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#907050" />
          <stop offset="50%" stopColor="#604030" />
          <stop offset="100%" stopColor="#301808" />
        </linearGradient>
        <radialGradient id="tr-star-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE090" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFD050" stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="tr-rim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE880" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#D09030" stopOpacity="0.6" />
        </radialGradient>
        <filter id="tr-glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="tr-star-glow-fx">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="tr-shadow">
          <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000" floodOpacity="0.8" />
        </filter>
      </defs>

      <ellipse cx="100" cy="185" rx="48" ry="7" fill="black" fillOpacity="0.6" />
      <ellipse cx="100" cy="180" rx="40" ry="14" fill="#D09030" fillOpacity="0.07" style={{ filter: 'blur(12px)' }} />

      <g filter="url(#tr-shadow)">
        <rect x="64" y="162" width="72" height="12" rx="4" fill="url(#tr-base)" />
        <rect x="72" y="156" width="56" height="8" rx="3" fill="#604030" />
        <rect x="80" y="150" width="40" height="8" rx="2" fill="#503020" />

        <rect x="86" y="128" width="28" height="22" rx="3" fill="#503020" />

        <path d="M72 60 Q68 80 68 96 Q68 120 80 136 Q90 148 100 148 Q110 148 120 136 Q132 120 132 96 Q132 80 128 60 Z" fill="url(#tr-upper)" />

        <path d="M72 60 L64 60 Q56 60 56 68 Q56 90 68 104 Q72 108 78 112 L80 136 Q68 120 68 96 Q68 80 72 60 Z" fill="url(#tr-body)" />
        <path d="M128 60 L136 60 Q144 60 144 68 Q144 90 132 104 Q128 108 122 112 L120 136 Q132 120 132 96 Q132 80 128 60 Z" fill="url(#tr-body)" />
      </g>

      <path d="M72 60 Q68 80 68 96 Q68 120 80 136 Q90 148 100 148 Q110 148 120 136 Q132 120 132 96 Q132 80 128 60 Z" fill="url(#tr-highlight)" fillOpacity="0.5" />

      <line x1="72" y1="60" x2="128" y2="60" stroke="#FFD050" strokeWidth="2" strokeOpacity="0.6" />
      <ellipse cx="100" cy="60" rx="28" ry="5" stroke="#FFE870" strokeWidth="1" fill="none" strokeOpacity="0.4" />

      <line x1="80" y1="128" x2="120" y2="128" stroke="#FFD050" strokeWidth="1.5" strokeOpacity="0.4" />
      <line x1="80" y1="136" x2="120" y2="136" stroke="#FFD050" strokeWidth="1.2" strokeOpacity="0.35" />
      <line x1="86" y1="148" x2="114" y2="148" stroke="#C08030" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="72" y1="156" x2="128" y2="156" stroke="#C08030" strokeWidth="1.2" strokeOpacity="0.4" />
      <line x1="64" y1="162" x2="136" y2="162" stroke="#D09040" strokeWidth="1.5" strokeOpacity="0.5" />
      <line x1="64" y1="174" x2="136" y2="174" stroke="#B07030" strokeWidth="1" strokeOpacity="0.3" />

      <g filter="url(#tr-star-glow-fx)">
        <ellipse cx="100" cy="98" rx="24" ry="24" fill="url(#tr-star-glow)" />
      </g>
      <g filter="url(#tr-glow)">
        <path d="M100 74 L104 90 L120 90 L107 100 L112 116 L100 106 L88 116 L93 100 L80 90 L96 90 Z"
          fill="#FFE890" fillOpacity="0.7" stroke="#FFD050" strokeWidth="0.5" />
        <path d="M100 80 L103 90 L114 90 L105 97 L108 108 L100 101 L92 108 L95 97 L86 90 L97 90 Z"
          fill="#FFD050" fillOpacity="0.9" />
        <ellipse cx="100" cy="94" rx="5" ry="5" fill="#FFF0A0" fillOpacity="0.8" />
        <ellipse cx="100" cy="94" rx="2" ry="2" fill="white" fillOpacity="0.9" />
      </g>

      <g filter="url(#tr-glow)">
        <path d="M72 60 Q68 80 68 96 Q68 120 80 136 Q90 148 100 148 Q110 148 120 136 Q132 120 132 96 Q132 80 128 60 Z"
          stroke="#FFE870" strokeWidth="1.2" fill="none" strokeOpacity="0.4" />
        <path d="M72 60 L64 60 Q56 60 56 68 Q56 90 68 104 Q72 108 78 112 L80 136"
          stroke="#D09040" strokeWidth="1" fill="none" strokeOpacity="0.5" />
        <path d="M128 60 L136 60 Q144 60 144 68 Q144 90 132 104 Q128 108 122 112 L120 136"
          stroke="#D09040" strokeWidth="1" fill="none" strokeOpacity="0.5" />
      </g>

      <rect x="80" y="62" width="8" height="4" rx="2" fill="#FFE880" fillOpacity="0.4" />
      <rect x="112" y="62" width="8" height="4" rx="2" fill="#FFE880" fillOpacity="0.4" />

      <ellipse cx="100" cy="100" rx="50" ry="50" fill="#FFD040" fillOpacity="0.04" style={{ filter: 'blur(22px)' }} />
      <ellipse cx="100" cy="60" rx="20" ry="7" fill="#FFE050" fillOpacity="0.12" style={{ filter: 'blur(8px)' }} />

      {animated && (
        <style>{`
          @keyframes tr-star { 0%,100%{opacity:0.7} 50%{opacity:1} }
          @keyframes tr-glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
        `}</style>
      )}
    </svg>
  );
}

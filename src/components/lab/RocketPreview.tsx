import { useEffect } from 'react';
import type { RocketModelId } from './RocketModels';

interface EquippedParts {
  engine: boolean;
  fuel: boolean;
  body: boolean;
  wings: boolean;
  booster: boolean;
  noseCone: boolean;
  heatShield: boolean;
  gyroscope: boolean;
  solarPanels: boolean;
  landingStruts: boolean;
}

interface RocketPreviewProps {
  equipped: EquippedParts;
  model: RocketModelId;
  launching: boolean;
  onLaunchComplete: () => void;
}

function StandardRocket({ equipped }: { equipped: EquippedParts }) {
  return (
    <svg width="120" height="280" viewBox="0 0 120 280" fill="none" className="drop-shadow-2xl">
      <defs>
        <radialGradient id="s-bodyGrad" cx="35%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#404040" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
        <radialGradient id="s-nozzleGrad" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#606060" />
          <stop offset="100%" stopColor="#222" />
        </radialGradient>
        <linearGradient id="s-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="40%" stopColor="white" stopOpacity="0.06" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {equipped.noseCone ? (
        <>
          <path d="M60 4 C60 4 44 30 42 58 L78 58 C76 30 60 4 60 4 Z" fill="url(#s-bodyGrad)" stroke="#383838" strokeWidth="1" />
          <path d="M60 4 C60 4 44 30 42 58 L78 58 C76 30 60 4 60 4 Z" fill="url(#s-sheen)" />
          <circle cx="60" cy="22" r="4" fill="#3B82F6" opacity="0.8" />
          <circle cx="60" cy="22" r="2" fill="#60a5fa" opacity="1" />
        </>
      ) : (
        <path d="M60 4 C60 4 44 30 42 58 L78 58 C76 30 60 4 60 4 Z" fill="#141414" stroke="#252525" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.body ? (
        <>
          <path d="M42 56 L38 104 L82 104 L78 56 Z" fill="url(#s-bodyGrad)" stroke="#383838" strokeWidth="1" />
          <path d="M42 56 L38 104 L82 104 L78 56 Z" fill="url(#s-sheen)" />
          <circle cx="60" cy="72" r="7" fill="#2a2a2a" stroke="#404040" strokeWidth="1" />
          <circle cx="60" cy="72" r="4" fill="#4ADE80" opacity="0.6" />
          <circle cx="60" cy="72" r="2" fill="#4ADE80" opacity="0.9" />
          <circle cx="60" cy="92" r="4" fill="#2a2a2a" stroke="#353535" strokeWidth="1" />
          <circle cx="60" cy="92" r="2" fill="#8A94A8" opacity="0.5" />
        </>
      ) : (
        <path d="M42 56 L38 104 L82 104 L78 56 Z" fill="#141414" stroke="#252525" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.heatShield ? (
        <>
          <rect x="36" y="102" width="48" height="10" rx="2" fill="#F59E0B" fillOpacity="0.18" stroke="#F59E0B" strokeOpacity="0.4" strokeWidth="1" />
          <rect x="36" y="102" width="48" height="10" rx="2" fill="url(#s-sheen)" />
        </>
      ) : (
        <rect x="36" y="102" width="48" height="10" rx="2" fill="#0e0e0e" stroke="#222" strokeWidth="1" strokeDasharray="3 2" />
      )}

      {equipped.fuel ? (
        <>
          <rect x="36" y="110" width="48" height="72" rx="4" fill="url(#s-bodyGrad)" stroke="#303030" strokeWidth="1" />
          <rect x="36" y="110" width="48" height="72" rx="4" fill="url(#s-sheen)" />
          {[122, 138, 154, 170].map((y) => (
            <line key={y} x1="38" y1={y} x2="82" y2={y} stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
          ))}
          <rect x="42" y="118" width="10" height="56" rx="3" fill="#1f1f1f" stroke="#2d2d2d" strokeWidth="0.8" />
          <rect x="56" y="118" width="10" height="56" rx="3" fill="#1f1f1f" stroke="#2d2d2d" strokeWidth="0.8" />
          <rect x="70" y="118" width="10" height="56" rx="3" fill="#1f1f1f" stroke="#2d2d2d" strokeWidth="0.8" />
          <rect x="42" y="154" width="10" height="20" rx="2" fill="#4ADE80" fillOpacity="0.15" />
          <rect x="56" y="136" width="10" height="38" rx="2" fill="#4ADE80" fillOpacity="0.12" />
          <rect x="70" y="148" width="10" height="26" rx="2" fill="#4ADE80" fillOpacity="0.1" />
        </>
      ) : (
        <rect x="36" y="110" width="48" height="72" rx="4" fill="#0e0e0e" stroke="#222" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.gyroscope ? (
        <>
          <circle cx="60" cy="185" r="8" fill="#1E2636" stroke="#3B82F6" strokeOpacity="0.5" strokeWidth="1" />
          <circle cx="60" cy="185" r="4" fill="none" stroke="#3B82F6" strokeOpacity="0.7" strokeWidth="1" />
          <line x1="52" y1="185" x2="68" y2="185" stroke="#3B82F6" strokeOpacity="0.5" strokeWidth="0.8" />
          <line x1="60" y1="177" x2="60" y2="193" stroke="#3B82F6" strokeOpacity="0.5" strokeWidth="0.8" />
        </>
      ) : (
        <circle cx="60" cy="185" r="8" fill="#0e0e0e" stroke="#222" strokeWidth="1" strokeDasharray="3 2" />
      )}

      {equipped.solarPanels ? (
        <>
          <rect x="4" y="125" width="28" height="44" rx="2" fill="#1E2636" stroke="#F59E0B" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="4" y1="136" x2="32" y2="136" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <line x1="4" y1="147" x2="32" y2="147" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <line x1="4" y1="158" x2="32" y2="158" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <rect x="32" y="143" width="4" height="8" rx="1" fill="#2a2a2a" />
          <rect x="88" y="125" width="28" height="44" rx="2" fill="#1E2636" stroke="#F59E0B" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="88" y1="136" x2="116" y2="136" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <line x1="88" y1="147" x2="116" y2="147" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <line x1="88" y1="158" x2="116" y2="158" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <rect x="84" y="143" width="4" height="8" rx="1" fill="#2a2a2a" />
        </>
      ) : (
        <>
          <rect x="4" y="125" width="28" height="44" rx="2" fill="#0e0e0e" stroke="#222" strokeWidth="1" strokeDasharray="4 3" />
          <rect x="88" y="125" width="28" height="44" rx="2" fill="#0e0e0e" stroke="#222" strokeWidth="1" strokeDasharray="4 3" />
        </>
      )}

      {equipped.wings ? (
        <>
          <path d="M36 158 L8 200 L12 202 L36 180 Z" fill="url(#s-bodyGrad)" stroke="#353535" strokeWidth="1" />
          <path d="M84 158 L112 200 L108 202 L84 180 Z" fill="url(#s-bodyGrad)" stroke="#353535" strokeWidth="1" />
          <path d="M36 158 L8 200 L12 202 L36 180 Z" fill="url(#s-sheen)" />
          <path d="M84 158 L112 200 L108 202 L84 180 Z" fill="url(#s-sheen)" />
        </>
      ) : (
        <>
          <path d="M36 158 L8 200 L12 202 L36 180 Z" fill="#0e0e0e" stroke="#222" strokeWidth="1" strokeDasharray="4 3" />
          <path d="M84 158 L112 200 L108 202 L84 180 Z" fill="#0e0e0e" stroke="#222" strokeWidth="1" strokeDasharray="4 3" />
        </>
      )}

      {equipped.engine ? (
        <>
          <rect x="38" y="190" width="44" height="28" rx="5" fill="url(#s-bodyGrad)" stroke="#404040" strokeWidth="1" />
          <rect x="38" y="190" width="44" height="28" rx="5" fill="url(#s-sheen)" />
          <rect x="44" y="194" width="10" height="20" rx="3" fill="#252525" stroke="#353535" strokeWidth="0.8" />
          <rect x="56" y="194" width="10" height="20" rx="3" fill="#252525" stroke="#353535" strokeWidth="0.8" />
          <rect x="68" y="194" width="10" height="20" rx="3" fill="#252525" stroke="#353535" strokeWidth="0.8" />
        </>
      ) : (
        <rect x="38" y="190" width="44" height="28" rx="5" fill="#0e0e0e" stroke="#222" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.booster ? (
        <>
          <path d="M38 216 L26 256 L44 248 L60 262 L76 248 L94 256 L82 216 Z" fill="url(#s-nozzleGrad)" stroke="#404040" strokeWidth="1" />
          <path d="M38 216 L26 256 L44 248 L60 262 L76 248 L94 256 L82 216 Z" fill="url(#s-sheen)" />
          <ellipse cx="60" cy="262" rx="14" ry="3" fill="#4ADE80" fillOpacity="0.08" />
        </>
      ) : (
        <path d="M38 216 L26 256 L44 248 L60 262 L76 248 L94 256 L82 216 Z" fill="#0e0e0e" stroke="#222" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.landingStruts && (
        <>
          <line x1="38" y1="254" x2="22" y2="272" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
          <line x1="82" y1="254" x2="98" y2="272" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="262" x2="60" y2="276" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="22" cy="273" rx="4" ry="2" fill="#6B7280" opacity="0.6" />
          <ellipse cx="98" cy="273" rx="4" ry="2" fill="#6B7280" opacity="0.6" />
          <ellipse cx="60" cy="277" rx="4" ry="2" fill="#6B7280" opacity="0.6" />
        </>
      )}

      <rect x="36" y="109" width="48" height="3" rx="1.5" fill="#2a2a2a" opacity="0.8" />
      <rect x="36" y="189" width="48" height="3" rx="1.5" fill="#2a2a2a" opacity="0.6" />
      <rect x="36" y="215" width="48" height="3" rx="1.5" fill="#2a2a2a" opacity="0.6" />
    </svg>
  );
}

function HeavyRocket({ equipped }: { equipped: EquippedParts }) {
  return (
    <svg width="140" height="280" viewBox="0 0 140 280" fill="none" className="drop-shadow-2xl">
      <defs>
        <radialGradient id="h-bodyGrad" cx="35%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#3a3a2a" />
          <stop offset="100%" stopColor="#1a1a0e" />
        </radialGradient>
        <radialGradient id="h-nozzleGrad" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#585840" />
          <stop offset="100%" stopColor="#202010" />
        </radialGradient>
        <linearGradient id="h-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="40%" stopColor="white" stopOpacity="0.05" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="h-amber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#D97706" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {equipped.noseCone ? (
        <>
          <path d="M70 6 C70 6 52 28 50 56 L90 56 C88 28 70 6 70 6 Z" fill="url(#h-bodyGrad)" stroke="#4a4a30" strokeWidth="1.5" />
          <path d="M70 6 C70 6 52 28 50 56 L90 56 C88 28 70 6 70 6 Z" fill="url(#h-sheen)" />
          <circle cx="70" cy="24" r="5" fill="#2a2a18" stroke="#5a5a38" strokeWidth="1" />
          <circle cx="70" cy="24" r="2.5" fill="#F59E0B" opacity="0.8" />
        </>
      ) : (
        <path d="M70 6 C70 6 52 28 50 56 L90 56 C88 28 70 6 70 6 Z" fill="#141410" stroke="#252515" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.body ? (
        <>
          <rect x="44" y="54" width="52" height="56" rx="5" fill="url(#h-bodyGrad)" stroke="#4a4a30" strokeWidth="1.5" />
          <rect x="44" y="54" width="52" height="56" rx="5" fill="url(#h-sheen)" />
          {[66, 78, 90].map((y) => (
            <line key={y} x1="46" y1={y} x2="94" y2={y} stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
          ))}
          <circle cx="70" cy="70" r="9" fill="#2a2a18" stroke="#5a5a38" strokeWidth="1" />
          <circle cx="70" cy="70" r="5" fill="#F59E0B" opacity="0.5" />
          <circle cx="70" cy="70" r="2.5" fill="#F59E0B" opacity="0.9" />
          <rect x="52" y="92" width="36" height="10" rx="3" fill="#1a1a10" stroke="#3a3a22" strokeWidth="0.8" />
          <rect x="56" y="95" width="8" height="4" rx="1" fill="#F59E0B" fillOpacity="0.25" />
          <rect x="68" y="95" width="8" height="4" rx="1" fill="#F59E0B" fillOpacity="0.2" />
        </>
      ) : (
        <rect x="44" y="54" width="52" height="56" rx="5" fill="#141410" stroke="#252515" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.heatShield ? (
        <>
          <rect x="40" y="108" width="60" height="14" rx="3" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeOpacity="0.45" strokeWidth="1.2" />
          <rect x="40" y="108" width="60" height="14" rx="3" fill="url(#h-sheen)" />
          <rect x="44" y="111" width="52" height="2" rx="1" fill="#F59E0B" fillOpacity="0.12" />
          <rect x="44" y="116" width="52" height="2" rx="1" fill="#F59E0B" fillOpacity="0.08" />
        </>
      ) : (
        <rect x="40" y="108" width="60" height="14" rx="3" fill="#0e0e0a" stroke="#222215" strokeWidth="1" strokeDasharray="3 2" />
      )}

      {equipped.fuel ? (
        <>
          <rect x="40" y="120" width="60" height="80" rx="5" fill="url(#h-bodyGrad)" stroke="#3a3a28" strokeWidth="1.5" />
          <rect x="40" y="120" width="60" height="80" rx="5" fill="url(#h-sheen)" />
          {[135, 150, 165, 180].map((y) => (
            <line key={y} x1="42" y1={y} x2="98" y2={y} stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
          ))}
          <rect x="46" y="128" width="14" height="64" rx="3" fill="#1a1a10" stroke="#2e2e1e" strokeWidth="0.8" />
          <rect x="64" y="128" width="14" height="64" rx="3" fill="#1a1a10" stroke="#2e2e1e" strokeWidth="0.8" />
          <rect x="82" y="128" width="14" height="64" rx="3" fill="#1a1a10" stroke="#2e2e1e" strokeWidth="0.8" />
          <rect x="46" y="170" width="14" height="22" rx="2" fill="#4ADE80" fillOpacity="0.15" />
          <rect x="64" y="150" width="14" height="42" rx="2" fill="#4ADE80" fillOpacity="0.12" />
          <rect x="82" y="162" width="14" height="30" rx="2" fill="#4ADE80" fillOpacity="0.1" />
        </>
      ) : (
        <rect x="40" y="120" width="60" height="80" rx="5" fill="#0e0e0a" stroke="#1e1e12" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.gyroscope && (
        <>
          <circle cx="70" cy="206" r="10" fill="#1E2636" stroke="#3B82F6" strokeOpacity="0.5" strokeWidth="1" />
          <circle cx="70" cy="206" r="5" fill="none" stroke="#3B82F6" strokeOpacity="0.7" strokeWidth="1" />
          <line x1="60" y1="206" x2="80" y2="206" stroke="#3B82F6" strokeOpacity="0.5" strokeWidth="0.8" />
          <line x1="70" y1="196" x2="70" y2="216" stroke="#3B82F6" strokeOpacity="0.5" strokeWidth="0.8" />
        </>
      )}

      {equipped.solarPanels ? (
        <>
          <rect x="2" y="132" width="32" height="52" rx="2" fill="#1E2636" stroke="#F59E0B" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="2" y1="145" x2="34" y2="145" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <line x1="2" y1="158" x2="34" y2="158" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <line x1="2" y1="171" x2="34" y2="171" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <rect x="34" y="154" width="6" height="10" rx="1" fill="#2a2a18" />
          <rect x="106" y="132" width="32" height="52" rx="2" fill="#1E2636" stroke="#F59E0B" strokeOpacity="0.5" strokeWidth="1" />
          <line x1="106" y1="145" x2="138" y2="145" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <line x1="106" y1="158" x2="138" y2="158" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <line x1="106" y1="171" x2="138" y2="171" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="0.8" />
          <rect x="100" y="154" width="6" height="10" rx="1" fill="#2a2a18" />
        </>
      ) : (
        <>
          <rect x="2" y="132" width="32" height="52" rx="2" fill="#0e0e0a" stroke="#1e1e10" strokeWidth="1" strokeDasharray="4 3" />
          <rect x="106" y="132" width="32" height="52" rx="2" fill="#0e0e0a" stroke="#1e1e10" strokeWidth="1" strokeDasharray="4 3" />
        </>
      )}

      {equipped.wings ? (
        <>
          <path d="M40 172 L6 218 L14 220 L40 196 Z" fill="url(#h-bodyGrad)" stroke="#3a3a28" strokeWidth="1.2" />
          <path d="M100 172 L134 218 L126 220 L100 196 Z" fill="url(#h-bodyGrad)" stroke="#3a3a28" strokeWidth="1.2" />
          <path d="M40 172 L6 218 L14 220 L40 196 Z" fill="url(#h-sheen)" />
          <path d="M100 172 L134 218 L126 220 L100 196 Z" fill="url(#h-sheen)" />
        </>
      ) : (
        <>
          <path d="M40 172 L6 218 L14 220 L40 196 Z" fill="#0e0e0a" stroke="#1e1e10" strokeWidth="1" strokeDasharray="4 3" />
          <path d="M100 172 L134 218 L126 220 L100 196 Z" fill="#0e0e0a" stroke="#1e1e10" strokeWidth="1" strokeDasharray="4 3" />
        </>
      )}

      {equipped.engine ? (
        <>
          <rect x="42" y="198" width="56" height="32" rx="6" fill="url(#h-bodyGrad)" stroke="#4a4a30" strokeWidth="1.5" />
          <rect x="42" y="198" width="56" height="32" rx="6" fill="url(#h-sheen)" />
          <rect x="48" y="202" width="12" height="24" rx="3" fill="#252515" stroke="#383820" strokeWidth="0.8" />
          <rect x="64" y="202" width="12" height="24" rx="3" fill="#252515" stroke="#383820" strokeWidth="0.8" />
          <rect x="80" y="202" width="12" height="24" rx="3" fill="#252515" stroke="#383820" strokeWidth="0.8" />
        </>
      ) : (
        <rect x="42" y="198" width="56" height="32" rx="6" fill="#0e0e0a" stroke="#1e1e12" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.booster ? (
        <>
          <path d="M42 228 L28 266 L52 256 L70 272 L88 256 L112 266 L98 228 Z" fill="url(#h-nozzleGrad)" stroke="#4a4a30" strokeWidth="1.2" />
          <path d="M42 228 L28 266 L52 256 L70 272 L88 256 L112 266 L98 228 Z" fill="url(#h-sheen)" />
          <ellipse cx="70" cy="272" rx="18" ry="3.5" fill="#4ADE80" fillOpacity="0.08" />
        </>
      ) : (
        <path d="M42 228 L28 266 L52 256 L70 272 L88 256 L112 266 L98 228 Z" fill="#0e0e0a" stroke="#1e1e12" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.landingStruts && (
        <>
          <line x1="42" y1="264" x2="24" y2="276" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="98" y1="264" x2="116" y2="276" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="70" y1="272" x2="70" y2="280" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="24" cy="277" rx="5" ry="2" fill="#6B7280" opacity="0.6" />
          <ellipse cx="116" cy="277" rx="5" ry="2" fill="#6B7280" opacity="0.6" />
          <ellipse cx="70" cy="281" rx="5" ry="2" fill="#6B7280" opacity="0.6" />
        </>
      )}

      <rect x="40" y="107" width="60" height="3" rx="1.5" fill="#3a3a28" opacity="0.8" />
      <rect x="40" y="197" width="60" height="3" rx="1.5" fill="#3a3a28" opacity="0.6" />
      <rect x="40" y="227" width="60" height="3" rx="1.5" fill="#3a3a28" opacity="0.6" />
    </svg>
  );
}

function ScoutRocket({ equipped }: { equipped: EquippedParts }) {
  return (
    <svg width="90" height="280" viewBox="0 0 90 280" fill="none" className="drop-shadow-2xl">
      <defs>
        <radialGradient id="sc-bodyGrad" cx="35%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#1a3a35" />
          <stop offset="100%" stopColor="#0a1a18" />
        </radialGradient>
        <radialGradient id="sc-nozzleGrad" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#20504a" />
          <stop offset="100%" stopColor="#0a1e1c" />
        </radialGradient>
        <linearGradient id="sc-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="40%" stopColor="white" stopOpacity="0.07" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {equipped.noseCone ? (
        <>
          <path d="M45 2 C45 2 34 22 33 50 L57 50 C56 22 45 2 45 2 Z" fill="url(#sc-bodyGrad)" stroke="#1a4a44" strokeWidth="1" />
          <path d="M45 2 C45 2 34 22 33 50 L57 50 C56 22 45 2 45 2 Z" fill="url(#sc-sheen)" />
          <circle cx="45" cy="18" r="3" fill="#06D6A0" opacity="0.8" />
          <circle cx="45" cy="18" r="1.5" fill="#4DF5CE" opacity="1" />
        </>
      ) : (
        <path d="M45 2 C45 2 34 22 33 50 L57 50 C56 22 45 2 45 2 Z" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.body ? (
        <>
          <rect x="32" y="48" width="26" height="66" rx="4" fill="url(#sc-bodyGrad)" stroke="#1a4a44" strokeWidth="1" />
          <rect x="32" y="48" width="26" height="66" rx="4" fill="url(#sc-sheen)" />
          {[62, 76, 90].map((y) => (
            <line key={y} x1="34" y1={y} x2="56" y2={y} stroke="white" strokeWidth="0.5" strokeOpacity="0.06" />
          ))}
          <circle cx="45" cy="65" r="6" fill="#0a2220" stroke="#1a4a44" strokeWidth="1" />
          <circle cx="45" cy="65" r="3.5" fill="#06D6A0" opacity="0.5" />
          <circle cx="45" cy="65" r="1.5" fill="#06D6A0" opacity="0.95" />
          <circle cx="45" cy="85" r="3" fill="#0a2220" stroke="#1a3a38" strokeWidth="0.8" />
          <circle cx="45" cy="85" r="1.5" fill="#06D6A0" opacity="0.4" />
        </>
      ) : (
        <rect x="32" y="48" width="26" height="66" rx="4" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.heatShield ? (
        <>
          <rect x="30" y="112" width="30" height="8" rx="2" fill="#06D6A0" fillOpacity="0.18" stroke="#06D6A0" strokeOpacity="0.4" strokeWidth="1" />
        </>
      ) : (
        <rect x="30" y="112" width="30" height="8" rx="2" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="3 2" />
      )}

      {equipped.fuel ? (
        <>
          <rect x="31" y="118" width="28" height="62" rx="3" fill="url(#sc-bodyGrad)" stroke="#1a3a35" strokeWidth="1" />
          <rect x="31" y="118" width="28" height="62" rx="3" fill="url(#sc-sheen)" />
          {[130, 144, 158, 168].map((y) => (
            <line key={y} x1="33" y1={y} x2="57" y2={y} stroke="white" strokeWidth="0.5" strokeOpacity="0.05" />
          ))}
          <rect x="35" y="122" width="8" height="54" rx="2" fill="#0a1e1c" stroke="#183830" strokeWidth="0.7" />
          <rect x="47" y="122" width="8" height="54" rx="2" fill="#0a1e1c" stroke="#183830" strokeWidth="0.7" />
          <rect x="35" y="160" width="8" height="16" rx="1.5" fill="#4ADE80" fillOpacity="0.15" />
          <rect x="47" y="142" width="8" height="34" rx="1.5" fill="#4ADE80" fillOpacity="0.12" />
        </>
      ) : (
        <rect x="31" y="118" width="28" height="62" rx="3" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.gyroscope && (
        <>
          <circle cx="45" cy="186" r="7" fill="#1E2636" stroke="#3B82F6" strokeOpacity="0.5" strokeWidth="1" />
          <circle cx="45" cy="186" r="3.5" fill="none" stroke="#3B82F6" strokeOpacity="0.7" strokeWidth="0.8" />
          <line x1="38" y1="186" x2="52" y2="186" stroke="#3B82F6" strokeOpacity="0.5" strokeWidth="0.7" />
          <line x1="45" y1="179" x2="45" y2="193" stroke="#3B82F6" strokeOpacity="0.5" strokeWidth="0.7" />
        </>
      )}

      {equipped.solarPanels ? (
        <>
          <rect x="4" y="128" width="24" height="38" rx="2" fill="#1E2636" stroke="#06D6A0" strokeOpacity="0.5" strokeWidth="0.8" />
          <line x1="4" y1="138" x2="28" y2="138" stroke="#06D6A0" strokeOpacity="0.3" strokeWidth="0.7" />
          <line x1="4" y1="148" x2="28" y2="148" stroke="#06D6A0" strokeOpacity="0.3" strokeWidth="0.7" />
          <line x1="4" y1="158" x2="28" y2="158" stroke="#06D6A0" strokeOpacity="0.3" strokeWidth="0.7" />
          <rect x="28" y="141" width="3" height="8" rx="1" fill="#0a2220" />
          <rect x="62" y="128" width="24" height="38" rx="2" fill="#1E2636" stroke="#06D6A0" strokeOpacity="0.5" strokeWidth="0.8" />
          <line x1="62" y1="138" x2="86" y2="138" stroke="#06D6A0" strokeOpacity="0.3" strokeWidth="0.7" />
          <line x1="62" y1="148" x2="86" y2="148" stroke="#06D6A0" strokeOpacity="0.3" strokeWidth="0.7" />
          <line x1="62" y1="158" x2="86" y2="158" stroke="#06D6A0" strokeOpacity="0.3" strokeWidth="0.7" />
          <rect x="59" y="141" width="3" height="8" rx="1" fill="#0a2220" />
        </>
      ) : (
        <>
          <rect x="4" y="128" width="24" height="38" rx="2" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="3 2" />
          <rect x="62" y="128" width="24" height="38" rx="2" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="3 2" />
        </>
      )}

      {equipped.wings ? (
        <>
          <path d="M31 168 L8 200 L14 202 L31 182 Z" fill="url(#sc-bodyGrad)" stroke="#1a3a35" strokeWidth="1" />
          <path d="M59 168 L82 200 L76 202 L59 182 Z" fill="url(#sc-bodyGrad)" stroke="#1a3a35" strokeWidth="1" />
          <path d="M31 168 L8 200 L14 202 L31 182 Z" fill="url(#sc-sheen)" />
          <path d="M59 168 L82 200 L76 202 L59 182 Z" fill="url(#sc-sheen)" />
        </>
      ) : (
        <>
          <path d="M31 168 L8 200 L14 202 L31 182 Z" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="4 3" />
          <path d="M59 168 L82 200 L76 202 L59 182 Z" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="4 3" />
        </>
      )}

      {equipped.engine ? (
        <>
          <rect x="31" y="178" width="28" height="22" rx="4" fill="url(#sc-bodyGrad)" stroke="#1a4a44" strokeWidth="1" />
          <rect x="31" y="178" width="28" height="22" rx="4" fill="url(#sc-sheen)" />
          <rect x="35" y="182" width="8" height="14" rx="2.5" fill="#0a2220" stroke="#1a3a35" strokeWidth="0.7" />
          <rect x="47" y="182" width="8" height="14" rx="2.5" fill="#0a2220" stroke="#1a3a35" strokeWidth="0.7" />
        </>
      ) : (
        <rect x="31" y="178" width="28" height="22" rx="4" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.booster ? (
        <>
          <path d="M32 198 L22 234 L36 228 L45 242 L54 228 L68 234 L58 198 Z" fill="url(#sc-nozzleGrad)" stroke="#1a4a44" strokeWidth="1" />
          <path d="M32 198 L22 234 L36 228 L45 242 L54 228 L68 234 L58 198 Z" fill="url(#sc-sheen)" />
          <ellipse cx="45" cy="242" rx="11" ry="2.5" fill="#06D6A0" fillOpacity="0.1" />
        </>
      ) : (
        <path d="M32 198 L22 234 L36 228 L45 242 L54 228 L68 234 L58 198 Z" fill="#0a1210" stroke="#152522" strokeWidth="1" strokeDasharray="4 3" />
      )}

      {equipped.landingStruts && (
        <>
          <line x1="32" y1="232" x2="18" y2="248" stroke="#06D6A0" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="58" y1="232" x2="72" y2="248" stroke="#06D6A0" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
          <line x1="45" y1="242" x2="45" y2="254" stroke="#06D6A0" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
          <ellipse cx="18" cy="249" rx="3" ry="1.5" fill="#06D6A0" opacity="0.5" />
          <ellipse cx="72" cy="249" rx="3" ry="1.5" fill="#06D6A0" opacity="0.5" />
          <ellipse cx="45" cy="255" rx="3" ry="1.5" fill="#06D6A0" opacity="0.5" />
        </>
      )}

      <rect x="30" y="111" width="30" height="2.5" rx="1.25" fill="#1a4a44" opacity="0.7" />
      <rect x="30" y="177" width="30" height="2.5" rx="1.25" fill="#1a4a44" opacity="0.6" />
      <rect x="30" y="197" width="30" height="2.5" rx="1.25" fill="#1a4a44" opacity="0.6" />
    </svg>
  );
}

export default function RocketPreview({ equipped, model, launching, onLaunchComplete }: RocketPreviewProps) {
  useEffect(() => {
    if (launching) {
      const t = setTimeout(onLaunchComplete, 2200);
      return () => clearTimeout(t);
    }
  }, [launching, onLaunchComplete]);

  const totalParts = Object.keys(equipped).length;
  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const completeness = equippedCount / totalParts;
  const glowIntensity = 0.03 + completeness * 0.15;

  const modelColor = model === 'heavy' ? 'rgba(245,158,11,' : model === 'scout' ? 'rgba(6,214,160,' : 'rgba(255,255,255,';

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-[360px]">
      <style>{`
        @keyframes rocketFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25%       { transform: translateY(-14px) rotate(0.8deg); }
          75%       { transform: translateY(-7px) rotate(-0.5deg); }
        }
        @keyframes rocketLaunch {
          0%   { transform: translateY(0px) scale(1); opacity: 1; }
          30%  { transform: translateY(-20px) scale(1.05); opacity: 1; }
          70%  { transform: translateY(-120px) scale(0.85); opacity: 0.7; }
          100% { transform: translateY(-260px) scale(0.4); opacity: 0; }
        }
        @keyframes thrustFlame {
          0%, 100% { transform: scaleY(1) scaleX(1); opacity: 0.9; }
          50%       { transform: scaleY(1.35) scaleX(0.85); opacity: 0.6; }
        }
        @keyframes thrustGlow {
          0%, 100% { filter: blur(8px); opacity: 0.4; }
          50%       { filter: blur(14px); opacity: 0.7; }
        }
        @keyframes particleFly {
          0%   { transform: translateY(0) scale(1); opacity: 0.9; }
          100% { transform: translateY(80px) scale(0.1); opacity: 0; }
        }
        @keyframes launchShockwave {
          0%   { transform: scale(0.2); opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes orbitRing {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-48 h-48 rounded-full border border-white/[0.04]"
          style={{ boxShadow: `0 0 60px ${modelColor}${glowIntensity})`, transition: 'box-shadow 0.8s ease' }} />
        <div className="absolute w-72 h-72 rounded-full border border-white/[0.025]" />
        <div
          className="absolute w-56 h-56 rounded-full border border-white/[0.05]"
          style={{ animation: 'orbitRing 20s linear infinite' }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20" />
        </div>
      </div>

      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          animation: launching
            ? 'rocketLaunch 2.2s cubic-bezier(0.4,0,1,1) forwards'
            : 'rocketFloat 4s ease-in-out infinite',
        }}
      >
        {launching && (
          <div
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full border border-white/20"
            style={{ animation: 'launchShockwave 0.6s ease-out 0.2s both' }}
          />
        )}

        {model === 'standard' && <StandardRocket equipped={equipped} />}
        {model === 'heavy' && <HeavyRocket equipped={equipped} />}
        {model === 'scout' && <ScoutRocket equipped={equipped} />}

        {(equipped.booster || equipped.engine) && !launching && (
          <div className="relative -mt-3 flex flex-col items-center">
            <svg width="60" height="48" viewBox="0 0 60 48" style={{ animation: 'thrustFlame 0.3s ease-in-out infinite', transformOrigin: 'top center' }}>
              <defs>
                <radialGradient id="flameGrad" cx="50%" cy="0%" r="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                  <stop offset="30%" stopColor="#ffd04a" stopOpacity="0.7" />
                  <stop offset="70%" stopColor="#ff6b1a" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>
              <path d="M20 0 Q15 24 10 36 Q30 44 50 36 Q45 24 40 0 Z" fill="url(#flameGrad)" />
              <path d="M25 0 Q22 18 20 30 Q30 36 40 30 Q38 18 35 0 Z" fill="white" fillOpacity="0.35" />
            </svg>
            <div className="w-16 h-8 rounded-full -mt-2" style={{
              background: 'radial-gradient(ellipse, rgba(255,180,60,0.25) 0%, transparent 70%)',
              animation: 'thrustGlow 0.3s ease-in-out infinite',
            }} />
          </div>
        )}

        {launching && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: i % 4 === 0 ? '#fff' : i % 4 === 1 ? '#ffd04a' : i % 4 === 2 ? '#ff6b1a' : '#06D6A0',
                  left: `${(i - 6) * 6}px`,
                  bottom: `${Math.random() * 8}px`,
                  animation: `particleFly ${0.3 + Math.random() * 0.4}s ease-out ${i * 0.05}s both`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-1.5">
          {Object.entries(equipped).map(([key, on]) => (
            <div key={key} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${on ? 'bg-dot-green' : 'bg-zinc-800'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

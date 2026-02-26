export default function RocketIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      <div className="relative w-72 h-72 md:w-96 md:h-96">
        <div className="absolute inset-0 rounded-full bg-zinc-900/60 border border-zinc-800/50" />

        <div className="absolute top-4 left-8 w-2 h-2 rounded-full bg-white/40"
          style={{ animation: 'twinkle 2s ease-in-out infinite' }} />
        <div className="absolute top-12 right-6 w-1.5 h-1.5 rounded-full bg-white/30"
          style={{ animation: 'twinkle 2.5s ease-in-out infinite 0.5s' }} />
        <div className="absolute bottom-16 left-6 w-2 h-2 rounded-full bg-white/25"
          style={{ animation: 'twinkle 3s ease-in-out infinite 1s' }} />
        <div className="absolute bottom-8 right-10 w-1.5 h-1.5 rounded-full bg-white/35"
          style={{ animation: 'twinkle 2.2s ease-in-out infinite 0.3s' }} />
        <div className="absolute top-1/3 right-4 w-1 h-1 rounded-full bg-white/20"
          style={{ animation: 'twinkle 1.8s ease-in-out infinite 0.8s' }} />
        <div className="absolute top-1/2 left-5 w-1.5 h-1.5 rounded-full bg-white/15"
          style={{ animation: 'twinkle 2.8s ease-in-out infinite 1.2s' }} />

        <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'float 4s ease-in-out infinite' }}>
          <div className="relative">
            <svg width="150" height="210" viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M80 10 C80 10, 110 50, 115 100 L115 155 L80 170 L45 155 L45 100 C50 50, 80 10, 80 10Z"
                fill="url(#rocketBodyDark)"
                stroke="#333333"
                strokeWidth="1.5"
              />
              <path
                d="M80 18 C80 18, 65 55, 60 100 L60 145 L80 155 L100 145 L100 100 C95 55, 80 18, 80 18Z"
                fill="url(#rocketBodyInnerDark)"
              />
              <ellipse cx="80" cy="100" rx="22" ry="24" fill="url(#windowDark)" stroke="#333333" strokeWidth="1.5" />
              <ellipse cx="80" cy="100" rx="16" ry="17" fill="url(#windowInnerDark)" />
              <ellipse cx="74" cy="93" rx="5" ry="5" fill="rgba(255,255,255,0.15)" />

              <path d="M45 120 L20 145 L45 145 Z" fill="url(#finDark)" stroke="#333333" strokeWidth="1" />
              <path d="M115 120 L140 145 L115 145 Z" fill="url(#finDark)" stroke="#333333" strokeWidth="1" />

              <path d="M60 155 L80 170 L100 155 L95 165 L80 178 L65 165 Z" fill="#222222" />

              <ellipse cx="80" cy="182" rx="18" ry="8" fill="url(#flameDark1)" style={{ animation: 'trail 0.8s ease-in-out infinite alternate' }} />
              <ellipse cx="80" cy="192" rx="12" ry="6" fill="url(#flameDark2)" style={{ animation: 'trail 0.6s ease-in-out infinite alternate 0.2s' }} />
              <ellipse cx="80" cy="200" rx="7" ry="5" fill="url(#flameDark3)" style={{ animation: 'trail 0.5s ease-in-out infinite alternate 0.4s' }} />

              <path d="M80 10 L95 35 L80 30 L65 35 Z" fill="white" opacity="0.6" />
              <path d="M72 70 L75 85 L80 82 L85 85 L88 70 L80 75 Z" fill="white" opacity="0.3" />

              <defs>
                <linearGradient id="rocketBodyDark" x1="45" y1="10" x2="115" y2="170" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#2A2A2A" />
                  <stop offset="100%" stopColor="#141414" />
                </linearGradient>
                <linearGradient id="rocketBodyInnerDark" x1="60" y1="18" x2="100" y2="155" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3A3A3A" />
                  <stop offset="100%" stopColor="#1C1C1C" />
                </linearGradient>
                <radialGradient id="windowDark" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#404040" />
                  <stop offset="100%" stopColor="#1A1A1A" />
                </radialGradient>
                <radialGradient id="windowInnerDark" cx="40%" cy="35%" r="60%">
                  <stop offset="0%" stopColor="#555555" />
                  <stop offset="100%" stopColor="#0D0D0D" />
                </radialGradient>
                <linearGradient id="finDark" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="#2E2E2E" />
                  <stop offset="100%" stopColor="#111111" />
                </linearGradient>
                <radialGradient id="flameDark1" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#DDDDDD" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#888888" stopOpacity="0.3" />
                </radialGradient>
                <radialGradient id="flameDark2" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#AAAAAA" stopOpacity="0.2" />
                </radialGradient>
                <radialGradient id="flameDark3" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#888888" stopOpacity="0.1" />
                </radialGradient>
              </defs>
            </svg>

            <div
              className="absolute -top-2 -right-4 w-9 h-9 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-card flex items-center justify-center"
              style={{ animation: 'float 3.5s ease-in-out infinite 0.5s' }}
            >
              <span className="text-base">🌕</span>
            </div>
            <div
              className="absolute top-8 -left-8 w-9 h-9 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-card flex items-center justify-center"
              style={{ animation: 'float 4.5s ease-in-out infinite 1s' }}
            >
              <span className="text-base">⚡</span>
            </div>
            <div
              className="absolute bottom-16 -right-6 w-9 h-9 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-card flex items-center justify-center"
              style={{ animation: 'float 3s ease-in-out infinite 0.2s' }}
            >
              <span className="text-base">💎</span>
            </div>
          </div>
        </div>

        <div
          className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full border border-white/10"
          style={{ animation: 'orbit 6s linear infinite' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-5 h-5 rounded-full border border-white/8"
          style={{ animation: 'orbit 10s linear infinite reverse' }}
        />
      </div>
    </div>
  );
}

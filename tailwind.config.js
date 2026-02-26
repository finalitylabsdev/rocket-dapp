/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        data: ['Inter', 'monospace'],
      },
      colors: {
        // Base void palette (from brief)
        void: '#06080F',
        'void-mid': '#0C1018',
        dust: '#1E2636',
        star: '#E8ECF4',
        'star-dim': '#8A94A8',

        // Legacy aliases (keep for existing components)
        'bg-base': '#06080F',
        'bg-card': '#0C1018',
        'bg-card-hover': '#111824',
        'bg-surface': '#06080F',
        'border-subtle': '#1E2636',
        'border-default': '#2A3348',
        'border-strong': '#3A4A60',
        'text-primary': '#E8ECF4',
        'text-secondary': '#8A94A8',
        'text-muted': '#4A5468',
        'accent-white': '#E8ECF4',
        'accent-gray': '#8A94A8',
        'accent-dim': '#4A5468',
        'dot-green': '#4ADE80',

        // App accent colours
        'app-gate': '#8B5CF6',
        'app-exchange': '#06D6A0',
        'app-vault': '#F6C547',
        'app-bids': '#A855F7',
        'app-assembler': '#94A3B8',
        'app-liftoff': '#F97316',
        'app-jackpot': '#FACC15',

        // Rarity colours
        'rarity-common': '#6B7280',
        'rarity-uncommon': '#22C55E',
        'rarity-rare': '#3B82F6',
        'rarity-epic': '#8B5CF6',
        'rarity-legendary': '#F59E0B',
        'rarity-mythic': '#EF4444',
        'rarity-celestial': '#06B6D4',
        'rarity-quantum': '#E8ECF4',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 1px 12px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,236,244,0.04)',
        'card-hover': '0 4px 32px rgba(0,0,0,0.9), 0 0 0 1px rgba(232,236,244,0.08)',
        glow: '0 0 30px rgba(232,236,244,0.10)',
        'glow-sm': '0 0 14px rgba(232,236,244,0.06)',
        inner: 'inset 0 1px 0 rgba(232,236,244,0.05)',
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-fast': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        orbit: 'orbit 8s linear infinite',
        twinkle: 'twinkle 2s ease-in-out infinite',
        'phi-spin': 'phiSpin 6s linear infinite',
        'shimmer': 'shimmer 4s ease-in-out infinite',
        'ember-rise': 'emberRise 3s ease-out infinite',
        'aurora-flow': 'auroraFlow 4s ease-in-out infinite',
        'prismatic-shift': 'prismaticShift 2s linear infinite',
        'rarity-pulse': 'rarityPulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(232,236,244,0.04)' },
          '50%': { boxShadow: '0 0 40px rgba(232,236,244,0.12)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.3)' },
        },
        phiSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        emberRise: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '0.9' },
          '100%': { transform: 'translateY(-60px) scale(0.1)', opacity: '0' },
        },
        auroraFlow: {
          '0%, 100%': { transform: 'translateX(-10%) skewX(-3deg)', opacity: '0.6' },
          '50%': { transform: 'translateX(10%) skewX(3deg)', opacity: '0.9' },
        },
        prismaticShift: {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
        rarityPulse: {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};

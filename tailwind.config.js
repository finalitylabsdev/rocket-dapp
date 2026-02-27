/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", 'monospace'],
        inter: ['Inter', 'sans-serif'],
        display: ["'JetBrains Mono'", 'monospace'],
        data: ["'JetBrains Mono'", 'monospace'],
        poppins: ["'JetBrains Mono'", 'monospace'],
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
        '2xl': '4px',
        '3xl': '4px',
        '4xl': '4px',
      },
      boxShadow: {
        card: 'none',
        'card-hover': 'none',
        glow: 'none',
        'glow-sm': 'none',
        inner: 'none',
      },
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

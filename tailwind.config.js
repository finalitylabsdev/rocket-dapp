/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'IBM Plex Mono'", "'JetBrains Mono'", 'monospace'],
        inter: ['Inter', 'sans-serif'],
        display: ["'Libre Baskerville'", 'Georgia', 'serif'],
        data: ["'IBM Plex Mono'", "'JetBrains Mono'", 'monospace'],
        poppins: ["'IBM Plex Mono'", "'JetBrains Mono'", 'monospace'],
      },
      colors: {
        // Base void palette (from brief)
        void: 'var(--color-bg-base)',
        'void-mid': 'var(--color-bg-card)',
        dust: 'var(--color-border-subtle)',
        star: 'var(--color-text-primary)',
        'star-dim': 'var(--color-text-secondary)',

        // Semantic theme tokens (CSS variables)
        'bg-base': 'var(--color-bg-base)',
        'bg-card': 'var(--color-bg-card)',
        'bg-card-hover': 'var(--color-bg-card-hover)',
        'bg-surface': 'var(--color-bg-surface)',
        'bg-inset': 'var(--color-bg-inset)',
        'border-subtle': 'var(--color-border-subtle)',
        'border-default': 'var(--color-border-default)',
        'border-strong': 'var(--color-border-strong)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-faint': 'var(--color-text-faint)',
        'accent-white': 'var(--color-text-primary)',
        'accent-gray': 'var(--color-text-secondary)',
        'accent-dim': 'var(--color-text-muted)',

        // Accent colours (fixed — work on both themes)
        'dot-green': '#4ADE80',
        'app-gate': '#8B5CF6',
        'app-exchange': '#06D6A0',
        'app-vault': '#F6C547',
        'app-bids': '#A855F7',
        'app-assembler': '#94A3B8',
        'app-liftoff': '#F97316',
        'app-jackpot': '#FACC15',

        // Rarity colours (fixed)
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

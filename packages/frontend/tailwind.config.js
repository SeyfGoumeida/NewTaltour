/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#040916',
          900: '#070E20',
          850: '#0A1329',
          800: '#0E1933',
          700: '#15223F',
          600: '#1E2D50',
        },
        line: 'rgba(148, 170, 220, 0.12)',
        muted: '#8C9AB8',
        soft: '#C3CDE2',
        brand: { blue: '#2F6BFF', cyan: '#22D3EE', navy: '#233E5D' },
        accent: { DEFAULT: '#FF6B1A', hover: '#FF7F35', soft: 'rgba(255,107,26,0.12)' },
        gold: '#FFD60A',
        ok: '#22C55E',
        warn: '#F59E0B',
        danger: '#F43F5E',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(255,107,26,0.55)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -20px rgba(0,0,0,0.6)',
        bar: '0 30px 80px -20px rgba(4,9,22,0.9)',
      },
      backgroundImage: {
        'grad-text': 'linear-gradient(90deg, #2F6BFF 0%, #22D3EE 100%)',
        'grad-accent': 'linear-gradient(180deg, #FF8A3D 0%, #FF6B1A 100%)',
      },
      keyframes: {
        'fade-up': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .5s ease-out both' },
    },
  },
  plugins: [],
};

// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // ── shadcn/ui-style CSS-variable tokens (used by landing page) ──
        background: 'var(--landing-bg, #0f1117)',
        foreground: 'var(--landing-text, #f0f0f0)',
        primary: {
          DEFAULT: '#10a37f',
          foreground: '#ffffff',
          50:  '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        muted: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          foreground: 'rgba(255,255,255,0.5)',
        },
        card: {
          DEFAULT: 'rgba(255,255,255,0.04)',
          foreground: 'rgba(255,255,255,0.88)',
        },
        border: 'rgba(255,255,255,0.1)',
        accent: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          foreground: 'rgba(255,255,255,0.75)',
        },
        // ── App palette ──
        steel: {
          100: '#e5e7eb',
          200: '#d1d5db',
          800: '#1f2937',
          900: '#111827'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'gradient':  'gradient 8s linear infinite',
        'float':     'float 6s ease-in-out infinite',
        'fadeOut':   'fadeOutLabel 2.5s ease-out forwards',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
          '50%':      { 'background-size': '200% 200%', 'background-position': 'right center' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-20px)' }
        },
        fadeOutLabel: {
          '0%':   { opacity: '1', transform: 'translateX(0) scale(1)' },
          '70%':  { opacity: '1', transform: 'translateX(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateX(0.5rem) scale(0.95)' },
        }
      },
    },
  },
  plugins: [],
}
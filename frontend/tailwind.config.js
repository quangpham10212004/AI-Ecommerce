/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0b1c30',
        surface: '#131b2e',
        surface2: '#1a2333',
        surface3: '#243047',
        border: 'rgba(255,255,255,0.06)',
        accent: '#00668a',
        accentLight: '#38bdf8',
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171',
        neon: '#38bdf8',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(56,189,248,0.1)',
        'glow-purple': '0 0 20px rgba(56,189,248,0.4)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #00668a 0%, #38bdf8 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(56,189,248,0.6)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 20px rgba(56,189,248,0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}

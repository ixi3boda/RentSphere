/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
      },
      colors: {
        // One accent, used at two depths: brand-700 for text and fills that must clear AA on
        // white, brand-500 for gradient ends and decorations.
        brand: '#0369a1',
        accent: '#0ea5e9',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.08)',
        'glow-sky': '0 0 25px -5px rgba(14, 165, 233, 0.4)',
        'luxury': '0 20px 50px -12px rgba(15, 23, 42, 0.15)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        auraguard: {
          50: '#eef7ff',
          100: '#d9efff',
          200: '#b6e0ff',
          300: '#7ec9ff',
          400: '#39abff',
          500: '#0d87ea',
          600: '#0869be',
          700: '#0a549b',
          800: '#0d467f',
          900: '#0f3b69'
        }
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(57, 171, 255, 0.15), 0 24px 80px rgba(7, 17, 31, 0.35)'
      }
    }
  },
  plugins: []
};

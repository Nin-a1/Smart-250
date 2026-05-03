/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#E8F5F0',
          100: '#C2E4D8',
          200: '#8ECFBB',
          300: '#5ABA9E',
          400: '#2EA682',
          500: '#179A6F',
          600: '#0F6E56',
          700: '#0A5241',
          800: '#073B2F',
          900: '#04251D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


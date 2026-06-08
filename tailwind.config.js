/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f5',
          100: '#e1efe8',
          200: '#c5e0d4',
          300: '#9cc7b2',
          400: '#6ea88c',
          500: '#4a8b6f',
          600: '#387057',
          700: '#2d5a46',
          800: '#25493a',
          900: '#1f3d31',
          950: '#11221b',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e5ebe5',
          200: '#ccd9cc',
          300: '#a7bfa7',
          400: '#7fa07f',
          500: '#608060',
          600: '#4a664a',
          700: '#3c523c',
          800: '#324332',
          900: '#2b392b',
          950: '#172017',
        },
        cream: {
          50: '#faf9f5',
          100: '#f3efdf',
          200: '#e6dec1',
          300: '#d5c79b',
          400: '#c3ad72',
          500: '#b29352',
          600: '#9d7c41',
          700: '#826235',
          800: '#6b5030',
          900: '#5c432b',
          950: '#352516',
        },
        moss: {
          50: '#f6f9eb',
          100: '#ecf2cd',
          200: '#d7e49e',
          300: '#bed268',
          400: '#a3be3f',
          500: '#85a225',
          600: '#67801a',
          700: '#4f6217',
          800: '#404f17',
          900: '#374318',
          950: '#1d260a',
        }
      },
      animation: {
        'scan': 'scan 2.5s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.8' },
          '50%': { transform: 'translateY(400px)', opacity: '0.8' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(15px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}

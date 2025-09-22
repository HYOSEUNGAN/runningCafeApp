/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f0ff',
          100: '#e9e2ff',
          200: '#d6ccff',
          300: '#bba6ff',
          400: '#a259ff',
          500: '#8b3dff',
          600: '#7c2d12',
          700: '#6b21a8',
          800: '#581c87',
          900: '#4c1d95',
        },
        secondary: {
          orange: '#ffb86c',
          mint: '#43e97b',
          pink: '#ffd6e0',
        },
        neutral: {
          50: '#f5f6fa',
          100: '#e8eaed',
          200: '#dadce0',
          300: '#bdc1c6',
          400: '#9aa0a6',
          500: '#80868b',
          600: '#5f6368',
          700: '#3c4043',
          800: '#202124',
          900: '#22223b',
        },
        system: {
          error: '#ff4d4f',
          success: '#43e97b',
          warning: '#ffb86c',
          info: '#6a82fb',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.3', letterSpacing: '-1%' }],
        'h2': ['28px', { lineHeight: '1.3', letterSpacing: '-0.5%' }],
        'h3': ['24px', { lineHeight: '1.4', letterSpacing: '0%' }],
        'h4': ['20px', { lineHeight: '1.4', letterSpacing: '0%' }],
        'body': ['16px', { lineHeight: '1.5', letterSpacing: '0%' }],
        'caption': ['13px', { lineHeight: '1.4', letterSpacing: '0%' }],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #a259ff 0%, #6a82fb 100%)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'card': '12px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

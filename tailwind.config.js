/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: {
          dark: '#121212',
          card: '#242424',
          light: '#2A2A2A'
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#B3B3B3',
          muted: '#8A8A8A',
        },
        accent: {
          pink: '#FF2E93',
          purple: '#6F2DFF',
          blue: '#2D9CFF'
        },
        success: '#4CAF50',
        warning: '#FFC107',
        error: '#F44336',
        border: '#3A3A3A'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EC4899', // Pink-500
          dark: '#DB2777',    // Pink-600
          light: '#FDF2F8',   // Pink-50
          hover: '#F472B6',   // Pink-400
          accent: '#F9A8D4',  // Pink-300
        },
        secondary: {
          DEFAULT: '#8B5CF6', // Violet-500
          dark: '#7C3AED',    // Violet-600
          light: '#F3E8FF',   // Violet-50
        },
        success: {
          DEFAULT: '#22C55E', // Green-500
          dark: '#16A34A',    // Green-600
          light: '#ECFDF5',   // Green-50
        },
        warning: {
          DEFAULT: '#F59E0B', // Amber-500
          dark: '#D97706',    // Amber-600
          light: '#FFFBEB',   // Amber-50
        },
        dark: {
          bg: '#0F172A',      // Slate-900
          card: '#111827',    // Gray-900
          text: '#F8FAFC',    // Slate-50
        },
      },
      fontFamily: {
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'neon': '0 0 15px rgba(236, 72, 153, 0.4)',
        'neon-lg': '0 0 30px rgba(236, 72, 153, 0.3)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

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
          DEFAULT: '#e23744',
          dark: '#c41425',
          light: '#fef1f1',
        },
        secondary: '#ff6b6b',
        accent: '#ffa500',
        success: '#10B981',
        surface: '#FFFFFF',
        background: '#FDFBF7', // Royal Light Beige
        'text-primary': '#1c1c1c',
        'text-secondary': '#696969',
        border: '#e8e8e8',
        footer: '#1A1A1A',
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
      },
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['2.5rem', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'small': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(226, 55, 68, 0.08)',
        'card-hover': '0 8px 24px rgba(226, 55, 68, 0.15)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      transitionDuration: {
        'default': '300ms',
      },
    },
  },
  plugins: [],
}

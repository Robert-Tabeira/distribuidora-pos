/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#93c5fd',
        },
        secondary: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
          light: '#fdba74',
        },
        success: {
          DEFAULT: '#10b981',
          dark: '#059669',
          light: '#6ee7b7',
        },
        danger: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fcd34d',
        },
        accent: {
          DEFAULT: '#06b6d4',
          dark: '#0891b2',
        },
        bg: '#f5f7fb',
        surface: {
          DEFAULT: '#ffffff',
          hover: '#f8fafc',
          raised: '#ffffff',
        },
        border: {
          DEFAULT: '#e5e7eb',
          light: '#f3f4f6',
        },
        text: {
          DEFAULT: '#1f2937',
          muted: '#6b7280',
          light: '#9ca3af',
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}

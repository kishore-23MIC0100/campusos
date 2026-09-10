/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#071126',
          900: '#0B1B3A', // Dark Corporate Navy Background
          800: '#1E3A8A', // Primary Corporate Navy
          700: '#1D4ED8',
          600: '#2563EB',
          500: '#3B82F6',
          100: '#DBEAFE',
          50: '#EFF6FF',
        },
        teal: {
          900: '#134E4A',
          800: '#115E59',
          700: '#0F766E',
          600: '#0D9488', // Secondary Modern Teal
          500: '#14B8A6',
          400: '#2DD4BF',
          100: '#CCFBF1',
          50: '#F0FDFA',
        },
        slate: {
          950: '#090D16',
          900: '#0F172A', // Charcoal Black
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC', // Clean Slate Background
        },
        amber: {
          900: '#78350F',
          800: '#92400E',
          700: '#B45309',
          600: '#D97706',
          500: '#F59E0B', // Accent / Fresh Amber
          400: '#FBBF24',
          100: '#FEF3C7',
          50: '#FFFBEB',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
        'card-hover': '0 12px 32px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'hero': '0 25px 60px -15px rgba(11, 27, 58, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'glass': '0 8px 32px 0 rgba(11, 27, 58, 0.37)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

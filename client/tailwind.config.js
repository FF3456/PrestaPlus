/** Tokens del sistema visual de PRESTA+. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#EFF6FF', 100: '#DBEAFE', 500: '#2563EB', 600: '#2563EB', 700: '#1D4ED8' },
        navy: { 800: '#1E293B', 900: '#0F172A' },
        accent: { 50: '#ECFEFF', 500: '#06B6D4', 600: '#0891B2' },
        ink: { 900: '#0F172A', 600: '#475569' },
        paper: '#F8FAFC',
        success: { 50: '#ECFDF5', 500: '#10B981', 700: '#047857' },
        warning: { 50: '#FFFBEB', 500: '#F59E0B', 700: '#B45309' },
        danger: { 50: '#FEF2F2', 500: '#EF4444', 700: '#B91C1C' },
      },
      fontFamily: { sans: ['Inter', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      fontSize: { h1: ['2rem', { lineHeight: '2.5rem', fontWeight: '600' }], h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }], h3: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }] },
    },
  },
  plugins: [],
};

/** Tokens del sistema de diseño de Figma (PRESTA+). Las variantes -700 se añaden para texto con contraste WCAG AA. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#E9EEF0', 100: '#D3DEE1', 500: '#496A73', 600: '#23404A', 700: '#1B323A' },
        ink: { 900: '#30383B', 600: '#5B686C' },
        paper: '#F5F3EE',
        success: { 50: '#E7EFE9', 500: '#5F8068', 700: '#3F5B48' },
        warning: { 50: '#F7EAE4', 500: '#B8755C', 700: '#8A4A33' },
        danger: { 50: '#F5E6E6', 500: '#A65D5D', 700: '#7E3F3F' },
      },
      fontFamily: { sans: ['Inter', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      fontSize: { h1: ['2rem', { lineHeight: '2.5rem', fontWeight: '600' }], h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }], h3: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }] },
    },
  },
  plugins: [],
};

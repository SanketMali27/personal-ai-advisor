/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1b1f3b',
        paper: '#f8f4ec',
        sun: '#f0a202',
        tide: '#2a9d8f',
      },
      boxShadow: {
        panel: '0 18px 50px rgba(27, 31, 59, 0.12)',
      },
      backgroundImage: {
        'hero-wash':
          'radial-gradient(circle at top left, rgba(240, 162, 2, 0.22), transparent 35%), radial-gradient(circle at top right, rgba(42, 157, 143, 0.2), transparent 30%), linear-gradient(135deg, #f8f4ec 0%, #fdfcf7 100%)',
      },
    },
  },
  plugins: [],
};

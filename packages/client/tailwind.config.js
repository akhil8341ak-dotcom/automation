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
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        canvas: {
          bg: '#090d16',
          card: '#111827',
          border: '#1f2937',
          subtle: '#1e293b',
        }
      },
    },
  },
  plugins: [],
}

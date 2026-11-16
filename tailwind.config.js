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
        dark: {
          950: '#060910',
          900: '#0a0f1d',
          850: '#0f172a',
          800: '#15203b',
          700: '#1e293b',
          600: '#334155',
        },
        primary: {
          DEFAULT: '#10b981', // emerald
          light: '#34d399',
          dark: '#059669',
        },
        accent: {
          amber: '#f59e0b',
          cyan: '#06b6d4',
          rose: '#f43f5e',
          indigo: '#6366f1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}

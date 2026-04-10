import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          900: '#14532d',
        },
        border: 'rgb(255 255 255 / 0.08)',
        background: '#0a0a0a',
        foreground: '#ededed',
        muted: {
          DEFAULT: 'rgb(255 255 255 / 0.05)',
          foreground: 'rgb(255 255 255 / 0.6)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

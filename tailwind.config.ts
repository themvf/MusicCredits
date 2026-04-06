import defaultTheme from 'tailwindcss/defaultTheme'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      opacity: {
        6: '0.06',
        8: '0.08',
        12: '0.12',
        15: '0.15',
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        // Public homepage accent palette
        // CSS variable — switches to pink in curator mode via [data-persona="curator"]
        acid: 'rgb(var(--color-accent) / <alpha-value>)',
        hp: '#FF2D6B',
        cobalt: '#3B5BFF',
      },
      animation: {
        marquee: 'marquee 26s linear infinite',
        'marquee-slow': 'marquee 42s linear infinite',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}

export default config

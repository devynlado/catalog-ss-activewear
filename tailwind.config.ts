import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Garment Decor Brand Colors
        brand: {
          50: '#FEF7F0',
          100: '#FDEAD9',
          200: '#FBD2B2',
          300: '#F8B382',
          400: '#F49B52',
          500: '#EE8935',  // PRIMARY ORANGE - CTAs, buttons, links
          600: '#D97118',
          700: '#B45812',
          800: '#91460F',
          900: '#77390D',
          950: '#5C2B09',
        },
        // Navy for titles and headers
        navy: {
          50: '#E8E8F0',
          100: '#C4C4D4',
          200: '#9D9DB8',
          300: '#75759C',
          400: '#4E4E80',
          500: '#272764',
          600: '#1A1A4A',
          700: '#0F0F35',
          800: '#070131',  // PRIMARY NAVY - titles, headers
          900: '#040022',
        },
        // UI Colors
        background: '#FAF6F3',  // Warm cream page background
        surface: '#FFFFFF',     // White containers/cards
        text: {
          DEFAULT: '#242424',   // Body text
          muted: '#6B7280',     // Secondary text
          light: '#9CA3AF',     // Tertiary text
        },
        // Stock level colors
        stock: {
          high: '#22c55e',
          low: '#eab308',
          out: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // Design tokens for consistent spacing
        'card': '1.5rem',
        'section': '3rem',
      },
      borderRadius: {
        'card': '0.75rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;

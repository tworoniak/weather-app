/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0d1b2a',
        surface: '#1b263b',
        card: '#415a77',
        border: '#778da9',
        ltGray: '#e0e1dd',

        text: '#F5F5F5',
        muted: '#C9C9D1',
        subtle: '#8B8B95',
        faint: '#5A5A63',

        accent: '#ffb703', // yellow
        accent2: '#fb8500', // orange

        matteBlack: '#212738',

        // Monochromatic
        whiteSmoke: '#f5f5f5ff',
        silver: '#bdbdbdff',
        graphite: '#3a3a3aff',
        graphite2: '#2b2b2bff',
        carbonBlack: '#1a1a1aff',
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

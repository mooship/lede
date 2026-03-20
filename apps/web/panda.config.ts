import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: ['./src/routeTree.gen.ts'],

  theme: {
    extend: {
      tokens: {
        colors: {
          bg: { value: '#0f0f0f' },
          surface: { value: '#1a1a1a' },
          surfaceHigh: { value: '#1f1f1f' },
          border: { value: '#2e2e2e' },
          textPrimary: { value: '#f0f0f0' },
          textSecondary: { value: '#d0d0d0' },
          textMuted: { value: '#888888' },
          textDim: { value: '#444444' },
          textLight: { value: '#c0c0c0' },
          world: { value: '#e85a3c' },
          tech: { value: '#4a9eff' },
          science: { value: '#3ecf8e' },
          business: { value: '#f5c542' },
          sport: { value: '#a855f7' },
        },
        fonts: {
          display: { value: "'Syne Variable', 'Syne', sans-serif" },
          body: { value: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', sans-serif" },
        },
      },

      recipes: {
        storyCard: {
          className: 'storyCard',
          base: {
            bg: 'surface',
            cursor: 'pointer',
            padding: '6',
            minHeight: '120px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '3',
            transition: 'background-color 0.2s',
            position: 'relative',
            boxSizing: 'border-box',
            _hover: { bg: 'surfaceHigh' },
          },
          variants: {
            category: {
              World: {},
              Technology: {},
              Science: {},
              'Business / Economy': {},
              Sport: {},
            },
          },
        },
      },
    },
  },

  outdir: 'styled-system',
})

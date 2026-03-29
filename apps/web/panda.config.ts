import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: ['./src/routeTree.gen.ts'],
  conditions: {
    extend: {
      dark: '[data-theme="dark"] &',
    },
  },
  globalCss: {
    'html, body': {
      scrollbarWidth: 'none',
      '-webkit-tap-highlight-color': 'transparent',
      '&::-webkit-scrollbar': { display: 'none' },
    },
    html: {
      '-webkit-text-size-adjust': '100%',
    },
  },
  theme: {
    extend: {
      tokens: {
        colors: {
          world: { value: '#e85a3c' },
          tech: { value: '#4a9eff' },
          science: { value: '#3ecf8e' },
          business: { value: '#f5c542' },
          sport: { value: '#a855f7' },
          culture: { value: '#f43f5e' },
        },
        fonts: {
          display: { value: "'Syne Variable', 'Syne', sans-serif" },
          body: { value: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', sans-serif" },
        },
      },
      semanticTokens: {
        colors: {
          bg: {
            value: { base: '#fafafa', _dark: '#0f0f0f' },
          },
          surface: {
            value: { base: '#ffffff', _dark: '#1a1a1a' },
          },
          surfaceHigh: {
            value: { base: '#f5f5f5', _dark: '#1f1f1f' },
          },
          border: {
            value: { base: '#e5e5e5', _dark: '#2e2e2e' },
          },
          textPrimary: {
            value: { base: '#111111', _dark: '#f0f0f0' },
          },
          textSecondary: {
            value: { base: '#333333', _dark: '#d0d0d0' },
          },
          textMuted: {
            value: { base: '#666666', _dark: '#888888' },
          },
          textDim: {
            value: { base: '#aaaaaa', _dark: '#666666' },
          },
          textLight: {
            value: { base: '#555555', _dark: '#c0c0c0' },
          },
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
            transition: 'background-color 0.2s, transform 0.1s',
            position: 'relative',
            boxSizing: 'border-box',
            _hover: { bg: 'surfaceHigh' },
            _active: { transform: 'scale(0.985)', bg: 'surfaceHigh' },
          },
        },
      },
    },
  },
  outdir: 'styled-system',
})

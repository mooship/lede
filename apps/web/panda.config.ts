import { defineConfig } from '@pandacss/dev'
import { createPreset } from '@park-ui/panda-preset'

export default defineConfig({
  presets: [createPreset({ accentColor: 'neutral', grayColor: 'neutral', borderRadius: 'sm' })],
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  theme: {
    extend: {
      tokens: {
        colors: {
          bg: { value: '#0f0f0f' },
          surface: { value: '#1a1a1a' },
          surfaceHigh: { value: '#242424' },
          border: { value: '#2e2e2e' },
          textPrimary: { value: '#f0f0f0' },
          textMuted: { value: '#888888' },
          world: { value: '#e85a3c' },
          tech: { value: '#4a9eff' },
          science: { value: '#3ecf8e' },
          business: { value: '#f5c542' },
        },
        fonts: {
          display: { value: 'Syne, sans-serif' },
          body: { value: 'Instrument Serif, Georgia, serif' },
        },
      },
      recipes: {
        storyCard: {
          className: 'storyCard',
          base: {
            backgroundColor: 'surface',
            borderRadius: 'sm',
            borderLeftWidth: '3px',
            borderLeftStyle: 'solid',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
            padding: '4',
            '&:hover': { backgroundColor: 'surfaceHigh' },
          },
          variants: {
            category: {
              world: { borderLeftColor: 'world' },
              tech: { borderLeftColor: 'tech' },
              science: { borderLeftColor: 'science' },
              business: { borderLeftColor: 'business' },
            },
            expanded: {
              true: { backgroundColor: 'surfaceHigh' },
              false: {},
            },
          },
        },
      },
    },
  },
  outdir: 'styled-system',
})

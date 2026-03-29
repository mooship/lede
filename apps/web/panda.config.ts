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
          overlay: {
            value: { base: 'rgba(0,0,0,0.6)', _dark: 'rgba(0,0,0,0.75)' },
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
            borderLeft: '3px solid transparent',
            _hover: { bg: 'surfaceHigh' },
            _active: { transform: 'scale(0.985)', bg: 'surfaceHigh' },
          },
          variants: {
            category: {
              World: { borderLeftColor: 'world' },
              Technology: { borderLeftColor: 'tech' },
              Science: { borderLeftColor: 'science' },
              'Business / Economy': { borderLeftColor: 'business' },
              Sport: { borderLeftColor: 'sport' },
              Culture: { borderLeftColor: 'culture' },
            },
          },
        },
        badge: {
          className: 'badge',
          base: {
            fontFamily: 'display',
            fontWeight: '700',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            lineHeight: '1.6',
            border: '1px solid',
          },
          variants: {
            size: {
              sm: { fontSize: '0.6rem', padding: '2px 8px' },
              md: { fontSize: '0.6rem', padding: '3px 10px' },
            },
          },
          defaultVariants: {
            size: 'sm',
          },
        },
        segmentControlWrap: {
          className: 'segmentControlWrap',
          base: {
            display: 'inline-flex',
            bg: 'surfaceHigh',
            borderRadius: '10px',
            padding: '3px',
          },
          variants: {
            fullWidth: {
              true: { width: '100%' },
            },
          },
        },
        segmentPill: {
          className: 'segmentPill',
          base: {
            fontFamily: 'display',
            fontSize: '0.7rem',
            fontWeight: '700',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            background: 'none',
            border: 'none',
            borderRadius: '8px',
            py: '2',
            cursor: 'pointer',
            transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
            lineHeight: '1.6',
            textAlign: 'center',
            color: 'textMuted',
          },
          variants: {
            selected: {
              true: {
                bg: 'surface',
                color: 'textPrimary',
                boxShadow: '0 1px 3px token(colors.border)',
              },
            },
            disabled: {
              true: { color: 'textDim', cursor: 'not-allowed' },
            },
            size: {
              fixed: { minWidth: '80px', px: '5' },
              fluid: { flex: '1', px: '4' },
            },
          },
          defaultVariants: {
            size: 'fixed',
          },
        },
      },
    },
  },
  outdir: 'styled-system',
})

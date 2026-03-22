import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { FontaineTransform } from 'fontaine'
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart(),
    react(),
    FontaineTransform.vite({
      fallbacks: ['Arial', 'Helvetica Neue'],
      resolvePath: (id) => new URL(id, import.meta.url),
    }),
  ],
})

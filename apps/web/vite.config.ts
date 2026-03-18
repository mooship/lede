import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { FontaineTransform } from 'fontaine'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    FontaineTransform.vite({
      fallbacks: ['Arial', 'sans-serif'],
      resolvePath: (id) => new URL(id, import.meta.url),
    }),
  ],
})

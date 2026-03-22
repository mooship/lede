import { neonConfig } from '@neondatabase/serverless'
import { defineConfig } from 'drizzle-kit'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})

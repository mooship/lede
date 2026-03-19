import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ADMIN_SECRET: z.string().min(32, 'ADMIN_SECRET must be at least 32 characters'),
  WEB_ORIGIN: z.string().min(1, 'WEB_ORIGIN is required'),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(raw: unknown): Env {
  return envSchema.parse(raw)
}

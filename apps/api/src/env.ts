import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ADMIN_SECRET: z.string().min(32, 'ADMIN_SECRET must be at least 32 characters'),
  WEB_ORIGIN: z.string().min(1, 'WEB_ORIGIN is required'),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
})

type RateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export type Env = z.infer<typeof envSchema> & { RATE_LIMITER: RateLimiter }

export function validateEnv(raw: unknown): Env {
  const parsed = envSchema.parse(raw)
  const rateLimiter = (raw as Record<string, unknown>).RATE_LIMITER
  if (!rateLimiter || typeof (rateLimiter as RateLimiter).limit !== 'function') {
    throw new Error('RATE_LIMITER binding is missing or misconfigured')
  }
  return { ...parsed, RATE_LIMITER: rateLimiter as RateLimiter }
}

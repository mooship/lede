import { describe, expect, it } from 'vitest'
import { validateEnv } from './env.js'

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@host/db',
  ADMIN_SECRET: 'a'.repeat(32),
  WEB_ORIGIN: 'https://tidel.app',
  RATE_LIMITER: { limit: async () => ({ success: true }) },
}

describe('validateEnv', () => {
  it('accepts a valid env with required fields only', () => {
    const result = validateEnv(VALID_ENV)
    expect(result.DATABASE_URL).toBe(VALID_ENV.DATABASE_URL)
    expect(result.ADMIN_SECRET).toBe(VALID_ENV.ADMIN_SECRET)
    expect(result.WEB_ORIGIN).toBe(VALID_ENV.WEB_ORIGIN)
    expect(result.ANTHROPIC_API_KEY).toBeUndefined()
    expect(result.CLOUDFLARE_ZONE_ID).toBeUndefined()
    expect(result.CLOUDFLARE_API_TOKEN).toBeUndefined()
  })

  it('accepts a valid env with all optional fields', () => {
    const result = validateEnv({
      ...VALID_ENV,
      ANTHROPIC_API_KEY: 'sk-ant-test',
      CLOUDFLARE_ZONE_ID: 'zone-123',
      CLOUDFLARE_API_TOKEN: 'token-456',
    })
    expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-test')
    expect(result.CLOUDFLARE_ZONE_ID).toBe('zone-123')
    expect(result.CLOUDFLARE_API_TOKEN).toBe('token-456')
  })

  it('throws when DATABASE_URL is missing', () => {
    const { DATABASE_URL: _, ...rest } = VALID_ENV
    expect(() => validateEnv(rest)).toThrow()
  })

  it('throws when DATABASE_URL is empty', () => {
    expect(() => validateEnv({ ...VALID_ENV, DATABASE_URL: '' })).toThrow()
  })

  it('throws when ADMIN_SECRET is missing', () => {
    const { ADMIN_SECRET: _, ...rest } = VALID_ENV
    expect(() => validateEnv(rest)).toThrow()
  })

  it('throws when ADMIN_SECRET is shorter than 32 characters', () => {
    expect(() => validateEnv({ ...VALID_ENV, ADMIN_SECRET: 'a'.repeat(31) })).toThrow()
  })

  it('accepts ADMIN_SECRET that is exactly 32 characters', () => {
    const result = validateEnv({ ...VALID_ENV, ADMIN_SECRET: 'a'.repeat(32) })
    expect(result.ADMIN_SECRET).toHaveLength(32)
  })

  it('accepts ADMIN_SECRET longer than 32 characters', () => {
    const result = validateEnv({ ...VALID_ENV, ADMIN_SECRET: 'a'.repeat(64) })
    expect(result.ADMIN_SECRET).toHaveLength(64)
  })

  it('throws when WEB_ORIGIN is missing', () => {
    const { WEB_ORIGIN: _, ...rest } = VALID_ENV
    expect(() => validateEnv(rest)).toThrow()
  })

  it('throws when WEB_ORIGIN is empty', () => {
    expect(() => validateEnv({ ...VALID_ENV, WEB_ORIGIN: '' })).toThrow()
  })

  it('throws when input is not an object', () => {
    expect(() => validateEnv(null)).toThrow()
    expect(() => validateEnv(undefined)).toThrow()
    expect(() => validateEnv('string')).toThrow()
  })
})

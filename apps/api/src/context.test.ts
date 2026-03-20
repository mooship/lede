import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createContext } from './context.js'
import type { Env } from './env.js'

const mockTimingSafeEqual = vi.fn()

vi.stubGlobal('crypto', {
  subtle: { timingSafeEqual: mockTimingSafeEqual },
})

function makeEnv(secret = 'super-secret'): Env {
  return {
    DATABASE_URL: 'postgres://test',
    ANTHROPIC_API_KEY: undefined,
    ADMIN_SECRET: secret,
    WEB_ORIGIN: 'http://localhost:5173',
    RATE_LIMITER: { limit: async () => ({ success: true }) },
  }
}

const mockExecutionCtx: ExecutionContext = {
  waitUntil: () => {},
  passThroughOnException: () => {},
}

function byteEqual(a: ArrayBufferView, b: ArrayBufferView): boolean {
  const av = new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
  const bv = new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
  return av.every((byte, i) => byte === bv[i])
}

describe('createContext', () => {
  beforeEach(() => {
    mockTimingSafeEqual.mockImplementation(byteEqual)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns isAdmin: false when there is no Authorization header', async () => {
    const req = new Request('https://example.com')
    const ctx = await createContext(req, makeEnv(), mockExecutionCtx)
    expect(ctx.isAdmin).toBe(false)
    expect(mockTimingSafeEqual).not.toHaveBeenCalled()
  })

  it('returns isAdmin: false when the header has no Bearer prefix', async () => {
    const req = new Request('https://example.com', {
      headers: { Authorization: 'super-secret' },
    })
    const ctx = await createContext(req, makeEnv(), mockExecutionCtx)
    expect(ctx.isAdmin).toBe(false)
    expect(mockTimingSafeEqual).not.toHaveBeenCalled()
  })

  it('returns isAdmin: true for the correct Bearer token', async () => {
    const req = new Request('https://example.com', {
      headers: { Authorization: 'Bearer super-secret' },
    })
    const ctx = await createContext(req, makeEnv('super-secret'), mockExecutionCtx)
    expect(ctx.isAdmin).toBe(true)
    expect(mockTimingSafeEqual).toHaveBeenCalledOnce()
  })

  it('returns isAdmin: false for an incorrect Bearer token', async () => {
    const req = new Request('https://example.com', {
      headers: { Authorization: 'Bearer wrong-token' },
    })
    const ctx = await createContext(req, makeEnv('super-secret'), mockExecutionCtx)
    expect(ctx.isAdmin).toBe(false)
  })

  it('skips timingSafeEqual when token length differs from secret length', async () => {
    const req = new Request('https://example.com', {
      headers: { Authorization: 'Bearer short' },
    })
    const ctx = await createContext(req, makeEnv('much-longer-secret'), mockExecutionCtx)
    expect(ctx.isAdmin).toBe(false)
    expect(mockTimingSafeEqual).not.toHaveBeenCalled()
  })

  it('includes env in the returned context', async () => {
    const env = makeEnv()
    const req = new Request('https://example.com')
    const ctx = await createContext(req, env)
    expect(ctx.env).toBe(env)
  })
})

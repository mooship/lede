import type { Story } from '@tidel/api'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCallerFactory } from './router.js'

vi.mock('@tidel/db', () => ({
  createDb: vi.fn(() => mockDb),
  schema: {
    editions: { date: 'date' },
    stories: { editionDate: 'editionDate', position: 'position' },
  },
}))

vi.mock('./pipeline.js', () => ({
  buildEdition: vi.fn(),
  todaySAST: vi.fn(() => '2024-01-01'),
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => `${String(a)}=${b}`),
  desc: vi.fn((a) => `${String(a)} desc`),
}))

const mockStories: Story[] = [
  {
    id: '1',
    title: 'Test Story',
    description: null,
    summary: 'A summary.',
    category: 'Technology',
    link: 'https://example.com',
    pubDate: null,
    source: 'example.com',
    position: 0,
  },
]

const mockDb = {
  query: {
    editions: {
      findFirst: vi.fn(),
    },
  },
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue(
    mockStories.map((s) => ({
      ...s,
      pubDate: s.pubDate,
    })),
  ),
}

function makeEnv() {
  return {
    DATABASE_URL: 'postgres://test',
    ANTHROPIC_API_KEY: 'key',
    ADMIN_SECRET: 'test-secret',
    WEB_ORIGIN: 'http://localhost:5173',
    RATE_LIMITER: { limit: async () => ({ success: true }) },
  }
}

async function getRouter() {
  const { appRouter } = await import('./router.js')
  return appRouter
}

describe('edition.today', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no edition exists', async () => {
    mockDb.query.editions.findFirst.mockResolvedValue(undefined)
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv() })
    const result = await caller.edition.today()
    expect(result).toBeNull()
  })

  it('returns stories with correct shape when edition exists', async () => {
    mockDb.query.editions.findFirst.mockResolvedValue({ date: '2024-01-01', builtAt: new Date() })
    mockDb.orderBy.mockResolvedValue(mockStories.map((s) => ({ ...s, pubDate: s.pubDate })))
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv() })
    const result = await caller.edition.today()
    expect(result).toHaveLength(1)
    expect(result?.[0]).toMatchObject({
      id: '1',
      title: 'Test Story',
      summary: 'A summary.',
      category: 'Technology',
      source: 'example.com',
      position: 0,
      description: null,
      pubDate: null,
    })
  })

  it('falls back to the most recent edition when today has no entry', async () => {
    mockDb.query.editions.findFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ date: '2023-12-31', builtAt: new Date() })
    mockDb.orderBy.mockResolvedValue(mockStories.map((s) => ({ ...s })))
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv() })
    const result = await caller.edition.today()
    expect(result).toHaveLength(1)
    expect(mockDb.query.editions.findFirst).toHaveBeenCalledTimes(2)
  })
})

describe('edition.build', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated calls', async () => {
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv() })
    await expect(caller.edition.build({})).rejects.toThrow()
  })

  it('calls buildEdition for admin', async () => {
    const { buildEdition } = await import('./pipeline.js')
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: true, env: makeEnv() })
    const result = await caller.edition.build({})
    expect(buildEdition).toHaveBeenCalledOnce()
    expect(result).toEqual({ ok: true })
  })
})

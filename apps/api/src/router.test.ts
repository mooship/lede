import type { Story } from '@tidel/api'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCallerFactory } from './router.js'

vi.mock('@tidel/db', () => ({
  createDb: vi.fn(() => mockDb),
  schema: {
    editions: { date: 'date', slot: 'slot' },
    stories: {
      editionDate: 'editionDate',
      editionSlot: 'editionSlot',
      position: 'position',
      id: 'id',
    },
  },
}))

vi.mock('./pipeline.js', () => ({
  buildEdition: vi.fn(),
  todayUTC: vi.fn(() => '2024-01-01'),
  currentSlot: vi.fn(() => 'morning'),
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((a, b) => `${String(a)}=${b}`),
  and: vi.fn((...args: unknown[]) => args.join('&')),
  or: vi.fn((...args: unknown[]) => args.join('|')),
  ilike: vi.fn((col, val) => `${String(col)} ilike ${String(val)}`),
  desc: vi.fn((a) => `${String(a)} desc`),
  asc: vi.fn((a) => `${String(a)} asc`),
  count: vi.fn(() => 'count'),
}))

const mockStories: Story[] = [
  {
    id: '1',
    editionDate: '2024-01-01',
    editionSlot: 'morning',
    title: 'Test Story',
    description: null,
    summary: 'A summary.',
    category: 'Technology',
    link: 'https://example.com',
    pubDate: null,
    source: 'example.com',
    position: 0,
    sourceCount: 1,
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
  leftJoin: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue(
    mockStories.map((s) => ({
      ...s,
      pubDate: s.pubDate,
    })),
  ),
  limit: vi.fn().mockResolvedValue(
    mockStories.map((s) => ({
      ...s,
      pubDate: s.pubDate,
    })),
  ),
  [Symbol.iterator]: function* () {},
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

const mockExecutionCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: () => {},
  props: {},
} as unknown as ExecutionContext

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
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.today({})
    expect(result).toBeNull()
  })

  it('returns stories with correct shape when edition exists', async () => {
    mockDb.query.editions.findFirst.mockResolvedValue({
      date: '2024-01-01',
      slot: 'morning',
      builtAt: new Date(),
    })
    mockDb.orderBy.mockResolvedValue(mockStories.map((s) => ({ ...s, pubDate: s.pubDate })))
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.today({})
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

  it('falls back to the most recent morning edition when today has no entry', async () => {
    mockDb.query.editions.findFirst
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ date: '2023-12-31', slot: 'morning', builtAt: new Date() })
    mockDb.orderBy.mockResolvedValue(mockStories.map((s) => ({ ...s })))
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.today({})
    expect(result).toHaveLength(1)
    expect(mockDb.query.editions.findFirst).toHaveBeenCalledTimes(2)
  })

  it('returns null for afternoon slot when no afternoon edition exists', async () => {
    mockDb.query.editions.findFirst.mockResolvedValue(undefined)
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.today({ slot: 'afternoon' })
    expect(result).toBeNull()
    expect(mockDb.query.editions.findFirst).toHaveBeenCalledTimes(1)
  })
})

describe('edition.build', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated calls', async () => {
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    await expect(caller.edition.build({})).rejects.toThrow()
  })

  it('calls buildEdition with correct slot for admin', async () => {
    const { buildEdition } = await import('./pipeline.js')
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: true, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.build({ slot: 'afternoon' })
    expect(buildEdition).toHaveBeenCalledWith(expect.any(Object), 'afternoon')
    expect(result).toMatchObject({ ok: true, message: expect.any(String) })
  })

  it('defaults to morning slot when not specified', async () => {
    const { buildEdition } = await import('./pipeline.js')
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: true, env: makeEnv(), executionCtx: mockExecutionCtx })
    await caller.edition.build({})
    expect(buildEdition).toHaveBeenCalledWith(expect.any(Object), 'morning')
  })
})

describe('edition.list', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when no editions exist', async () => {
    mockDb.orderBy.mockResolvedValue([])
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.list()
    expect(result).toEqual([])
  })

  it('returns list with date, slot, and storyCount', async () => {
    mockDb.orderBy.mockResolvedValue([
      { date: '2024-01-02', slot: 'afternoon', storyCount: 9 },
      { date: '2024-01-02', slot: 'morning', storyCount: 12 },
      { date: '2024-01-01', slot: 'morning', storyCount: 11 },
    ])
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.list()
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ date: '2024-01-02', slot: 'afternoon', storyCount: 9 })
    expect(result[1]).toEqual({ date: '2024-01-02', slot: 'morning', storyCount: 12 })
    expect(result[2]).toEqual({ date: '2024-01-01', slot: 'morning', storyCount: 11 })
  })
})

describe('edition.byDate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when no edition exists for the given date and slot', async () => {
    mockDb.query.editions.findFirst.mockResolvedValue(undefined)
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.byDate({ date: '2024-01-01' })
    expect(result).toBeNull()
  })

  it('returns stories when edition exists for the given date', async () => {
    mockDb.query.editions.findFirst.mockResolvedValue({
      date: '2024-01-01',
      slot: 'morning',
      builtAt: new Date(),
    })
    mockDb.orderBy.mockResolvedValue(mockStories.map((s) => ({ ...s })))
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.byDate({ date: '2024-01-01', slot: 'morning' })
    expect(result).toHaveLength(1)
    expect(result?.[0]).toMatchObject({ id: '1', title: 'Test Story' })
  })

  it('throws BAD_REQUEST for invalid date format', async () => {
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    await expect(caller.edition.byDate({ date: 'not-a-date' })).rejects.toThrow()
  })

  it('returns afternoon slot stories when slot is specified', async () => {
    mockDb.query.editions.findFirst.mockResolvedValue({
      date: '2024-01-01',
      slot: 'afternoon',
      builtAt: new Date(),
    })
    const afternoonStory = { ...mockStories[0], editionSlot: 'afternoon', id: '2' }
    mockDb.orderBy.mockResolvedValue([afternoonStory])
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.byDate({ date: '2024-01-01', slot: 'afternoon' })
    expect(result).toHaveLength(1)
    expect(result?.[0]?.id).toBe('2')
  })
})

describe('edition.adminStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.groupBy.mockResolvedValue([])
  })

  it('throws UNAUTHORIZED for non-admin callers', async () => {
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    await expect(caller.edition.adminStatus()).rejects.toThrow()
  })

  it('returns null when no editions exist', async () => {
    mockDb.query.editions.findFirst.mockResolvedValue(undefined)
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: true, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.adminStatus()
    expect(result).toBeNull()
  })

  it('returns edition stats with null feedStats when feedStats is null', async () => {
    const builtAt = new Date('2024-01-01T04:00:00Z')
    mockDb.query.editions.findFirst.mockResolvedValue({
      date: '2024-01-01',
      slot: 'morning',
      builtAt,
      feedStats: null,
    })
    mockDb.orderBy.mockResolvedValue([
      { date: '2024-01-01', slot: 'morning', builtAt, feedStats: null },
    ])
    mockDb.groupBy.mockResolvedValue([])
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: true, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.adminStatus()
    expect(result).not.toBeNull()
    expect(result?.[0]?.feedStats).toBeNull()
    expect(result?.[0]?.date).toBe('2024-01-01')
    expect(result?.[0]?.builtAt).toBe(builtAt.toISOString())
  })

  it('parses feedStats JSON string into an object', async () => {
    const builtAt = new Date('2024-01-01T04:00:00Z')
    const feedStatsJson = JSON.stringify({
      'https://feed.example': 'ok',
      'https://bad.example': 'error',
    })
    mockDb.query.editions.findFirst.mockResolvedValue({
      date: '2024-01-01',
      slot: 'morning',
      builtAt,
      feedStats: feedStatsJson,
    })
    mockDb.orderBy.mockResolvedValue([
      { date: '2024-01-01', slot: 'morning', builtAt, feedStats: feedStatsJson },
    ])
    mockDb.groupBy.mockResolvedValue([])
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: true, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.adminStatus()
    expect(result?.[0]?.feedStats).toEqual({
      'https://feed.example': 'ok',
      'https://bad.example': 'error',
    })
  })

  it('includes categoryBreakdown from category query results', async () => {
    const builtAt = new Date('2024-01-01T04:00:00Z')
    mockDb.query.editions.findFirst.mockResolvedValue({
      date: '2024-01-01',
      slot: 'morning',
      builtAt,
      feedStats: null,
    })
    mockDb.orderBy.mockResolvedValue([
      { date: '2024-01-01', slot: 'morning', builtAt, feedStats: null },
    ])
    mockDb.groupBy.mockResolvedValue([
      { category: 'Technology', storyCount: 3 },
      { category: 'World', storyCount: 4 },
    ])
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: true, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.edition.adminStatus()
    expect(result?.[0]?.categoryBreakdown).toEqual({ Technology: 3, World: 4 })
  })
})

describe('story.byId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a story when found by UUID', async () => {
    mockDb.limit.mockResolvedValue([mockStories[0]])
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.story.byId('550e8400-e29b-41d4-a716-446655440000')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('1')
    expect(result?.title).toBe('Test Story')
  })

  it('returns null when no story is found', async () => {
    mockDb.limit.mockResolvedValue([])
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.story.byId('550e8400-e29b-41d4-a716-446655440000')
    expect(result).toBeNull()
  })

  it('throws BAD_REQUEST for a non-UUID string', async () => {
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    await expect(caller.story.byId('not-a-uuid')).rejects.toThrow()
  })

  it('maps all story fields correctly', async () => {
    const row = {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      editionDate: '2024-01-01',
      editionSlot: 'morning',
      title: 'Mapped Title',
      description: 'A byline.',
      summary: 'Summary here.',
      category: 'Science',
      link: 'https://nature.com/article',
      pubDate: '2024-01-01T10:00:00Z',
      source: 'nature.com',
      position: 5,
    }
    mockDb.limit.mockResolvedValue([row])
    const router = await getRouter()
    const factory = createCallerFactory(router)
    const caller = factory({ isAdmin: false, env: makeEnv(), executionCtx: mockExecutionCtx })
    const result = await caller.story.byId('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa')
    expect(result).toMatchObject({
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      title: 'Mapped Title',
      description: 'A byline.',
      summary: 'Summary here.',
      category: 'Science',
      source: 'nature.com',
      position: 5,
    })
  })
})

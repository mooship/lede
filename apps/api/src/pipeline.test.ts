import type { Category } from '@tidel/api'
import { createDb } from '@tidel/db'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_STORIES_PER_CATEGORY } from './config.js'
import type { Env } from './env.js'
import {
  buildEdition,
  curateWithClaude,
  deduplicateByTitle,
  isJunk,
  isRecentEnough,
  normaliseTitle,
  scoreBySourceOverlap,
} from './pipeline.js'
import type { RssItem } from './rss.js'
import { fetchFeed } from './rss.js'

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: mockCreate }
  }
  return { default: MockAnthropic }
})

vi.mock('./rss.js', () => ({ fetchFeed: vi.fn() }))

vi.mock('drizzle-orm', () => ({ eq: vi.fn() }))

const mockInsertValues = vi.fn().mockResolvedValue(undefined)
const mockDeleteWhere = vi.fn().mockResolvedValue(undefined)
const mockFindFirst = vi.fn()
const mockDb = {
  query: { editions: { findFirst: mockFindFirst } },
  insert: vi.fn(() => ({ values: mockInsertValues })),
  delete: vi.fn(() => ({ where: mockDeleteWhere })),
}

vi.mock('@tidel/db', () => ({
  createDb: vi.fn(),
  schema: { editions: {}, stories: {} },
}))

type CategorisedItem = RssItem & { category: Category }

function makeItem(
  title: string,
  category: Category = 'Technology',
  pubDate = '2024-01-01T00:00:00Z',
  description = 'some description',
  link = 'https://example.com',
): CategorisedItem {
  return { title, category, pubDate, description, link }
}

describe('isRecentEnough', () => {
  const today = '2026-03-06'

  it('keeps an article published today', () => {
    expect(isRecentEnough('2026-03-06T08:00:00Z', today)).toBe(true)
  })

  it('keeps an article published yesterday', () => {
    expect(isRecentEnough('2026-03-05T23:00:00Z', today)).toBe(true)
  })

  it('drops an article published 2 days ago', () => {
    expect(isRecentEnough('2026-03-04T12:00:00Z', today)).toBe(false)
  })

  it('drops an article published months ago', () => {
    expect(isRecentEnough('2026-01-01T00:00:00Z', today)).toBe(false)
  })

  it('keeps an article with no pubDate', () => {
    expect(isRecentEnough(undefined, today)).toBe(true)
    expect(isRecentEnough(null, today)).toBe(true)
    expect(isRecentEnough('', today)).toBe(true)
  })

  it('keeps an article with an unparseable pubDate', () => {
    expect(isRecentEnough('not-a-date', today)).toBe(true)
  })

  it('handles yesterday correctly at month boundary', () => {
    expect(isRecentEnough('2026-02-28T12:00:00Z', '2026-03-01')).toBe(true)
    expect(isRecentEnough('2026-02-27T12:00:00Z', '2026-03-01')).toBe(false)
  })
})

describe('normaliseTitle', () => {
  it('lowercases and strips punctuation', () => {
    expect(normaliseTitle('Hello, World!')).toBe('hello world')
  })

  it('collapses whitespace', () => {
    expect(normaliseTitle('  foo   bar  ')).toBe('foo bar')
  })
})

describe('deduplicateByTitle', () => {
  it('keeps unique titles', () => {
    const items = [makeItem('Alpha story'), makeItem('Beta story'), makeItem('Gamma story')]
    expect(deduplicateByTitle(items)).toHaveLength(3)
  })

  it('drops exact duplicate titles', () => {
    const items = [makeItem('Same title'), makeItem('Same title')]
    expect(deduplicateByTitle(items)).toHaveLength(1)
  })

  it('drops substring matches', () => {
    const items = [makeItem('Big long title about something'), makeItem('Big long title')]
    expect(deduplicateByTitle(items)).toHaveLength(1)
  })
})

describe('scoreBySourceOverlap', () => {
  it('gives score 1 for a single-source story', () => {
    const item = makeItem(
      'AI safety breakthrough',
      'Technology',
      '2024-01-01T00:00:00Z',
      'desc',
      'https://ars.technica.com/article',
    )
    const scored = scoreBySourceOverlap([item], [item])
    expect(scored[0]?.sourceScore).toBe(1)
  })

  it('gives score 3 for story matched by 3 distinct hostnames', () => {
    const unique = makeItem(
      'AI safety breakthrough',
      'Technology',
      '2024-01-01T00:00:00Z',
      'desc',
      'https://ars.technica.com/article',
    )
    const pool: CategorisedItem[] = [
      makeItem(
        'AI safety breakthrough',
        'Technology',
        '2024-01-01T00:00:00Z',
        'desc',
        'https://ars.technica.com/article',
      ),
      makeItem(
        'AI safety breakthrough news',
        'Technology',
        '2024-01-01T00:00:00Z',
        'desc',
        'https://wired.com/article',
      ),
      makeItem(
        'AI safety breakthrough report',
        'Technology',
        '2024-01-01T00:00:00Z',
        'desc',
        'https://theverge.com/article',
      ),
    ]
    const scored = scoreBySourceOverlap(pool, [unique])
    expect(scored[0]?.sourceScore).toBe(3)
  })

  it('gives score 1 when 2 pool items share the same hostname', () => {
    const unique = makeItem(
      'Major data breach',
      'Technology',
      '2024-01-01T00:00:00Z',
      'desc',
      'https://wired.com/a',
    )
    const pool: CategorisedItem[] = [
      makeItem(
        'Major data breach',
        'Technology',
        '2024-01-01T00:00:00Z',
        'desc',
        'https://wired.com/a',
      ),
      makeItem(
        'Major data breach details',
        'Technology',
        '2024-01-01T00:00:00Z',
        'desc',
        'https://wired.com/b',
      ),
    ]
    const scored = scoreBySourceOverlap(pool, [unique])
    expect(scored[0]?.sourceScore).toBe(1)
  })

  it('skips pool items with unparseable links gracefully', () => {
    const unique = makeItem(
      'Story title',
      'Technology',
      '2024-01-01T00:00:00Z',
      'desc',
      'https://example.com/a',
    )
    const pool: CategorisedItem[] = [
      makeItem('Story title', 'Technology', '2024-01-01T00:00:00Z', 'desc', 'not-a-valid-url'),
      makeItem(
        'Story title',
        'Technology',
        '2024-01-01T00:00:00Z',
        'desc',
        'https://example.com/a',
      ),
    ]
    const scored = scoreBySourceOverlap(pool, [unique])
    expect(scored[0]?.sourceScore).toBe(1)
  })
})

describe('curateWithClaude', () => {
  function makeScoredItems(count: number, category: Category = 'Technology') {
    return Array.from({ length: count }, (_, i) => ({
      ...makeItem(
        `Story ${i + 1}`,
        category,
        `2024-01-0${i + 1}T00:00:00Z`,
        'desc',
        `https://source${i}.com`,
      ),
      sourceScore: 1,
    }))
  }

  it('returns Claude-selected items for happy path [1, 3, 5, 7]', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: '[1, 3, 5, 7]' }] })
    const scored = makeScoredItems(8)
    const env = { ANTHROPIC_API_KEY: 'test-key' } as Parameters<typeof curateWithClaude>[1]
    const result = await curateWithClaude(scored, env)
    const techResults = result.filter((s) => s.category === 'Technology')
    expect(techResults).toHaveLength(4)
    expect(techResults[0]?.title).toBe('Story 1')
    expect(techResults[1]?.title).toBe('Story 3')
  })

  it('parses array when Claude response has prose before it', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'I recommend [1, 3, 5, 7]' }],
    })
    const scored = makeScoredItems(8)
    const env = { ANTHROPIC_API_KEY: 'test-key' } as Parameters<typeof curateWithClaude>[1]
    const result = await curateWithClaude(scored, env)
    expect(result.filter((s) => s.category === 'Technology')).toHaveLength(4)
  })

  it('falls back to score-sort when no JSON array in response', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: 'I cannot decide.' }] })
    const scored = makeScoredItems(8).map((s, i) => ({ ...s, sourceScore: 8 - i }))
    const env = { ANTHROPIC_API_KEY: 'test-key' } as Parameters<typeof curateWithClaude>[1]
    const result = await curateWithClaude(scored, env)
    const techResults = result.filter((s) => s.category === 'Technology')
    expect(techResults.length).toBeLessThanOrEqual(MAX_STORIES_PER_CATEGORY)
    expect(techResults[0]?.title).toBe('Story 1')
  })

  it('filters out-of-range indices and returns only valid selections', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: '[99, 1]' }] })
    const scored = makeScoredItems(8)
    const env = { ANTHROPIC_API_KEY: 'test-key' } as Parameters<typeof curateWithClaude>[1]
    const result = await curateWithClaude(scored, env)
    const techResults = result.filter((s) => s.category === 'Technology')
    expect(techResults).toHaveLength(1)
    expect(techResults[0]?.title).toBe('Story 1')
  })

  it('deduplicates indices [1, 1, 2] and caps at limit', async () => {
    mockCreate.mockResolvedValueOnce({ content: [{ type: 'text', text: '[1, 1, 2, 3]' }] })
    const scored = makeScoredItems(8)
    const env = { ANTHROPIC_API_KEY: 'test-key' } as Parameters<typeof curateWithClaude>[1]
    const result = await curateWithClaude(scored, env)
    const techResults = result.filter((s) => s.category === 'Technology')
    expect(techResults).toHaveLength(3)
    const titles = techResults.map((s) => s.title)
    expect(new Set(titles).size).toBe(3)
    expect(titles).toContain('Story 1')
    expect(titles).toContain('Story 2')
    expect(titles).toContain('Story 3')
  })

  it('returns score-sorted fallback and makes no Anthropic call when no API key', async () => {
    mockCreate.mockClear()
    const scored = makeScoredItems(8).map((s, i) => ({ ...s, sourceScore: 8 - i }))
    const env = {} as Parameters<typeof curateWithClaude>[1]
    const result = await curateWithClaude(scored, env)
    expect(mockCreate).not.toHaveBeenCalled()
    const techResults = result.filter((s) => s.category === 'Technology')
    expect(techResults.length).toBeLessThanOrEqual(MAX_STORIES_PER_CATEGORY)
    expect(techResults[0]?.title).toBe('Story 1')
  })
})

describe('isJunk', () => {
  it('keeps a clean news headline', () => {
    expect(isJunk('Germany elections: what to expect', '')).toBe(false)
  })

  it('filters promo code titles', () => {
    expect(isJunk('Save with this promo code today')).toBe(true)
  })

  it('filters coupon titles', () => {
    expect(isJunk('Best coupon deals this week')).toBe(true)
  })

  it('filters discount code titles', () => {
    expect(isJunk('Exclusive discount code for subscribers')).toBe(true)
  })

  it('filters percentage-off titles', () => {
    expect(isJunk('Get 40% off your next order')).toBe(true)
  })

  it('filters "deals of the week" titles', () => {
    expect(isJunk('Best deals of the week')).toBe(true)
  })

  it('filters sponsored content', () => {
    expect(isJunk('Sponsored: How to improve your sleep')).toBe(true)
  })

  it('filters recipe articles', () => {
    expect(isJunk('5 easy recipes for weeknight dinners')).toBe(true)
  })

  it('filters horoscope articles', () => {
    expect(isJunk('Your weekly horoscope')).toBe(true)
  })

  it('filters digest descriptions with repeated "read the full story"', () => {
    const desc = 'Read the full story. Read the full story. Read the full story.'
    expect(isJunk('World news roundup', desc)).toBe(true)
  })

  it('keeps an article with a single "read the full story" in the description', () => {
    expect(isJunk('World news roundup', 'Read the full story for details.')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isJunk('SPONSORED CONTENT: New product launch')).toBe(true)
  })
})

describe('buildEdition', () => {
  const mockEnv: Env = {
    DATABASE_URL: 'postgres://test',
    ANTHROPIC_API_KEY: undefined,
    ADMIN_SECRET: 'secret',
    WEB_ORIGIN: 'http://localhost',
    RATE_LIMITER: { limit: async () => ({ success: true }) },
  }

  const goodStory: RssItem = {
    title: 'World leaders meet for climate summit',
    description: 'Global leaders convened to discuss climate action.',
    link: 'https://bbc.com/climate',
    pubDate: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createDb).mockReturnValue(mockDb as unknown as ReturnType<typeof createDb>)
    mockInsertValues.mockResolvedValue(undefined)
    mockDeleteWhere.mockResolvedValue(undefined)
    mockFindFirst.mockResolvedValue(undefined)
  })

  it('returns early without fetching feeds when an edition already exists', async () => {
    mockFindFirst.mockResolvedValue({ date: '2024-01-01', builtAt: new Date() })
    await buildEdition(mockEnv)
    expect(fetchFeed).not.toHaveBeenCalled()
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('inserts edition and stories rows on the happy path', async () => {
    vi.mocked(fetchFeed).mockResolvedValue([goodStory])
    await buildEdition(mockEnv)
    expect(mockDb.insert).toHaveBeenCalledTimes(2)
    expect(mockInsertValues).toHaveBeenCalledTimes(2)
  })

  it('skips edition creation when all stories are filtered as junk', async () => {
    vi.mocked(fetchFeed).mockResolvedValue([
      {
        title: 'Best promo code of the week',
        description: '',
        link: 'https://example.com',
        pubDate: new Date().toISOString(),
      },
    ])
    await buildEdition(mockEnv)
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('continues processing when some feeds fail', async () => {
    vi.mocked(fetchFeed)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue([goodStory])
    await expect(buildEdition(mockEnv)).resolves.toBeUndefined()
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('rolls back the edition row if the stories insert fails', async () => {
    vi.mocked(fetchFeed).mockResolvedValue([goodStory])
    mockInsertValues
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('DB write error'))
    await expect(buildEdition(mockEnv)).rejects.toThrow('DB write error')
    expect(mockDb.delete).toHaveBeenCalled()
  })

  it('uses the Claude-rewritten title when persisting stories', async () => {
    const envWithKey: Env = { ...mockEnv, ANTHROPIC_API_KEY: 'test-key' }
    vi.mocked(fetchFeed).mockResolvedValue([
      {
        title: 'Climate summit ends in agreement | News24',
        description: 'World leaders reached a deal.',
        link: 'https://news24.com/climate',
        pubDate: new Date().toISOString(),
      },
    ])
    mockCreate
      .mockResolvedValueOnce({ content: [{ type: 'text', text: '[1]' }] }) // curate
      .mockResolvedValueOnce({
        content: [
          {
            type: 'text',
            text: 'TITLE: Climate summit ends in agreement\nBYLINE: World leaders reached a historic climate deal.\nSUMMARY: Leaders agreed on targets.',
          },
        ],
      }) // summarise
    await buildEdition(envWithKey)
    const storiesInsertCall = mockInsertValues.mock.calls[1]
    const insertedStories = storiesInsertCall?.[0] as Array<{ title: string }>
    expect(insertedStories[0]?.title).toBe('Climate summit ends in agreement')
  })
})

import type { Category } from '@lede/api'
import { describe, expect, it, vi } from 'vitest'
import { MAX_STORIES_PER_CATEGORY } from './config.js'
import {
  curateWithClaude,
  deduplicateByTitle,
  isRecentEnough,
  normaliseTitle,
  scoreBySourceOverlap,
} from './pipeline.js'
import type { RssItem } from './rss.js'

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: mockCreate }
  }
  return { default: MockAnthropic }
})

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
    // today is 2026-03-01, yesterday should be 2026-02-28
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

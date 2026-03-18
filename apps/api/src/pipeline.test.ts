import type { Category } from '@lede/api'
import { describe, expect, it } from 'vitest'
import { deduplicateByTitle, normaliseTitle, selectStories } from './pipeline.js'
import type { RssItem } from './rss.js'

type CategorisedItem = RssItem & { category: Category }

function makeItem(
  title: string,
  category: Category = 'Technology',
  pubDate = '2024-01-01T00:00:00Z',
  description = 'some description',
): CategorisedItem {
  return { title, category, pubDate, description, link: 'https://example.com' }
}

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

describe('selectStories', () => {
  it('picks top STORIES_PER_CATEGORY per category by pubDate desc', () => {
    const items: CategorisedItem[] = [
      makeItem('Tech 1', 'Technology', '2024-01-03T00:00:00Z'),
      makeItem('Tech 2', 'Technology', '2024-01-02T00:00:00Z'),
      makeItem('Tech 3', 'Technology', '2024-01-01T00:00:00Z'),
      makeItem('Tech 4', 'Technology', '2023-12-31T00:00:00Z'),
      makeItem('World 1', 'World / Politics', '2024-01-03T00:00:00Z'),
    ]
    const selected = selectStories(items)
    const techStories = selected.filter((s) => s.category === 'Technology')
    expect(techStories).toHaveLength(3)
    expect(techStories[0]?.title).toBe('Tech 1')
  })

  it('trims to TARGET_STORY_COUNT by dropping shortest descriptions when over limit', () => {
    const categories: Category[] = [
      'World / Politics',
      'Technology',
      'Science',
      'Business / Economy',
    ]
    const items: CategorisedItem[] = categories.flatMap((cat) =>
      Array.from({ length: 4 }, (_, i) => ({
        title: `${cat} story ${i + 1}`,
        category: cat,
        pubDate: `2024-01-0${i + 1}T00:00:00Z`,
        description: 'x'.repeat((i + 1) * 10),
        link: 'https://example.com',
      })),
    )
    const selected = selectStories(items)
    expect(selected.length).toBeLessThanOrEqual(10)
  })
})

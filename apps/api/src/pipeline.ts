import Anthropic from '@anthropic-ai/sdk'
import type { Category } from '@lede/api'
import { createDb, schema } from '@lede/db'
import { eq } from 'drizzle-orm'
import { FEEDS, STORIES_PER_CATEGORY, TARGET_STORY_COUNT } from './config.js'
import type { Env } from './env.js'
import type { RssItem } from './rss.js'
import { fetchFeed } from './rss.js'

function todaySAST(): string {
  const now = new Date()
  now.setUTCHours(now.getUTCHours() + 2)
  return now.toISOString().slice(0, 10)
}

const JUNK_PATTERNS = [
  /promo\s*code/i,
  /coupon/i,
  /discount\s*code/i,
  /\d+%\s*off/i,
  /deals?\s+of\s+the\s+(day|week)/i,
  /best\s+deals/i,
  /sale\s+ends/i,
  /sponsored/i,
]

export function isJunk(title: string): boolean {
  return JUNK_PATTERNS.some((p) => p.test(title))
}

export function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function deduplicateByTitle(
  items: Array<RssItem & { category: Category }>,
): Array<RssItem & { category: Category }> {
  const seen: string[] = []
  const result: Array<RssItem & { category: Category }> = []

  for (const item of items) {
    const norm = normaliseTitle(item.title)
    const isDuplicate = seen.some((s) => s === norm || s.includes(norm) || norm.includes(s))
    if (!isDuplicate) {
      seen.push(norm)
      result.push(item)
    }
  }

  return result
}

export function selectStories(
  items: Array<RssItem & { category: Category }>,
): Array<RssItem & { category: Category }> {
  const byCategory = new Map<Category, Array<RssItem & { category: Category }>>()

  for (const item of items) {
    const bucket = byCategory.get(item.category) ?? []
    bucket.push(item)
    byCategory.set(item.category, bucket)
  }

  const selected: Array<RssItem & { category: Category }> = []

  for (const [, bucket] of byCategory) {
    const sorted = [...bucket].sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return db - da
    })
    selected.push(...sorted.slice(0, STORIES_PER_CATEGORY))
  }

  if (selected.length <= TARGET_STORY_COUNT) return selected

  return [...selected]
    .sort((a, b) => b.description.length - a.description.length)
    .slice(0, TARGET_STORY_COUNT)
}

async function summarise(item: RssItem, env: Env): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    return item.description || item.title
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `You are a news summariser. Write an approximately 150-word summary of the following article.\nBe factual and concise. Use British English spelling and grammar. Output only the summary, no preamble.\n\nTitle: ${item.title}\nDescription: ${item.description}`,
      },
    ],
  })

  const block = msg.content[0]
  return block?.type === 'text' ? block.text : ''
}

export async function buildEdition(env: Env): Promise<void> {
  const db = createDb(env.DATABASE_URL)
  const date = todaySAST()

  const existing = await db.query.editions.findFirst({
    where: eq(schema.editions.date, date),
  })
  if (existing) return

  const allItems: Array<RssItem & { category: Category }> = []

  await Promise.allSettled(
    Object.entries(FEEDS).flatMap(([category, urls]) =>
      urls.map(async (url) => {
        try {
          const items = await fetchFeed(url)
          for (const item of items) {
            allItems.push({ ...item, category: category as Category })
          }
        } catch (err) {
          console.error(`Failed to fetch ${url}:`, err)
        }
      }),
    ),
  )

  const filtered = allItems.filter((item) => !isJunk(item.title))
  const unique = deduplicateByTitle(filtered)
  const selected = selectStories(unique)
  const summarised = await Promise.all(
    selected.map(async (item) => ({
      ...item,
      summary: await summarise(item, env),
    })),
  )

  await db.insert(schema.editions).values({ date, builtAt: new Date() })
  await db.insert(schema.stories).values(
    summarised.map((story, i) => ({
      editionDate: date,
      title: story.title,
      summary: story.summary,
      category: story.category,
      link: story.link,
      pubDate: story.pubDate || null,
      source: new URL(story.link).hostname.replace(/^www\./, ''),
      position: i,
    })),
  )
}

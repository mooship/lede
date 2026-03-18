import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
import type { Category } from '@lede/api'
import { createDb, schema } from '@lede/db'
import { eq } from 'drizzle-orm'
import { FEEDS, STORIES_PER_CATEGORY } from './config.js'
import type { Env } from './env.js'
import type { RssItem } from './rss.js'
import { fetchFeed } from './rss.js'

export function todaySAST(): string {
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
  const seen = new Set<string>()
  const seenList: string[] = []
  const result: Array<RssItem & { category: Category }> = []

  for (const item of items) {
    const norm = normaliseTitle(item.title)
    if (seen.has(norm)) {
      continue
    }
    const isDuplicate = seenList.some((s) => s.includes(norm) || norm.includes(s))
    if (!isDuplicate) {
      seen.add(norm)
      seenList.push(norm)
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

  return selected
}

const MAX_DESCRIPTION_CHARS = 3000

const SUMMARISE_PROMPT = (item: RssItem) =>
  `You are a news summariser. Write an approximately 150-word summary of the following article.\nBe factual and concise. Use British English spelling and grammar. Output only the summary, no preamble.\n\nTitle: ${item.title}\nDescription: ${item.description.slice(0, MAX_DESCRIPTION_CHARS)}`

function createSummariser(env: Env): (item: RssItem) => Promise<string> {
  const raw = async (item: RssItem) => item.description || item.title

  const gemini = env.GEMINI_API_KEY
    ? (() => {
        const genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! })
        return async (item: RssItem) => {
          const res = await genai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: SUMMARISE_PROMPT(item),
          })
          return res.text ?? ''
        }
      })()
    : null

  if (env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const fallback = gemini ?? raw
    const fallbackName = gemini ? 'Gemini' : 'raw description'
    console.log(`[summariser] Anthropic (fallback: ${fallbackName})`)
    return async (item) => {
      try {
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{ role: 'user', content: SUMMARISE_PROMPT(item) }],
        })
        const block = msg.content[0]
        return block?.type === 'text' ? block.text : ''
      } catch (err) {
        console.error(`[summariser] Anthropic failed for "${item.title}", falling back to ${fallbackName}:`, err)
        return fallback(item)
      }
    }
  }

  if (gemini) {
    console.log('[summariser] Gemini gemini-3-flash-preview')
    return gemini
  }

  console.log('[summariser] no AI key — using raw description')
  return raw
}

export async function buildEdition(env: Env): Promise<void> {
  const db = createDb(env.DATABASE_URL)
  const date = todaySAST()

  const existing = await db.query.editions.findFirst({
    where: eq(schema.editions.date, date),
  })
  if (existing) {
    return
  }

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

  const summariser = createSummariser(env)
  const summarised = await Promise.all(
    selected.map(async (item) => ({
      ...item,
      summary: await summariser(item),
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
      source: (() => {
        try {
          return story.link ? new URL(story.link).hostname.replace(/^www\./, '') : ''
        } catch {
          return ''
        }
      })(),
      position: i,
    })),
  )
}

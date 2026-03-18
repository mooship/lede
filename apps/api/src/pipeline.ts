import Anthropic from '@anthropic-ai/sdk'
import type { Category } from '@lede/api'
import { createDb, schema } from '@lede/db'
import { eq } from 'drizzle-orm'
import { FEEDS, STORIES_PER_CATEGORY } from './config.js'
import type { Env } from './env.js'
import type { RssItem } from './rss.js'
import { fetchArticleText, fetchFeed } from './rss.js'

export function todaySAST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date())
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

function hostnameFromUrl(url: string | undefined | null): string {
  if (!url) {
    return ''
  }
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function groupByCategory<T extends { category: Category }>(items: T[]): Map<Category, T[]> {
  const map = new Map<Category, T[]>()
  for (const item of items) {
    const bucket = map.get(item.category) ?? []
    bucket.push(item)
    map.set(item.category, bucket)
  }
  return map
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

export type ScoredItem = RssItem & { category: Category; sourceScore: number }

export function scoreBySourceOverlap(
  pool: Array<RssItem & { category: Category }>,
  unique: Array<RssItem & { category: Category }>,
): ScoredItem[] {
  const poolNorm = pool.map((p) => ({ norm: normaliseTitle(p.title), hostname: hostnameFromUrl(p.link) }))

  return unique.map((u) => {
    const normU = normaliseTitle(u.title)
    const hostnames = new Set<string>()

    for (const p of poolNorm) {
      if (p.norm.includes(normU) || normU.includes(p.norm)) {
        if (p.hostname) {
        hostnames.add(p.hostname)
      }
      }
    }

    return { ...u, sourceScore: Math.max(hostnames.size, 1) }
  })
}

export async function curateWithClaude(
  scored: ScoredItem[],
  env: Env,
): Promise<Array<RssItem & { category: Category }>> {
  const byCategory = groupByCategory(scored)

  const fallbackSort = (items: ScoredItem[]): ScoredItem[] =>
    [...items].sort((a, b) => {
      if (b.sourceScore !== a.sourceScore) {
        return b.sourceScore - a.sourceScore
      }
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return db - da
    })

  if (!env.ANTHROPIC_API_KEY) {
    const result: Array<RssItem & { category: Category }> = []
    for (const [category, bucket] of byCategory) {
      result.push(...fallbackSort(bucket).slice(0, STORIES_PER_CATEGORY[category]))
    }
    return result
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const categoryResults = await Promise.allSettled(
    Array.from(byCategory.entries()).map(async ([category, bucket]) => {
      const limit = STORIES_PER_CATEGORY[category]
      const storyList = bucket
        .map((item, i) => `${i + 1}. [sources: ${item.sourceScore}] ${item.title}`)
        .join('\n')

      const prompt = `You are a news editor selecting the most significant stories for a daily digest.

Category: ${category}
Select up to ${limit} stories. Only include stories that are genuinely newsworthy — prefer stories covered by multiple sources and broadly significant over niche ones. Include fewer if the remaining stories are not worth publishing.
Return ONLY a JSON array of the 1-based numbers you selected, e.g. [1, 3, 5, 7]. No other text.

Stories:
${storyList}`

      try {
        const msg = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }],
        })
        const block = msg.content[0]
        const text = block?.type === 'text' ? block.text : ''
        const match = text.match(/\[[\d,\s]+\]/)

        if (!match) {
          console.warn(`[curate] no JSON array in Claude response for ${category}, falling back`)
          return fallbackSort(bucket).slice(0, limit)
        }

        const indices: number[] = JSON.parse(match[0])
        const seen = new Set<number>()
        const validIndices = indices.filter((idx) => {
          if (!Number.isInteger(idx) || idx < 1 || idx > bucket.length || seen.has(idx)) {
            return false
          }
          seen.add(idx)
          return true
        })

        const selected = validIndices.slice(0, limit).map((idx) => bucket[idx - 1] as ScoredItem)
        console.log(`[curate] Claude selected ${selected.length}/${bucket.length} for ${category}`)
        return selected
      } catch (err) {
        console.warn(`[curate] Claude failed for ${category}, falling back:`, err)
        return fallbackSort(bucket).slice(0, limit)
      }
    }),
  )

  const result: Array<RssItem & { category: Category }> = []
  for (const outcome of categoryResults) {
    if (outcome.status === 'fulfilled') {
      result.push(...outcome.value)
    }
  }
  return result
}

export function selectStories(
  items: Array<RssItem & { category: Category }>,
): Array<RssItem & { category: Category }> {
  const byCategory = groupByCategory(items)
  const selected: Array<RssItem & { category: Category }> = []

  for (const [category, bucket] of byCategory) {
    const sorted = [...bucket].sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return db - da
    })
    selected.push(...sorted.slice(0, STORIES_PER_CATEGORY[category]))
  }

  return selected
}

const MAX_DESCRIPTION_CHARS = 3000

const SUMMARISE_PROMPT = (item: RssItem) =>
  `You are a news summariser. Write an approximately 150-word summary of the following article.\nBe factual and concise. Use British English spelling and grammar. Output only the summary, no preamble.\n\nTitle: ${item.title}\nDescription: ${(item.articleText ?? item.description).slice(0, MAX_DESCRIPTION_CHARS)}`

function createSummariser(env: Env): (item: RssItem) => Promise<string> {
  const raw = async (item: RssItem) => item.articleText || item.description || item.title

  if (env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    console.log('[summariser] Claude Haiku')
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
        console.error(`[summariser] Claude failed for "${item.title}", falling back to raw:`, err)
        return raw(item)
      }
    }
  }

  console.log('[summariser] no API key — using raw description')
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
  const scored = scoreBySourceOverlap(filtered, unique)
  const selected = await curateWithClaude(scored, env)

  const enriched = await Promise.all(
    selected.map(async (item) => {
      if (!item.link) {
        return item
      }
      try {
        const articleText = await fetchArticleText(item.link)
        return articleText.length > item.description.length
          ? { ...item, articleText }
          : item
      } catch (err) {
        console.error(`[enrich] failed to fetch article for "${item.title}":`, err)
        return item
      }
    }),
  )

  const summariser = createSummariser(env)
  const summarised = await Promise.all(
    enriched.map(async (item) => ({
      ...item,
      summary: await summariser(item),
    })),
  )

  await db.insert(schema.editions).values({ date, builtAt: new Date() })
  await db.insert(schema.stories).values(
    summarised.map((story, i) => ({
      editionDate: date,
      title: story.title,
      description: story.description || null,
      summary: story.summary,
      category: story.category,
      link: story.link,
      pubDate: story.pubDate || null,
      source: hostnameFromUrl(story.link),
      position: i,
    })),
  )
}

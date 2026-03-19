import Anthropic from '@anthropic-ai/sdk'
import type { Category } from '@tidel/api'
import { createDb, schema } from '@tidel/db'
import { eq } from 'drizzle-orm'
import { FEEDS, MAX_STORIES_PER_CATEGORY, TARGET_STORY_COUNT } from './config.js'
import type { Env } from './env.js'
import type { RssItem } from './rss.js'
import { fetchFeed } from './rss.js'

const SAST_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' })

/** Returns today's date in SAST (Africa/Johannesburg, UTC+2) as YYYY-MM-DD. */
export function todaySAST(): string {
  return SAST_DATE_FORMAT.format(new Date())
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
  /^what'?s\s+cooking/i,
  /\brecipe[s]?\b/i,
  /\bhoroscope[s]?\b/i,
]

/**
 * Returns `true` if the article was published today or yesterday (SAST).
 * Missing or unparseable dates are treated as recent to avoid silently dropping articles.
 */
export function isRecentEnough(pubDate: string | undefined | null, todayStr: string): boolean {
  if (!pubDate) {
    return true
  }
  const d = new Date(pubDate)
  if (Number.isNaN(d.getTime())) {
    return true
  }
  const articleDate = SAST_DATE_FORMAT.format(d)
  if (articleDate === todayStr) {
    return true
  }
  const yesterday = new Date(`${todayStr}T12:00:00`)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = SAST_DATE_FORMAT.format(yesterday)
  return articleDate === yesterdayStr
}

/** Filters promotional, lifestyle, and digest-filler content by title and description heuristics. */
export function isJunk(title: string, description = ''): boolean {
  if (JUNK_PATTERNS.some((p) => p.test(title))) {
    return true
  }
  const digestMatches = description.match(/read the full story/gi)
  return digestMatches !== null && digestMatches.length > 1
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

/**
 * Removes duplicate items by normalised title, including substring matches
 * (e.g. "Story A" and "Story A — updated" are treated as the same story).
 */
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

/**
 * Scores each unique item by how many distinct source hostnames covered the same story
 * across the full (pre-dedup) pool. Minimum score is 1.
 */
export function scoreBySourceOverlap(
  pool: Array<RssItem & { category: Category }>,
  unique: Array<RssItem & { category: Category }>,
): ScoredItem[] {
  const poolNorm = pool.map((p) => ({
    norm: normaliseTitle(p.title),
    hostname: hostnameFromUrl(p.link),
  }))

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

/**
 * Asks Claude to pick ~15 stories across all categories from the scored pool.
 * Falls back to a score-then-recency sort if no API key is set or Claude fails.
 */
export async function curateWithClaude(
  scored: ScoredItem[],
  env: Env,
): Promise<Array<RssItem & { category: Category }>> {
  const byCategory = groupByCategory(scored)
  const numCategories = byCategory.size
  const fallbackPerCategory = Math.min(
    MAX_STORIES_PER_CATEGORY,
    Math.floor(TARGET_STORY_COUNT / numCategories),
  )

  const fallbackSort = (items: ScoredItem[]): ScoredItem[] =>
    [...items].sort((a, b) => {
      if (b.sourceScore !== a.sourceScore) return b.sourceScore - a.sourceScore
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return db - da
    })

  const fallbackResult = (): Array<RssItem & { category: Category }> => {
    const result: Array<RssItem & { category: Category }> = []
    for (const [, bucket] of byCategory) {
      result.push(...fallbackSort(bucket).slice(0, fallbackPerCategory))
    }
    return result
  }

  if (!env.ANTHROPIC_API_KEY) return fallbackResult()

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const allStories: ScoredItem[] = []
  const categoryBlocks: string[] = []
  for (const [category, bucket] of byCategory) {
    const startIdx = allStories.length + 1
    allStories.push(...bucket)
    const lines = bucket.map(
      (item, i) => `${startIdx + i}. [sources: ${item.sourceScore}] ${item.title}`,
    )
    categoryBlocks.push(`${category}:\n${lines.join('\n')}`)
  }

  const prompt = `You are a news editor curating a daily digest for an international audience.

Select as close to ${TARGET_STORY_COUNT} stories as possible (minimum 9). At most ${MAX_STORIES_PER_CATEGORY} from any single category. Try to include at least 1 story from each category if there is something newsworthy.

Include only hard news: politics, geopolitics, economic policy, and science discoveries. Aim for geographic diversity — stories from Europe, the Americas, Africa, Asia, the Middle East, and Oceania are all welcome. Exclude food, lifestyle, travel, entertainment, opinion columns, and human-interest content.

For Sport, only select results from major international competitions (World Cup, Olympics, Grand Slams, major league finals) or significant breaking news from the world of sport.

Give strong preference to stories with higher source counts — a story covered by multiple outlets is more significant than one covered by a single source. Never select more than one story about the same event or topic — if multiple stories cover the same event, pick the one with the highest source count and skip the rest.

Return ONLY a JSON array of story numbers, e.g. [1, 3, 5, 7]. No other text.

${categoryBlocks.join('\n\n')}`

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = msg.content[0]
    const text = block?.type === 'text' ? block.text : ''
    const match = text.match(/\[[\d,\s]+\]/)

    if (!match) {
      console.warn('[curate] no JSON array in Claude response, falling back')
      return fallbackResult()
    }

    const indices: number[] = JSON.parse(match[0])
    const seen = new Set<number>()
    const validIndices = indices.filter((n) => {
      if (!Number.isInteger(n) || n < 1 || n > allStories.length || seen.has(n)) return false
      seen.add(n)
      return true
    })

    const countByCategory = new Map<Category, number>()
    const result: Array<RssItem & { category: Category }> = []
    for (const n of validIndices) {
      const story = allStories[n - 1] as ScoredItem
      const count = countByCategory.get(story.category) ?? 0
      if (count < MAX_STORIES_PER_CATEGORY) {
        result.push(story)
        countByCategory.set(story.category, count + 1)
      }
    }

    console.log(
      `[curate] Claude selected ${result.length} stories across ${numCategories} categories`,
    )
    return result
  } catch (err) {
    console.warn('[curate] Claude failed, falling back:', err)
    return fallbackResult()
  }
}

const MAX_DESCRIPTION_CHARS = 3000

const SUMMARISE_PROMPT = (item: RssItem) =>
  `You are a news summariser. Write the following for the article below. Use British English. No other text.

TITLE: A clean, publication-quality headline. Strip any source attribution from the start or end (e.g. "| News24", "- BBC Sport", "Reuters: ").
BYLINE: A single factual sentence, max 25 words.
SUMMARY: A factual, concise summary of approximately 150 words.

Title: ${item.title}
Article: ${item.description.slice(0, MAX_DESCRIPTION_CHARS)}`

type SummariseResult = { title: string; byline: string; summary: string }

function parseSummariseResponse(
  text: string,
  fallbackTitle: string,
  fallbackByline: string,
): SummariseResult {
  const titleMatch = text.match(/^\*{0,2}TITLE:\*{0,2}\s*(.+)/m)
  const bylineMatch = text.match(/^\*{0,2}BYLINE:\*{0,2}\s*(.+)/m)
  const summaryMatch = text.match(/^\*{0,2}SUMMARY:\*{0,2}\s*([\s\S]+)/m)
  const title = titleMatch?.[1]?.trim() ?? fallbackTitle
  const byline = bylineMatch?.[1]?.trim() ?? fallbackByline
  const summary = (summaryMatch?.[1]?.trim() ?? text).replace(/^#+\s+\S[^\n]*\n+/, '')
  return { title, byline, summary }
}

function createSummariser(env: Env): (item: RssItem) => Promise<SummariseResult> {
  const raw = async (item: RssItem): Promise<SummariseResult> => ({
    title: item.title,
    byline: item.description || item.title,
    summary: item.description || item.title,
  })

  if (env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    console.log('[summariser] Claude Sonnet')
    return async (item) => {
      try {
        const msg = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          messages: [{ role: 'user', content: SUMMARISE_PROMPT(item) }],
        })
        const block = msg.content[0]
        const text = block?.type === 'text' ? block.text : ''
        return parseSummariseResponse(text, item.title, item.description || item.title)
      } catch (err) {
        console.error(`[summariser] Claude failed for "${item.title}", falling back to raw:`, err)
        return raw(item)
      }
    }
  }

  console.log('[summariser] no API key — using raw description')
  return raw
}

/**
 * Builds and persists today's edition. Idempotent — returns early if an edition
 * for today's SAST date already exists in the database.
 */
export async function buildEdition(env: Env): Promise<void> {
  const db = createDb(env.DATABASE_URL)
  const date = todaySAST()

  const existing = await db.query.editions.findFirst({
    where: eq(schema.editions.date, date),
  })
  if (existing) {
    return
  }

  const feedEntries = Object.entries(FEEDS).flatMap(([category, urls]) =>
    urls.map((url) => ({ url, category: category as Category })),
  )

  const feedResults = await Promise.allSettled(feedEntries.map(({ url }) => fetchFeed(url)))

  const feedStats: Record<string, 'ok' | 'timeout' | 'error'> = {}
  const allItems: Array<RssItem & { category: Category }> = []
  for (const [i, result] of feedResults.entries()) {
    const feedEntry = feedEntries[i]
    if (!feedEntry) continue

    if (result.status === 'fulfilled') {
      feedStats[feedEntry.url] = 'ok'
      for (const item of result.value) {
        allItems.push({ ...item, category: feedEntry.category })
      }
    } else {
      const reason = result.reason
      const isTimeout =
        reason instanceof Error &&
        (reason.message.includes('timeout') || reason.message.includes('timed out'))
      feedStats[feedEntry.url] = isTimeout ? 'timeout' : 'error'
      console.error(`Failed to fetch ${feedEntry.url}:`, reason)
    }
  }

  const filtered = allItems.filter(
    (item) => !isJunk(item.title, item.description) && isRecentEnough(item.pubDate, date),
  )
  const unique = deduplicateByTitle(filtered)
  const scored = scoreBySourceOverlap(filtered, unique)
  const selected = await curateWithClaude(scored, env)

  const summariser = createSummariser(env)
  const summarised = await Promise.all(
    selected.map(async (item) => {
      const { title, byline, summary } = await summariser(item)
      return { ...item, title, byline, summary }
    }),
  )

  if (summarised.length === 0) {
    console.warn('[buildEdition] No stories selected — skipping edition creation')
    return
  }

  await db
    .insert(schema.editions)
    .values({ date, builtAt: new Date(), feedStats: JSON.stringify(feedStats) })
  try {
    await db.insert(schema.stories).values(
      summarised.map((story, i) => ({
        editionDate: date,
        title: story.title,
        description: story.byline || null,
        summary: story.summary,
        category: story.category,
        link: story.link,
        pubDate: story.pubDate || null,
        source: hostnameFromUrl(story.link),
        position: i,
      })),
    )
  } catch (err) {
    console.error('[buildEdition] Failed to insert stories, rolling back edition:', err)
    await db.delete(schema.editions).where(eq(schema.editions.date, date))
    throw err
  }
}

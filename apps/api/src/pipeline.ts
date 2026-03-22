import Anthropic from '@anthropic-ai/sdk'
import type { Category } from '@tidel/api'
import { createDb, schema } from '@tidel/db'
import { and, eq } from 'drizzle-orm'
import { FEEDS, SLOT_CONFIG } from './config.js'
import type { Env } from './env.js'
import type { RssItem } from './rss.js'
import { fetchFeed } from './rss.js'

const UTC_DATE_FORMAT = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' })

export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxAttempts = 3, baseDelayMs = 1000 }: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt < maxAttempts) {
        const base = baseDelayMs * 2 ** (attempt - 1)
        const delay = base + Math.random() * base * 0.25
        console.warn(
          `[retry] attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms:`,
          err,
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  throw lastErr
}

/** Returns today's date in UTC as YYYY-MM-DD. */
export function todayUTC(): string {
  return UTC_DATE_FORMAT.format(new Date())
}

/** Returns 'afternoon' after 15:00 UTC (when the afternoon cron runs), otherwise 'morning'. */
export function currentSlot(): 'morning' | 'afternoon' {
  return new Date().getUTCHours() >= 15 ? 'afternoon' : 'morning'
}

const JUNK_PATTERNS = [
  /^security\s+news\s+this\s+week\b/i,
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
 * Returns `true` if the article was published today or yesterday (UTC).
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
  const articleDate = UTC_DATE_FORMAT.format(d)
  if (articleDate === todayStr) {
    return true
  }
  const yesterday = new Date(`${todayStr}T12:00:00Z`)
  yesterday.setUTCDate(yesterday.getUTCDate() - 1)
  const yesterdayStr = UTC_DATE_FORMAT.format(yesterday)
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

export type ScoredItem = RssItem & { category: Category }

type CurationConfig = {
  max: number
  maxPerCat: number
  slotLabel: string
}

function getCurationConfig(slot: 'morning' | 'afternoon'): CurationConfig {
  return { ...SLOT_CONFIG[slot], slotLabel: slot }
}

/**
 * Asks Claude to pick stories across all categories from the scored pool.
 * Falls back to a score-then-recency sort if no API key is set or Claude fails.
 */
export async function curateWithClaude(
  scored: ScoredItem[],
  env: Env,
  slot: 'morning' | 'afternoon' = 'morning',
  anthropicClient: Anthropic | null = null,
): Promise<ScoredItem[]> {
  const cfg = getCurationConfig(slot)
  const byCategory = groupByCategory(scored)
  const numCategories = byCategory.size
  const fallbackPerCategory = Math.min(cfg.maxPerCat, Math.floor(cfg.max / numCategories))

  const fallbackSort = (items: ScoredItem[]): ScoredItem[] =>
    [...items].sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return db - da
    })

  const fallbackResult = (): ScoredItem[] => {
    const result: ScoredItem[] = []
    for (const [, bucket] of byCategory) {
      result.push(...fallbackSort(bucket).slice(0, fallbackPerCategory))
    }
    return result
  }

  const client =
    anthropicClient ??
    (env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null)
  if (!client) {
    return fallbackResult()
  }

  const allStories: ScoredItem[] = []
  const categoryBlocks: string[] = []
  for (const [category, bucket] of byCategory) {
    const startIdx = allStories.length + 1
    allStories.push(...bucket)
    const lines = bucket.map((item, i) => `${startIdx + i}. ${item.title}`)
    categoryBlocks.push(`${category}:\n${lines.join('\n')}`)
  }

  const afternoonNote =
    slot === 'afternoon'
      ? '\nThis is an afternoon digest. Focus on stories that broke or developed since this morning. Prefer novelty — avoid topics already covered in the morning news cycle.\n'
      : ''

  const prompt = `You are a senior news editor curating a ${cfg.slotLabel} digest for an international audience.
${afternoonNote}
Select up to ${cfg.max} stories — that is a hard ceiling, never exceed it. Only include a story if it genuinely merits publication. Quality always takes priority over filling a quota.

Source count is a strong signal of significance — a story covered by multiple outlets is more important than one covered by a single source. Prefer higher source counts when choosing between stories of similar newsworthiness.

Rules:
- At most ${cfg.maxPerCat} stories from any single category.
- Try to include at least one story from each category if a genuinely newsworthy story exists, but do not force inclusion from a category if nothing merits it.
- Never select more than one story about the same event or topic. If multiple stories cover the same event, pick the one with the highest source count and skip the rest.

Editorial criteria by category:
- World: Prioritise hard news — politics, geopolitics, conflict, diplomacy, and major policy decisions. Aim for geographic diversity across Europe, the Americas, Africa, Asia, the Middle East, and Oceania.
- Technology: Select significant product launches, regulatory actions, cybersecurity incidents, and industry shifts. Skip gadget reviews, app updates, and listicles.
- Science: Select discoveries, studies, and space/climate developments with broad significance.
- Business / Economy: Select macroeconomic policy, central bank decisions, major corporate news, and market-moving events. Skip personal finance tips and stock picks.
- Sport: Select results from major competitions, world records, historically significant individual achievements, and significant breaking news (injuries, retirements, controversies). Skip routine match results, transfer rumours, and roundup articles that merely list results without a specific story.
- Culture: Select significant events in art, music, film, literature, and media — major releases, awards, institutional news, notable deaths, censorship, and cultural policy. Skip celebrity gossip, reality TV, and commercial entertainment news.

Exclude across all categories: food, lifestyle, travel, celebrity gossip, opinion columns, human-interest stories, promotional content, and roundup/recap articles that aggregate multiple events without a clear central news development (e.g. "Day One results", "weekly roundup", "all the winners").

Respond with ONLY a JSON array of story numbers, e.g. [1, 3, 5, 7]. No explanation, no markdown fences, no preamble.

${categoryBlocks.join('\n\n')}`

  try {
    const match = await withRetry(async () => {
      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      })
      const block = msg.content[0]
      const text = block?.type === 'text' ? block.text : ''
      const m = text.match(/\[[\d,\s]+\]/)
      if (!m) {
        throw new Error(`no JSON array in Claude response: ${text.slice(0, 100)}`)
      }
      return m
    })

    const indices: number[] = JSON.parse(match[0])
    const seen = new Set<number>()
    const validIndices = indices.filter((n) => {
      if (!Number.isInteger(n) || n < 1 || n > allStories.length || seen.has(n)) {
        return false
      }
      seen.add(n)
      return true
    })

    const countByCategory = new Map<Category, number>()
    const result: ScoredItem[] = []
    for (const n of validIndices) {
      if (result.length >= cfg.max) {
        break
      }
      const story = allStories[n - 1] as ScoredItem
      const count = countByCategory.get(story.category) ?? 0
      if (count < cfg.maxPerCat) {
        result.push(story)
        countByCategory.set(story.category, count + 1)
      }
    }

    console.log(
      `[curate] Claude selected ${result.length} stories across ${numCategories} categories`,
    )
    return result
  } catch (err) {
    console.warn('[curate] Claude failed after all retries, falling back:', err)
    return fallbackResult()
  }
}

const MAX_DESCRIPTION_CHARS = 3000

const SUMMARISE_PROMPT = (item: RssItem) =>
  `You are a staff journalist at a daily news digest. Use British English throughout.

Using the news details below as your source, write three fields for publication:

TITLE: A clean, publication-quality headline. Remove any source attribution (e.g. "| News24", "- BBC Sport", "Reuters: ") and any leading/trailing punctuation artifacts. Do not wrap in quotes.
BYLINE: One sentence, no more than 15 words, capturing the key development. Where the story genuinely affects working people, marginalised communities, or the environment, centre that impact — otherwise state the key fact plainly.
SUMMARY: 50-200 words of original, publication-ready prose — use only as many words as the story needs. Write as a journalist reporting the story — not as someone summarising a document. Lead with the most important fact. Omit filler, padding, and repetition. Where the story genuinely affects working people, marginalised communities, or the environment, highlight that impact — do not force this framing onto stories where it does not apply. Do not speculate beyond what the details support. Do not refer to a source, article, or report.

Do not use markdown formatting. Output exactly these labels, one per line, with no other text:
TITLE: <headline>
BYLINE: <sentence>
SUMMARY: <paragraph>

Title: ${item.title}
Details: ${item.description.slice(0, MAX_DESCRIPTION_CHARS)}`

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

function createSummariser(
  env: Env,
  anthropicClient: Anthropic | null = null,
): (item: RssItem) => Promise<SummariseResult> {
  const raw = async (item: RssItem): Promise<SummariseResult> => ({
    title: item.title,
    byline: item.description || item.title,
    summary: item.description || item.title,
  })

  const client =
    anthropicClient ??
    (env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null)
  if (client) {
    console.log('[summariser] Claude Haiku')
    return async (item) => {
      try {
        return await withRetry(async () => {
          const msg = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            messages: [{ role: 'user', content: SUMMARISE_PROMPT(item) }],
          })
          const block = msg.content[0]
          const text = block?.type === 'text' ? block.text : ''
          return parseSummariseResponse(text, item.title, item.description || item.title)
        })
      } catch (err) {
        console.error(
          `[summariser] Claude failed after all retries for "${item.title}", falling back to raw:`,
          err,
        )
        return raw(item)
      }
    }
  }

  console.log('[summariser] no API key — using raw description')
  return raw
}

async function purgeEditionCache(zoneId: string, apiToken: string): Promise<void> {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ purge_everything: true }),
  })
  if (!res.ok) {
    throw new Error(`Cloudflare purge failed: ${res.status} ${await res.text()}`)
  }
  console.log('[purgeCache] Cloudflare cache purged')
}

/**
 * Builds and persists today's edition for the given slot. Idempotent — returns early if an
 * edition for today's UTC date and slot already exists in the database.
 */
export async function buildEdition(
  env: Env,
  slot: 'morning' | 'afternoon' = 'morning',
): Promise<void> {
  const db = createDb(env.DATABASE_URL)
  const date = todayUTC()

  console.log(`[buildEdition] starting ${slot} build for ${date}`)

  const existing = await db.query.editions.findFirst({
    where: and(eq(schema.editions.date, date), eq(schema.editions.slot, slot)),
  })
  if (existing) {
    console.log(`[buildEdition] ${slot} edition for ${date} already exists, skipping`)
    return
  }

  let excludeLinks = new Set<string>()
  if (slot === 'afternoon') {
    const morningStories = await db
      .select({ link: schema.stories.link })
      .from(schema.stories)
      .where(and(eq(schema.stories.editionDate, date), eq(schema.stories.editionSlot, 'morning')))
    excludeLinks = new Set(morningStories.map((r) => r.link))
  }

  const feedEntries = Object.entries(FEEDS).flatMap(([category, urls]) =>
    urls.map((url) => ({ url, category: category as Category })),
  )

  const feedResults = await Promise.allSettled(feedEntries.map(({ url }) => fetchFeed(url)))

  const feedStats: Record<string, 'ok' | 'timeout' | 'error'> = {}
  const allItems: Array<RssItem & { category: Category }> = []
  for (const [i, result] of feedResults.entries()) {
    const feedEntry = feedEntries[i]
    if (!feedEntry) {
      continue
    }

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
      console.error(
        `[buildEdition] feed fetch failed (${feedStats[feedEntry.url]}): ${feedEntry.url}`,
        reason,
      )
    }
  }

  const okCount = Object.values(feedStats).filter((v) => v === 'ok').length
  const failCount = feedEntries.length - okCount
  if (failCount > 0) {
    console.warn(
      `[buildEdition] ${failCount}/${feedEntries.length} feeds failed; ${allItems.length} items from ${okCount} feeds`,
    )
  } else {
    console.log(`[buildEdition] all ${feedEntries.length} feeds ok; ${allItems.length} items`)
  }

  const filtered = allItems.filter(
    (item) =>
      !isJunk(item.title, item.description) &&
      isRecentEnough(item.pubDate, date) &&
      !excludeLinks.has(item.link),
  )
  const scored: ScoredItem[] = deduplicateByTitle(filtered)
  const anthropicClient = env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    : null
  const selected: ScoredItem[] = await curateWithClaude(scored, env, slot, anthropicClient)

  const summariser = createSummariser(env, anthropicClient)
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

  await withRetry(() =>
    db
      .insert(schema.editions)
      .values({ date, slot, builtAt: new Date(), feedStats: JSON.stringify(feedStats) })
      .onConflictDoNothing(),
  )
  try {
    await withRetry(() =>
      db.insert(schema.stories).values(
        summarised.map((story, i) => ({
          editionDate: date,
          editionSlot: slot,
          title: story.title,
          description: story.byline || null,
          summary: story.summary,
          category: story.category,
          link: story.link,
          pubDate: story.pubDate || null,
          source: hostnameFromUrl(story.link),
          position: i,
        })),
      ),
    )
  } catch (err) {
    const pg = err as Record<string, unknown>
    console.error('[buildEdition] Failed to insert stories, rolling back edition:', {
      message: err instanceof Error ? err.message : String(err),
      code: pg.code,
      detail: pg.detail,
      constraint: pg.constraint,
      table: pg.table,
    })
    try {
      await db
        .delete(schema.editions)
        .where(and(eq(schema.editions.date, date), eq(schema.editions.slot, slot)))
    } catch (deleteErr) {
      console.error(
        '[buildEdition] Rollback delete also failed:',
        deleteErr instanceof Error ? deleteErr.message : String(deleteErr),
      )
    }
    throw err
  }

  console.log(
    `[buildEdition] ${slot} build complete: ${summarised.length} stories persisted for ${date}`,
  )

  const { CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN } = env
  if (CLOUDFLARE_ZONE_ID && CLOUDFLARE_API_TOKEN) {
    try {
      await withRetry(() => purgeEditionCache(CLOUDFLARE_ZONE_ID, CLOUDFLARE_API_TOKEN))
    } catch (err) {
      console.error('[purgeCache] failed after retries:', err)
    }
  }
}

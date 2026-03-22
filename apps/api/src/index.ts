import { trpcServer } from '@hono/trpc-server'
import type { Story } from '@tidel/api'
import { secondsUntilNextEdition } from '@tidel/api'
import { createDb, schema } from '@tidel/db'
import { and, desc, eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createContext } from './context.js'
import { parseWebOrigins, resolveCorsOrigin } from './cors.js'
import type { Env } from './env.js'
import { validateEnv } from './env.js'
import { buildEdition, todayUTC } from './pipeline.js'
import { appRouter, mapStoryRow } from './router.js'

const IMMUTABLE_TTL = 7 * 24 * 3600

function trpcCacheMiddleware(getSecs: () => number) {
  return async (c: Context<{ Bindings: Env }>, next: () => Promise<void>) => {
    await next()
    try {
      const parsed = JSON.parse(await c.res.clone().text())
      const data = Array.isArray(parsed) ? parsed[0]?.result?.data : parsed?.result?.data
      const hasData =
        data !== null && data !== undefined && !(Array.isArray(data) && data.length === 0)
      if (hasData) {
        const secs = getSecs()
        c.res.headers.set('Cache-Control', `public, s-maxage=${secs}, stale-while-revalidate=86400`)
      }
    } catch (err) {
      console.warn('[cache] failed to parse tRPC response for cache headers:', err)
    }
  }
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', (c, next) => {
  validateEnv(c.env)
  return next()
})

app.use('*', cors({ origin: (origin, c) => resolveCorsOrigin(origin, c.env.WEB_ORIGIN) }))

app.use('/trpc/edition.today', trpcCacheMiddleware(secondsUntilNextEdition))
app.use('/trpc/edition.list', trpcCacheMiddleware(secondsUntilNextEdition))
app.use(
  '/trpc/edition.byDate',
  trpcCacheMiddleware(() => IMMUTABLE_TTL),
)
app.use(
  '/trpc/story.byId',
  trpcCacheMiddleware(() => IMMUTABLE_TTL),
)

app.use('/trpc/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const { success } = await c.env.RATE_LIMITER.limit({ key: ip })
  if (!success) {
    console.warn(`[rate-limit] blocked ${ip} on ${c.req.path}`)
    return c.json(
      { error: { message: 'Too many requests', data: { code: 'TOO_MANY_REQUESTS' } } },
      429,
    )
  }
  return next()
})

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: ({ req }, c) => createContext(req, c.env, c.executionCtx),
  }),
)

type FeedStory = Story & { builtAt: Date }

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildAtomFeed(
  stories: FeedStory[],
  title: string,
  selfUrl: string,
  appUrl: string,
): string {
  const updated = stories[0]?.builtAt.toISOString() ?? new Date().toISOString()

  const entries = stories
    .map((s) => {
      const pubDate = s.builtAt.toISOString()
      const content = escapeXml(s.summary ?? s.description ?? '')
      const storyTitle = escapeXml(s.title)
      const storyUrl = `${appUrl}/story/${s.id}`
      return `  <entry>
    <id>${storyUrl}</id>
    <title>${storyTitle}</title>
    <link href="${storyUrl}" />
    <published>${pubDate}</published>
    <updated>${pubDate}</updated>
    <category term="${s.category}" />
    <content type="text">${content}</content>
  </entry>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${selfUrl}</id>
  <title>${title}</title>
  <subtitle>Daily news digest curated by AI</subtitle>
  <link href="${selfUrl}" rel="self" type="application/atom+xml" />
  <link href="${appUrl}" rel="alternate" type="text/html" />
  <updated>${new Date(updated).toISOString()}</updated>
  <author><name>Tidel</name></author>
${entries}
</feed>`
}

function buildRssFeed(
  stories: FeedStory[],
  title: string,
  selfUrl: string,
  appUrl: string,
): string {
  const lastBuildDate = stories[0]?.builtAt.toUTCString() ?? new Date().toUTCString()

  const items = stories
    .map((s) => {
      const pubDate = s.builtAt.toUTCString()
      const description = escapeXml(s.summary ?? s.description ?? '')
      const storyTitle = escapeXml(s.title)
      const storyUrl = `${appUrl}/story/${s.id}`
      return `    <item>
      <title>${storyTitle}</title>
      <link>${storyUrl}</link>
      <guid isPermaLink="true">${storyUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${s.category}</category>
      <description>${description}</description>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${appUrl}</link>
    <description>Daily news digest curated by AI</description>
    <language>en-gb</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${selfUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`
}

async function fetchFeedData(
  db: ReturnType<typeof createDb>,
  slotParam: string | undefined,
  date: string,
): Promise<{ stories: FeedStory[]; title: string } | null> {
  if (slotParam === 'morning' || slotParam === 'afternoon') {
    let edition = await db.query.editions.findFirst({
      where: and(eq(schema.editions.date, date), eq(schema.editions.slot, slotParam)),
    })
    if (!edition && slotParam === 'morning') {
      edition = await db.query.editions.findFirst({
        where: eq(schema.editions.slot, 'morning'),
        orderBy: desc(schema.editions.date),
      })
    }
    if (!edition) {
      return null
    }
    const rows = await db
      .select()
      .from(schema.stories)
      .where(
        and(
          eq(schema.stories.editionDate, edition.date),
          eq(schema.stories.editionSlot, edition.slot),
        ),
      )
      .orderBy(schema.stories.position)
    const slotLabel = slotParam === 'afternoon' ? 'Afternoon' : 'Morning'
    const stories: FeedStory[] = rows.map(mapStoryRow).map((s) => ({
      ...s,
      builtAt: edition.builtAt,
    }))
    return { stories, title: `Tidel — ${slotLabel} Edition` }
  }

  let morningEdition = await db.query.editions.findFirst({
    where: and(eq(schema.editions.date, date), eq(schema.editions.slot, 'morning')),
  })
  if (!morningEdition) {
    morningEdition = await db.query.editions.findFirst({
      where: eq(schema.editions.slot, 'morning'),
      orderBy: desc(schema.editions.date),
    })
  }
  if (!morningEdition) {
    return null
  }

  const afternoonEdition = await db.query.editions.findFirst({
    where: and(
      eq(schema.editions.date, morningEdition.date),
      eq(schema.editions.slot, 'afternoon'),
    ),
  })

  const fetchRows = async (ed: typeof morningEdition) =>
    db
      .select()
      .from(schema.stories)
      .where(and(eq(schema.stories.editionDate, ed.date), eq(schema.stories.editionSlot, ed.slot)))
      .orderBy(schema.stories.position)

  const [morningRows, afternoonRows] = await Promise.all([
    fetchRows(morningEdition),
    afternoonEdition ? fetchRows(afternoonEdition) : Promise.resolve([]),
  ])
  const morning: FeedStory[] = morningRows.map(mapStoryRow).map((s) => ({
    ...s,
    builtAt: morningEdition.builtAt,
  }))
  const afternoon: FeedStory[] = afternoonEdition
    ? afternoonRows.map(mapStoryRow).map((s) => ({ ...s, builtAt: afternoonEdition.builtAt }))
    : []
  return { stories: [...morning, ...afternoon], title: 'Tidel' }
}

async function handleFeedRequest(
  c: Context<{ Bindings: Env }>,
  format: 'atom' | 'rss',
): Promise<Response> {
  const slotParam = c.req.query('slot')
  const db = createDb(c.env.DATABASE_URL)
  const appUrl = parseWebOrigins(c.env.WEB_ORIGIN)[0] ?? ''
  const data = await fetchFeedData(db, slotParam, todayUTC())
  if (!data) {
    return c.text('No edition available', 404)
  }
  const filename = `${format}.xml`
  const selfUrl =
    slotParam === 'morning' || slotParam === 'afternoon'
      ? `${appUrl}/${filename}?slot=${slotParam}`
      : `${appUrl}/${filename}`
  const xml =
    format === 'atom'
      ? buildAtomFeed(data.stories, data.title, selfUrl, appUrl)
      : buildRssFeed(data.stories, data.title, selfUrl, appUrl)
  const contentType =
    format === 'atom' ? 'application/atom+xml; charset=utf-8' : 'application/rss+xml; charset=utf-8'
  return c.text(xml, 200, {
    'Content-Type': contentType,
    'Cache-Control': `public, s-maxage=${secondsUntilNextEdition()}, stale-while-revalidate=86400`,
  })
}

app.get('/atom.xml', (c) => handleFeedRequest(c, 'atom'))
app.get('/rss.xml', (c) => handleFeedRequest(c, 'rss'))

async function handleCron(event: ScheduledEvent, env: Env): Promise<void> {
  const slot = event.cron === '0 15 * * *' ? 'afternoon' : 'morning'
  if (event.cron !== '0 6 * * *' && event.cron !== '0 15 * * *') {
    console.warn(`[cron] unrecognised cron expression: "${event.cron}"`)
    return
  }
  console.log(`[cron] ${slot} build triggered`)
  try {
    await buildEdition(env, slot)
    console.log(`[cron] ${slot} build finished`)
  } catch (err) {
    console.error(`[cron] ${slot} build failed:`, err)
    throw err
  }
}

export default {
  fetch: app.fetch,
  scheduled: handleCron,
}

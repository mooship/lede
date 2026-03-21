import { trpcServer } from '@hono/trpc-server'
import type { Story } from '@tidel/api'
import { createDb, schema } from '@tidel/db'
import { and, desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createContext } from './context.js'
import { resolveCorsOrigin } from './cors.js'
import type { Env } from './env.js'
import { validateEnv } from './env.js'
import { buildEdition, todayUTC } from './pipeline.js'
import { appRouter } from './router.js'

const app = new Hono<{ Bindings: Env }>()

app.use('*', (c, next) => {
  validateEnv(c.env)
  return next()
})

app.use('*', cors({ origin: (origin, c) => resolveCorsOrigin(origin, c.env.WEB_ORIGIN) }))

app.use('/trpc/edition.today', async (c, next) => {
  await next()
  try {
    const body = await c.res.clone().text()
    const parsed = JSON.parse(body)
    const data = Array.isArray(parsed) ? parsed[0]?.result?.data : parsed?.result?.data
    if (data !== null && data !== undefined) {
      c.res.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=86400, max-age=3600',
      )
    }
  } catch {}
})

app.use('/trpc/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown'
  const { success } = await c.env.RATE_LIMITER.limit({ key: ip })
  if (!success) {
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

function buildAtomFeed(stories: Story[], slot: string, appUrl: string): string {
  const updated = stories[0]?.pubDate ?? new Date().toISOString()
  const slotLabel = slot === 'afternoon' ? 'Afternoon' : 'Morning'
  const feedUrl = `${appUrl}/feed.xml${slot === 'afternoon' ? '?slot=afternoon' : ''}`

  const entries = stories
    .map((s) => {
      const pubDate = s.pubDate ? new Date(s.pubDate).toISOString() : new Date().toISOString()
      const summary = (s.description ?? s.summary)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      const title = s.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const storyUrl = `${appUrl}/story/${s.id}`
      return `  <entry>
    <id>${storyUrl}</id>
    <title>${title}</title>
    <link href="${storyUrl}" />
    <published>${pubDate}</published>
    <updated>${pubDate}</updated>
    <category term="${s.category}" />
    <summary>${summary}</summary>
  </entry>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${feedUrl}</id>
  <title>Tidel — ${slotLabel} Edition</title>
  <subtitle>Daily news digest curated by AI</subtitle>
  <link href="${feedUrl}" rel="self" type="application/atom+xml" />
  <link href="${appUrl}" rel="alternate" type="text/html" />
  <updated>${new Date(updated).toISOString()}</updated>
  <author><name>Tidel</name></author>
${entries}
</feed>`
}

app.get('/feed.xml', async (c) => {
  const slot = c.req.query('slot') === 'afternoon' ? 'afternoon' : 'morning'
  const db = createDb(c.env.DATABASE_URL)
  const date = todayUTC()

  let edition = await db.query.editions.findFirst({
    where: and(eq(schema.editions.date, date), eq(schema.editions.slot, slot)),
  })
  if (!edition && slot === 'morning') {
    edition = await db.query.editions.findFirst({
      where: eq(schema.editions.slot, 'morning'),
      orderBy: desc(schema.editions.date),
    })
  }
  if (!edition) {
    return c.text('No edition available', 404)
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

  const stories: Story[] = rows.map((r) => ({
    id: r.id,
    editionDate: r.editionDate,
    editionSlot: r.editionSlot,
    title: r.title,
    description: r.description ?? null,
    summary: r.summary,
    category: r.category as Story['category'],
    link: r.link,
    pubDate: r.pubDate ?? null,
    source: r.source,
    position: r.position,
    sourceCount: r.sourceCount,
  }))

  const appUrl = c.env.WEB_ORIGIN.split(',')[0]?.trim() ?? ''
  const xml = buildAtomFeed(stories, slot, appUrl)
  return c.text(xml, 200, {
    'Content-Type': 'application/atom+xml; charset=utf-8',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  })
})

async function handleCron(event: ScheduledEvent, env: Env): Promise<void> {
  if (event.cron === '0 6 * * *') {
    await buildEdition(env, 'morning')
  }
  if (event.cron === '0 15 * * *') {
    await buildEdition(env, 'afternoon')
  }
}

export default {
  fetch: app.fetch,
  scheduled: handleCron,
}

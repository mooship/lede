import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createContext } from './context.js'
import { resolveCorsOrigin } from './cors.js'
import type { Env } from './env.js'
import { validateEnv } from './env.js'
import { buildEdition } from './pipeline.js'
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
    createContext: ({ req }, c) => createContext(req, c.env),
  }),
)

async function handleCron(_event: ScheduledEvent, env: Env): Promise<void> {
  await buildEdition(env)
}

export default {
  fetch: app.fetch,
  scheduled: handleCron,
}

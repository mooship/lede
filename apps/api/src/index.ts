import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createContext } from './context.js'
import { resolveCorsOrigin } from './cors.js'
import type { Env } from './env.js'
import { buildEdition } from './pipeline.js'
import { appRouter } from './router.js'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: (origin, c) => resolveCorsOrigin(origin, c.env.WEB_ORIGIN) }))

app.use('/trpc/edition.today', async (c, next) => {
  await next()
  const body = await c.res.clone().text()
  const isNull = body.includes('"data":null')
  if (!isNull) {
    c.res.headers.set('Cache-Control', 'public, s-maxage=3600, max-age=3600')
  }
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

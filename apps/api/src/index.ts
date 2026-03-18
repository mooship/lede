import { trpcServer } from '@hono/trpc-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createContext } from './context.js'
import type { Env } from './env.js'
import { buildEdition } from './pipeline.js'
import { appRouter } from './router.js'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: (_origin, c) => c.env.WEB_ORIGIN }))

app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: ({ req }, c) => createContext(req, c.env),
  }),
)

async function handleCron(_event: ScheduledEvent, env: Env): Promise<void> {
  if (env.BUILD_CRON_ENABLED !== 'true') {
    return
  }
  await buildEdition(env)
}

export default {
  fetch: app.fetch,
  scheduled: handleCron,
}

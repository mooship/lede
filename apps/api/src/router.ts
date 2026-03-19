import type { Story } from '@tidel/api'
import { createDb, schema } from '@tidel/db'
import { initTRPC, TRPCError } from '@trpc/server'
import { desc, eq } from 'drizzle-orm'
import type { Context } from './context.js'
import { buildEdition, todaySAST } from './pipeline.js'

const t = initTRPC.context<Context>().create()

const router = t.router
const publicProcedure = t.procedure
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx })
})

const editionRouter = router({
  today: publicProcedure.query(async ({ ctx }): Promise<Story[] | null> => {
    const db = createDb(ctx.env.DATABASE_URL)
    const date = todaySAST()

    const queryFn = async (): Promise<Story[] | null> => {
      let edition = await db.query.editions.findFirst({
        where: eq(schema.editions.date, date),
      })
      if (!edition) {
        edition = await db.query.editions.findFirst({
          orderBy: desc(schema.editions.date),
        })
      }
      if (!edition) {
        return null
      }

      const rows = await db
        .select()
        .from(schema.stories)
        .where(eq(schema.stories.editionDate, edition.date))
        .orderBy(schema.stories.position)

      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? null,
        summary: r.summary,
        category: r.category as Story['category'],
        link: r.link,
        pubDate: r.pubDate ?? null,
        source: r.source,
        position: r.position,
      }))
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new TRPCError({ code: 'TIMEOUT', message: 'Database query timed out' })),
        5000,
      ),
    )

    return Promise.race([queryFn(), timeout])
  }),

  build: protectedProcedure.mutation(async ({ ctx }): Promise<{ ok: true }> => {
    await buildEdition(ctx.env)
    return { ok: true }
  }),
})

export const appRouter = router({ edition: editionRouter })
export type AppRouter = typeof appRouter
export const createCallerFactory = t.createCallerFactory

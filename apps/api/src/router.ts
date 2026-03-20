import type { Story } from '@tidel/api'
import { createDb, schema } from '@tidel/db'
import { initTRPC, TRPCError } from '@trpc/server'
import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
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
        editionDate: r.editionDate,
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

  list: publicProcedure.query(
    async ({ ctx }): Promise<Array<{ date: string; storyCount: number }>> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const rows = await db
        .select({ date: schema.editions.date, storyCount: count(schema.stories.id) })
        .from(schema.editions)
        .leftJoin(schema.stories, eq(schema.stories.editionDate, schema.editions.date))
        .groupBy(schema.editions.date)
        .orderBy(desc(schema.editions.date))
      return rows.map((r) => ({ date: r.date, storyCount: r.storyCount }))
    },
  ),

  byDate: publicProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ ctx, input }): Promise<Story[] | null> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const edition = await db.query.editions.findFirst({
        where: eq(schema.editions.date, input.date),
      })
      if (!edition) return null
      const rows = await db
        .select()
        .from(schema.stories)
        .where(eq(schema.stories.editionDate, input.date))
        .orderBy(schema.stories.position)
      return rows.map((r) => ({
        id: r.id,
        editionDate: r.editionDate,
        title: r.title,
        description: r.description ?? null,
        summary: r.summary,
        category: r.category as Story['category'],
        link: r.link,
        pubDate: r.pubDate ?? null,
        source: r.source,
        position: r.position,
      }))
    }),

  adminStatus: protectedProcedure.query(
    async ({
      ctx,
    }): Promise<{
      date: string
      builtAt: string
      storyCount: number
      feedStats: Record<string, 'ok' | 'timeout' | 'error'> | null
      categoryBreakdown: Record<string, number>
    } | null> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const edition = await db.query.editions.findFirst({
        orderBy: desc(schema.editions.date),
      })
      if (!edition) return null
      const [countRow] = await db
        .select({ storyCount: count(schema.stories.id) })
        .from(schema.stories)
        .where(eq(schema.stories.editionDate, edition.date))
      const categoryRows = await db
        .select({ category: schema.stories.category, storyCount: count(schema.stories.id) })
        .from(schema.stories)
        .where(eq(schema.stories.editionDate, edition.date))
        .groupBy(schema.stories.category)
      const feedStats = edition.feedStats
        ? (JSON.parse(edition.feedStats) as Record<string, 'ok' | 'timeout' | 'error'>)
        : null
      return {
        date: edition.date,
        builtAt: edition.builtAt.toISOString(),
        storyCount: countRow?.storyCount ?? 0,
        feedStats,
        categoryBreakdown: Object.fromEntries(categoryRows.map((r) => [r.category, r.storyCount])),
      }
    },
  ),

  build: protectedProcedure
    .input(z.object({ force: z.boolean().optional() }))
    .mutation(async ({ ctx, input }): Promise<{ ok: true }> => {
      await buildEdition(ctx.env, input.force ?? false)
      return { ok: true }
    }),
})

export const appRouter = router({ edition: editionRouter })
export type AppRouter = typeof appRouter
export const createCallerFactory = t.createCallerFactory

import type { Story } from '@tidel/api'
import { createDb, schema } from '@tidel/db'
import { initTRPC, TRPCError } from '@trpc/server'
import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'
import type { Context } from './context.js'
import { buildEdition, currentSlot, todayUTC } from './pipeline.js'

const t = initTRPC.context<Context>().create()

const router = t.router
const publicProcedure = t.procedure
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx })
})

const slotSchema = z.enum(['morning', 'afternoon'])

function mapStoryRow(r: {
  id: string
  editionDate: string
  editionSlot: string
  title: string
  description: string | null
  summary: string
  category: string
  link: string
  pubDate: string | null
  source: string
  position: number
}): Story {
  return {
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
  }
}

const editionRouter = router({
  today: publicProcedure
    .input(z.object({ slot: slotSchema.optional().default('morning') }))
    .query(async ({ ctx, input }): Promise<Story[] | null> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const date = todayUTC()
      const { slot } = input

      const queryFn = async (): Promise<Story[] | null> => {
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

        return rows.map(mapStoryRow)
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
    async ({ ctx }): Promise<Array<{ date: string; slot: string; storyCount: number }>> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const rows = await db
        .select({
          date: schema.editions.date,
          slot: schema.editions.slot,
          storyCount: count(schema.stories.id),
        })
        .from(schema.editions)
        .leftJoin(
          schema.stories,
          and(
            eq(schema.stories.editionDate, schema.editions.date),
            eq(schema.stories.editionSlot, schema.editions.slot),
          ),
        )
        .groupBy(schema.editions.date, schema.editions.slot)
        .orderBy(desc(schema.editions.date), desc(schema.editions.slot))
      return rows.map((r) => ({ date: r.date, slot: r.slot, storyCount: r.storyCount }))
    },
  ),

  byDate: publicProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        slot: slotSchema.optional().default('morning'),
      }),
    )
    .query(async ({ ctx, input }): Promise<Story[] | null> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const edition = await db.query.editions.findFirst({
        where: and(eq(schema.editions.date, input.date), eq(schema.editions.slot, input.slot)),
      })
      if (!edition) {
        return null
      }
      const rows = await db
        .select()
        .from(schema.stories)
        .where(
          and(
            eq(schema.stories.editionDate, input.date),
            eq(schema.stories.editionSlot, input.slot),
          ),
        )
        .orderBy(schema.stories.position)
      return rows.map(mapStoryRow)
    }),

  adminStatus: protectedProcedure.query(
    async ({
      ctx,
    }): Promise<Array<{
      date: string
      slot: string
      builtAt: string
      storyCount: number
      feedStats: Record<string, 'ok' | 'timeout' | 'error'> | null
      categoryBreakdown: Record<string, number>
    }> | null> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const latest = await db.query.editions.findFirst({
        orderBy: desc(schema.editions.date),
      })
      if (!latest) {
        return null
      }

      const editionRows = await db
        .select()
        .from(schema.editions)
        .where(eq(schema.editions.date, latest.date))
        .orderBy(desc(schema.editions.slot))

      const results = await Promise.all(
        editionRows.map(async (edition) => {
          const [countRow] = await db
            .select({ storyCount: count(schema.stories.id) })
            .from(schema.stories)
            .where(
              and(
                eq(schema.stories.editionDate, edition.date),
                eq(schema.stories.editionSlot, edition.slot),
              ),
            )
          const categoryRows = await db
            .select({ category: schema.stories.category, storyCount: count(schema.stories.id) })
            .from(schema.stories)
            .where(
              and(
                eq(schema.stories.editionDate, edition.date),
                eq(schema.stories.editionSlot, edition.slot),
              ),
            )
            .groupBy(schema.stories.category)
          const feedStats = edition.feedStats
            ? (JSON.parse(edition.feedStats) as Record<string, 'ok' | 'timeout' | 'error'>)
            : null
          return {
            date: edition.date,
            slot: edition.slot,
            builtAt: edition.builtAt.toISOString(),
            storyCount: countRow?.storyCount ?? 0,
            feedStats,
            categoryBreakdown: Object.fromEntries(
              categoryRows.map((r) => [r.category, r.storyCount]),
            ),
          }
        }),
      )

      return results
    },
  ),

  build: protectedProcedure
    .input(
      z.object({
        slot: slotSchema.optional().default(() => currentSlot()),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<{ ok: true; message: string }> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const date = todayUTC()
      const { slot } = input

      const existing = await db.query.editions.findFirst({
        where: and(eq(schema.editions.date, date), eq(schema.editions.slot, slot)),
      })

      if (existing) {
        return {
          ok: true,
          message: `${slot} edition for ${date} already exists — skipping`,
        }
      }

      ctx.executionCtx.waitUntil(buildEdition(ctx.env, slot))
      return {
        ok: true,
        message: `Building ${slot} edition for ${date}`,
      }
    }),
})

const storyRouter = router({
  byId: publicProcedure
    .input(z.string().uuid())
    .query(async ({ ctx, input }): Promise<Story | null> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const rows = await db
        .select()
        .from(schema.stories)
        .where(eq(schema.stories.id, input))
        .limit(1)
      if (!rows[0]) {
        return null
      }
      return mapStoryRow(rows[0])
    }),

  search: publicProcedure
    .input(z.object({ query: z.string().min(2).max(100) }))
    .query(async ({ ctx, input }): Promise<Story[]> => {
      const db = createDb(ctx.env.DATABASE_URL)
      const escaped = input.query.replace(/[%_\\]/g, '\\$&')
      const like = `%${escaped}%`
      const rows = await db
        .select()
        .from(schema.stories)
        .where(or(ilike(schema.stories.title, like), ilike(schema.stories.summary, like)))
        .orderBy(desc(schema.stories.editionDate), schema.stories.position)
        .limit(50)
      return rows.map(mapStoryRow)
    }),
})

export const appRouter = router({ edition: editionRouter, story: storyRouter })
export type AppRouter = typeof appRouter
export const createCallerFactory = t.createCallerFactory

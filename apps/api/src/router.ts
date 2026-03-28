import type { Category, Slot, Story } from '@tidel/api'
import { schema } from '@tidel/db'
import { initTRPC, TRPCError } from '@trpc/server'
import { and, count, desc, eq, or, sql } from 'drizzle-orm'
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

const categorySchema = z.enum([
  'World',
  'Technology',
  'Science',
  'Business / Economy',
  'Sport',
  'Culture',
])

export function mapStoryRow(r: {
  id: string
  editionDate: string
  editionSlot: Slot
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
    description: r.description,
    summary: r.summary,
    category: categorySchema.parse(r.category) as Category,
    link: r.link,
    pubDate: r.pubDate,
    source: r.source,
    position: r.position,
  }
}

function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new TRPCError({ code: 'TIMEOUT', message: 'Database query timed out' })),
      ms,
    )
  })
  return Promise.race([fn(), timeout]).finally(() => clearTimeout(timeoutId))
}

const editionRouter = router({
  today: publicProcedure
    .input(z.object({ slot: slotSchema.optional().default('morning') }))
    .query(async ({ ctx, input }): Promise<Story[] | null> => {
      const { db } = ctx
      const date = todayUTC()
      const { slot } = input

      return withTimeout(async () => {
        let edition = await db.query.editions.findFirst({
          where: and(eq(schema.editions.date, date), eq(schema.editions.slot, slot)),
          with: { stories: { orderBy: schema.stories.position } },
        })
        if (!edition) {
          edition = await db.query.editions.findFirst({
            where: eq(schema.editions.slot, slot),
            orderBy: desc(schema.editions.date),
            with: { stories: { orderBy: schema.stories.position } },
          })
        }
        if (!edition) {
          return null
        }
        return edition.stories.map(mapStoryRow)
      }, 5000)
    }),

  list: publicProcedure.query(
    async ({ ctx }): Promise<Array<{ date: string; slot: string; storyCount: number }>> => {
      const { db } = ctx
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
        .limit(200)
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
      const { db } = ctx
      const edition = await db.query.editions.findFirst({
        where: and(eq(schema.editions.date, input.date), eq(schema.editions.slot, input.slot)),
        with: { stories: { orderBy: schema.stories.position } },
      })
      if (!edition) {
        return null
      }
      return edition.stories.map(mapStoryRow)
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
      const { db } = ctx
      const rows = await db
        .select({
          date: schema.editions.date,
          slot: schema.editions.slot,
          builtAt: schema.editions.builtAt,
          feedStats: schema.editions.feedStats,
          category: schema.stories.category,
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
        .where(eq(schema.editions.date, sql<string>`(SELECT MAX(date) FROM editions)`))
        .groupBy(
          schema.editions.date,
          schema.editions.slot,
          schema.editions.builtAt,
          schema.editions.feedStats,
          schema.stories.category,
        )
        .orderBy(desc(schema.editions.slot))

      if (rows.length === 0) {
        return null
      }

      type EditionEntry = {
        date: string
        slot: string
        builtAt: string
        storyCount: number
        feedStats: Record<string, 'ok' | 'timeout' | 'error'> | null
        categoryBreakdown: Record<string, number>
      }
      const editionMap = new Map<string, EditionEntry>()
      for (const row of rows) {
        const key = `${row.date}|${row.slot}`
        if (!editionMap.has(key)) {
          editionMap.set(key, {
            date: row.date,
            slot: row.slot,
            builtAt: row.builtAt.toISOString(),
            storyCount: 0,
            feedStats: row.feedStats
              ? (JSON.parse(row.feedStats) as Record<string, 'ok' | 'timeout' | 'error'>)
              : null,
            categoryBreakdown: {},
          })
        }
        const entry = editionMap.get(key)
        if (row.category && entry) {
          entry.storyCount += row.storyCount
          entry.categoryBreakdown[row.category] = row.storyCount
        }
      }
      return Array.from(editionMap.values())
    },
  ),

  build: protectedProcedure
    .input(
      z.object({
        slot: slotSchema.optional().default(() => currentSlot()),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<{ ok: true; message: string }> => {
      const { db } = ctx
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

      ctx.executionCtx.waitUntil(
        buildEdition(ctx.env, slot).catch((err) => {
          console.error('[edition.build] background buildEdition failed:', err)
        }),
      )
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
      const { db } = ctx
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
      const { db } = ctx
      const escaped = input.query.replace(/[%_\\]/g, '\\$&')
      const like = `%${escaped}%`
      return withTimeout(
        () =>
          db
            .select()
            .from(schema.stories)
            .where(
              or(
                sql`${schema.stories.title} ILIKE ${like} ESCAPE '\\'`,
                sql`${schema.stories.summary} ILIKE ${like} ESCAPE '\\'`,
              ),
            )
            .orderBy(desc(schema.stories.editionDate), schema.stories.position)
            .limit(50)
            .then((rows) => rows.map(mapStoryRow)),
        5000,
      )
    }),
})

export const appRouter = router({ edition: editionRouter, story: storyRouter })
export type AppRouter = typeof appRouter
export const createCallerFactory = t.createCallerFactory

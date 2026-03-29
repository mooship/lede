import { relations, sql } from 'drizzle-orm'
import {
  date,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

export const categoryEnum = pgEnum('story_category', [
  'World',
  'Technology',
  'Science',
  'Business / Economy',
  'Sport',
  'Culture',
])

export const slotEnum = pgEnum('edition_slot', ['morning', 'afternoon'])

export const editions = pgTable(
  'editions',
  {
    date: date('date').notNull(),
    slot: slotEnum('slot').notNull().default('morning'),
    builtAt: timestamp('built_at', { withTimezone: true }).notNull(),
    feedStats: text('feed_stats'),
  },
  (t) => [primaryKey({ columns: [t.date, t.slot] })],
)

export const stories = pgTable(
  'stories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    editionDate: date('edition_date').notNull(),
    editionSlot: slotEnum('edition_slot').notNull().default('morning'),
    title: text('title').notNull(),
    description: text('description'),
    summary: text('summary').notNull(),
    category: categoryEnum('category').notNull(),
    link: text('link').notNull(),
    pubDate: text('pub_date'),
    source: text('source').notNull(),
    position: integer('position').notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.editionDate, t.editionSlot],
      foreignColumns: [editions.date, editions.slot],
    }).onDelete('cascade'),
    index('stories_edition_date_slot_idx').on(t.editionDate, t.editionSlot),
    index('stories_category_idx').on(t.category),
    unique('stories_link_edition_slot_unique').on(t.link, t.editionDate, t.editionSlot),
    index('stories_title_trgm_idx').using('gin', sql`${t.title} gin_trgm_ops`),
    index('stories_summary_trgm_idx').using('gin', sql`${t.summary} gin_trgm_ops`),
  ],
)

export const editionsRelations = relations(editions, ({ many }) => ({
  stories: many(stories),
}))

export const storiesRelations = relations(stories, ({ one }) => ({
  edition: one(editions, {
    fields: [stories.editionDate, stories.editionSlot],
    references: [editions.date, editions.slot],
  }),
}))

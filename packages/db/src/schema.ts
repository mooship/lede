import { date, index, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const editions = pgTable('editions', {
  date: date('date').primaryKey(),
  builtAt: timestamp('built_at').notNull(),
  feedStats: text('feed_stats'),
})

export const stories = pgTable(
  'stories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    editionDate: date('edition_date')
      .notNull()
      .references(() => editions.date, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    summary: text('summary').notNull(),
    category: text('category').notNull(),
    link: text('link').notNull(),
    pubDate: text('pub_date'),
    source: text('source').notNull(),
    position: integer('position').notNull(),
  },
  (t) => [
    index('stories_edition_date_idx').on(t.editionDate),
    index('stories_category_idx').on(t.category),
    unique('stories_link_edition_unique').on(t.link, t.editionDate),
  ],
)

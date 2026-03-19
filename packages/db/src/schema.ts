import { date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const editions = pgTable('editions', {
  date: date('date').primaryKey(),
  builtAt: timestamp('built_at').notNull(),
})

export const stories = pgTable('stories', {
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
})

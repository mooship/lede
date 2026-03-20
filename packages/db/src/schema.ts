import {
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

export const editions = pgTable(
  'editions',
  {
    date: date('date').notNull(),
    slot: text('slot').notNull().default('morning'),
    builtAt: timestamp('built_at').notNull(),
    feedStats: text('feed_stats'),
  },
  (t) => [primaryKey({ columns: [t.date, t.slot] })],
)

export const stories = pgTable(
  'stories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    editionDate: date('edition_date').notNull(),
    editionSlot: text('edition_slot').notNull().default('morning'),
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
    foreignKey({
      columns: [t.editionDate, t.editionSlot],
      foreignColumns: [editions.date, editions.slot],
    }).onDelete('cascade'),
    index('stories_edition_date_slot_idx').on(t.editionDate, t.editionSlot),
    index('stories_category_idx').on(t.category),
    unique('stories_link_edition_unique').on(t.link, t.editionDate),
  ],
)

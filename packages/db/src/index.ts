import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema.js'

export { schema }

export function createDb(connectionString: string) {
  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

export type Edition = typeof schema.editions.$inferSelect
export type Story = typeof schema.stories.$inferSelect
export type NewStory = typeof schema.stories.$inferInsert
export type NewEdition = typeof schema.editions.$inferInsert

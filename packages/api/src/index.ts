export type Category =
  | 'World'
  | 'Technology'
  | 'Science'
  | 'Business / Economy'
  | 'Sport'
  | 'Culture'

export type Slot = 'morning' | 'afternoon'

export type Story = {
  id: string
  editionDate: string
  editionSlot: Slot
  title: string
  description: string | null
  summary: string
  category: Category
  link: string
  pubDate: string | null
  source: string
  position: number
}

/** Milliseconds until the next scheduled edition build (06:00 or 15:00 UTC). */
export function msUntilNextEdition(): number {
  const now = new Date()
  const morning = new Date(now)
  morning.setUTCHours(6, 0, 0, 0)
  if (morning > now) {
    return morning.getTime() - now.getTime()
  }
  const afternoon = new Date(now)
  afternoon.setUTCHours(15, 0, 0, 0)
  if (afternoon > now) {
    return afternoon.getTime() - now.getTime()
  }
  morning.setUTCDate(morning.getUTCDate() + 1)
  return morning.getTime() - now.getTime()
}

/** Seconds until the next scheduled edition build (06:00 or 15:00 UTC). */
export function secondsUntilNextEdition(): number {
  return Math.round(msUntilNextEdition() / 1000)
}

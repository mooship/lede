/**
 * Returns the reference date for the current edition.
 * Before 04:00 UTC (the morning build time) the previous day's edition is current.
 */
export function getEditionDate(): Date {
  const now = new Date()
  const ref = new Date(now)
  ref.setUTCHours(4, 0, 0, 0)
  if (ref > now) {
    ref.setUTCDate(ref.getUTCDate() - 1) // before today's build → use yesterday's
  }
  return ref
}

export function msUntilNextEdition(): number {
  const now = new Date()
  const next = new Date()
  next.setUTCHours(4, 0, 0, 0)
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next.getTime() - now.getTime()
}

/**
 * Dynamic stale time for the edition query: 5 minutes when no data has loaded yet
 * (fast retry), otherwise the milliseconds until the next scheduled build.
 */
export const editionStaleTime = (query: { state: { data: unknown } }): number =>
  query.state.data == null ? 5 * 60 * 1000 : msUntilNextEdition()

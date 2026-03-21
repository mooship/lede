export function isAfternoonAvailable(): boolean {
  return new Date().getUTCHours() >= 15
}

export function afternoonLocalTime(): string {
  const d = new Date()
  d.setUTCHours(15, 0, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/**
 * Returns the reference date for the current edition.
 * Before 06:00 UTC (the morning build time) the previous day's edition is current.
 */
export function getEditionDate(): Date {
  const now = new Date()
  const ref = new Date(now)
  ref.setUTCHours(6, 0, 0, 0)
  if (ref > now) {
    ref.setUTCDate(ref.getUTCDate() - 1) // before today's build → use yesterday's
  }
  return ref
}

export function msUntilNextEdition(): number {
  const now = new Date()
  const morning = new Date()
  morning.setUTCHours(6, 0, 0, 0)
  if (morning > now) {
    return morning.getTime() - now.getTime()
  }
  const afternoon = new Date()
  afternoon.setUTCHours(15, 0, 0, 0)
  if (afternoon > now) {
    return afternoon.getTime() - now.getTime()
  }
  morning.setUTCDate(morning.getUTCDate() + 1)
  return morning.getTime() - now.getTime()
}

/**
 * Dynamic stale time for the edition query: 5 minutes when no data has loaded yet
 * (fast retry), otherwise the milliseconds until the next scheduled build.
 */
export const editionStaleTime = (query: { state: { data: unknown } }): number =>
  query.state.data == null ? 5 * 60 * 1000 : msUntilNextEdition()

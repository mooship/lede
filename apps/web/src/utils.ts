import { msUntilNextEdition } from '@tidel/api'

export { msUntilNextEdition }

export function formatEditionDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function isAfternoonAvailable(): boolean {
  const hour = new Date().getUTCHours()
  return hour >= 15 || hour < 6
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
    ref.setUTCDate(ref.getUTCDate() - 1)
  }
  return ref
}

/**
 * Dynamic stale time for the edition query: 5 minutes when no data has loaded yet
 * (fast retry), otherwise the milliseconds until the next scheduled build.
 */
export const editionStaleTime = (query: { state: { data: unknown } }): number =>
  query.state.data == null ? 5 * 60 * 1000 : msUntilNextEdition()

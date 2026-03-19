export function getEditionDate(): Date {
  const now = new Date()
  const ref = new Date(now)
  ref.setUTCHours(4, 0, 0, 0) // 04:00 UTC = 06:00 SAST (edition build time)
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

export const editionStaleTime = (query: { state: { data: unknown } }): number =>
  query.state.data == null ? 5 * 60 * 1000 : msUntilNextEdition()

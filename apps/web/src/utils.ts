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

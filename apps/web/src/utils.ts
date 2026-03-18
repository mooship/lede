export function msUntilNextEdition(): number {
  const now = new Date()
  const next = new Date()
  next.setUTCHours(4, 0, 0, 0)
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next.getTime() - now.getTime()
}

export function msUntilMidnightSAST(): number {
  const now = new Date()
  const midnight = new Date()
  midnight.setUTCHours(22, 0, 0, 0)
  if (midnight <= now) midnight.setUTCDate(midnight.getUTCDate() + 1)
  return midnight.getTime() - now.getTime()
}

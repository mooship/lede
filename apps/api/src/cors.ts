export function parseWebOrigins(rawOrigins: string): string[] {
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

export function resolveCorsOrigin(requestOrigin: string | undefined, rawOrigins: string): string {
  if (!requestOrigin) {
    return ''
  }

  const allowedOrigins = parseWebOrigins(rawOrigins)
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : ''
}

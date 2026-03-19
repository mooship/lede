export function parseWebOrigins(rawOrigins: string): string[] {
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

/**
 * Resolves the CORS origin to echo back to the client.
 * Returns `''` (deny) when the request origin is absent or not in the allowlist.
 * Hono's cors middleware treats an empty string as a denied origin.
 */
export function resolveCorsOrigin(requestOrigin: string | undefined, rawOrigins: string): string {
  if (!requestOrigin) {
    return ''
  }

  const allowedOrigins = parseWebOrigins(rawOrigins)
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : ''
}

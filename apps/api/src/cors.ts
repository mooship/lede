export function parseWebOrigins(rawOrigins: string): string[] {
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
}

/**
 * Resolves the CORS origin to echo back to the client.
 * Returns `null` (deny) when the request origin is absent or not in the allowlist.
 * Returning null causes Hono to omit the Access-Control-Allow-Origin header entirely.
 */
export function resolveCorsOrigin(
  requestOrigin: string | undefined,
  rawOrigins: string,
): string | null {
  if (!requestOrigin) {
    return null
  }

  const allowedOrigins = parseWebOrigins(rawOrigins)
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : null
}

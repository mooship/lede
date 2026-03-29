import type { ExecutionContext } from '@cloudflare/workers-types'
import handler from '@tanstack/react-start/server-entry'
import { msUntilNextEdition } from '@tidel/api'

/** Security headers applied to every response. CSP is omitted until nonce injection is wired up. */
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

declare const __BUILD_ID__: string

const cfCache: Cache | null =
  typeof caches !== 'undefined' ? ((caches as unknown as { default: Cache }).default ?? null) : null

function versionedCacheKey(request: Request): Request {
  const url = new URL(request.url)
  url.searchParams.set('__v', __BUILD_ID__)
  return new Request(url.toString(), { method: request.method })
}

export default {
  async fetch(request: Request, _env: unknown, context: ExecutionContext) {
    const url = new URL(request.url)
    const cacheable = request.method === 'GET' && url.pathname !== '/admin'

    if (cacheable && cfCache) {
      const cached = await cfCache.match(versionedCacheKey(request))
      if (cached) {
        return cached
      }
    }

    const response = await handler.fetch(request)

    if (
      cacheable &&
      cfCache &&
      response.status === 200 &&
      response.headers.get('content-type')?.includes('text/html')
    ) {
      const sMaxAge = Math.max(60, Math.round(msUntilNextEdition() / 1000))
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', `public, s-maxage=${sMaxAge}, stale-while-revalidate=3600`)
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
        headers.set(k, v)
      }
      const withHeaders = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
      context.waitUntil(cfCache.put(versionedCacheKey(request), withHeaders.clone()))
      return withHeaders
    }

    return applySecurityHeaders(response)
  },
}

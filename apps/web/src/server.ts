import type { ExecutionContext } from '@cloudflare/workers-types'
import handler from '@tanstack/react-start/server-entry'
import { msUntilNextEdition } from '@tidel/api'

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
      const withCacheHeaders = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
      context.waitUntil(cfCache.put(versionedCacheKey(request), withCacheHeaders.clone()))
      return withCacheHeaders
    }

    return response
  },
}

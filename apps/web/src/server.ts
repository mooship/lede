import type { ExecutionContext } from '@cloudflare/workers-types'
import handler from '@tanstack/react-start/server-entry'
import { msUntilNextEdition } from './utils.js'

const cfCaches = caches as unknown as { default: Cache }

export default {
  async fetch(request: Request, _env: unknown, context: ExecutionContext) {
    const url = new URL(request.url)
    const cacheable = request.method === 'GET' && url.pathname !== '/admin'

    if (cacheable) {
      const cached = await cfCaches.default.match(request)
      if (cached) {
        return cached
      }
    }

    const response = await handler.fetch(request)

    if (
      cacheable &&
      response.status === 200 &&
      response.headers.get('content-type')?.includes('text/html')
    ) {
      const sMaxAge = Math.max(60, Math.round(msUntilNextEdition() / 1000))
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', `public, s-maxage=${sMaxAge}, stale-while-revalidate=3600`)
      const toCache = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
      context.waitUntil(cfCaches.default.put(request, toCache))
    }

    return response
  },
}

import { describe, expect, it } from 'vitest'
import { FEEDS } from './config.js'
import { fetchFeed } from './rss.js'

const RUN = process.env.FEED_CHECK === '1'

describe.skipIf(!RUN)('RSS feed health', () => {
  for (const [category, urls] of Object.entries(FEEDS)) {
    for (const url of urls) {
      it(`${category}: ${url}`, async () => {
        const items = await fetchFeed(url)
        expect(items.length, `${url} returned no items`).toBeGreaterThan(0)
      }, 15_000)
    }
  }
})

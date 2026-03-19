import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchFeed } from './rss.js'

const mockOfetch = vi.fn()

vi.mock('ofetch', () => ({
  ofetch: (...args: unknown[]) => mockOfetch(...args),
}))

function makeRssXml(
  items: Array<{ title?: string; description?: string; link?: string; pubDate?: string }>,
): string {
  const itemXml = items
    .map(
      (item) => `
    <item>
      <title>${item.title ?? 'Untitled'}</title>
      <description>${item.description ?? ''}</description>
      <link>${item.link ?? 'https://example.com'}</link>
      <pubDate>${item.pubDate ?? 'Mon, 01 Jan 2024 00:00:00 GMT'}</pubDate>
    </item>`,
    )
    .join('')
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Feed</title>${itemXml}</channel></rss>`
}

describe('fetchFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses a basic RSS feed', async () => {
    mockOfetch.mockResolvedValue(makeRssXml([{ title: 'Hello World', link: 'https://bbc.com/1' }]))
    const items = await fetchFeed('https://example.com/rss')
    expect(items).toHaveLength(1)
    expect(items[0]?.title).toBe('Hello World')
    expect(items[0]?.link).toBe('https://bbc.com/1')
  })

  it('strips HTML tags from title and description', async () => {
    mockOfetch.mockResolvedValue(
      makeRssXml([
        {
          title: '&lt;b&gt;Breaking&lt;/b&gt; News',
          description: '&lt;p&gt;Some &lt;em&gt;content&lt;/em&gt; here&lt;/p&gt;',
        },
      ]),
    )
    const items = await fetchFeed('https://example.com/rss')
    expect(items[0]?.title).toBe('Breaking News')
    expect(items[0]?.description).toBe('Some content here')
  })

  it('decodes named HTML entities in title and description', async () => {
    mockOfetch.mockResolvedValue(
      makeRssXml([
        {
          title: 'UK &amp; EU reach agreement',
          description: 'The &ldquo;deal&rdquo; was signed',
        },
      ]),
    )
    const items = await fetchFeed('https://example.com/rss')
    expect(items[0]?.title).toBe('UK & EU reach agreement')
    expect(items[0]?.description).toBe('The \u201cdeal\u201d was signed')
  })

  it('decodes &apos; entity in title', async () => {
    mockOfetch.mockResolvedValue(
      makeRssXml([{ title: "Iran attacks world&apos;s largest gas complex" }]),
    )
    const items = await fetchFeed('https://example.com/rss')
    expect(items[0]?.title).toBe("Iran attacks world's largest gas complex")
  })

  it('decodes numeric decimal HTML entities', async () => {
    mockOfetch.mockResolvedValue(makeRssXml([{ title: '&#65;&#66;&#67;' }]))
    const items = await fetchFeed('https://example.com/rss')
    expect(items[0]?.title).toBe('ABC')
  })

  it('decodes numeric hex HTML entities', async () => {
    mockOfetch.mockResolvedValue(makeRssXml([{ title: '&#x41;&#x42;' }]))
    const items = await fetchFeed('https://example.com/rss')
    expect(items[0]?.title).toBe('AB')
  })

  it('trims "Continue reading" suffix from descriptions', async () => {
    mockOfetch.mockResolvedValue(
      makeRssXml([{ description: 'Story preview text. Continue reading\u2026' }]),
    )
    const items = await fetchFeed('https://example.com/rss')
    expect(items[0]?.description).toBe('Story preview text.')
  })

  it('trims "Continue reading..." (dots) suffix from descriptions', async () => {
    mockOfetch.mockResolvedValue(makeRssXml([{ description: 'Preview. Continue reading...' }]))
    const items = await fetchFeed('https://example.com/rss')
    expect(items[0]?.description).toBe('Preview.')
  })

  it('returns empty array for a feed with no items', async () => {
    mockOfetch.mockResolvedValue(
      `<?xml version="1.0"?><rss version="2.0"><channel><title>Empty</title></channel></rss>`,
    )
    const items = await fetchFeed('https://example.com/rss')
    expect(items).toHaveLength(0)
  })

  it('wraps a single item (non-array) in an array', async () => {
    const singleItemXml = `<?xml version="1.0"?>
      <rss version="2.0"><channel>
        <item>
          <title>Only Story</title>
          <link>https://example.com/only</link>
          <description>Desc</description>
          <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
        </item>
      </channel></rss>`
    mockOfetch.mockResolvedValue(singleItemXml)
    const items = await fetchFeed('https://example.com/rss')
    expect(items).toHaveLength(1)
    expect(items[0]?.title).toBe('Only Story')
  })

  it('parses Atom feed format (feed/entry)', async () => {
    const atomXml = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Atom Feed</title>
        <entry>
          <title>Atom Story</title>
          <summary>Summary text</summary>
          <link href="https://example.com/atom/1"/>
          <updated>2024-01-01T00:00:00Z</updated>
        </entry>
      </feed>`
    mockOfetch.mockResolvedValue(atomXml)
    const items = await fetchFeed('https://example.com/atom')
    expect(items).toHaveLength(1)
    expect(items[0]?.title).toBe('Atom Story')
    expect(items[0]?.link).toBe('https://example.com/atom/1')
  })

  it('passes the correct options to ofetch', async () => {
    mockOfetch.mockResolvedValue(makeRssXml([{ title: 'Test' }]))
    await fetchFeed('https://example.com/rss')
    expect(mockOfetch).toHaveBeenCalledWith('https://example.com/rss', {
      responseType: 'text',
      timeout: 8000,
    })
  })

  it('propagates ofetch errors', async () => {
    mockOfetch.mockRejectedValue(new Error('Network timeout'))
    await expect(fetchFeed('https://example.com/rss')).rejects.toThrow('Network timeout')
  })
})

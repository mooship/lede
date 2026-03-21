import { XMLParser } from 'fast-xml-parser'
import { ofetch } from 'ofetch'

export type RssItem = {
  title: string
  description: string
  link: string
  pubDate: string
}

const parser = new XMLParser({ ignoreAttributes: false, processEntities: false })

const NAMED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
  '&ldquo;': '\u201c',
  '&rdquo;': '\u201d',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
}

function decodeHtmlEntities(text: string): string {
  return text.replace(/&(?:#x[0-9a-fA-F]+|#\d+|[a-z]+);/gi, (match) => {
    if (match.startsWith('&#x')) {
      return String.fromCharCode(Number.parseInt(match.slice(3, -1), 16))
    }
    if (match.startsWith('&#')) {
      return String.fromCharCode(Number(match.slice(2, -1)))
    }
    return NAMED_ENTITIES[match] ?? match
  })
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s*Continue reading[….]*$/i, '')
    .trimEnd()
}

function resolveText(value: unknown): string {
  if (typeof value === 'string') {
    return stripHtml(value)
  }
  if (typeof value === 'object' && value !== null) {
    const text = (value as Record<string, unknown>)['#text']
    return typeof text === 'string' ? stripHtml(text) : ''
  }
  return ''
}

function resolveLink(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    const href = obj['@_href']
    if (typeof href === 'string') {
      return href.trim()
    }
    const text = obj['#text']
    return typeof text === 'string' ? text.trim() : ''
  }
  return ''
}

/**
 * Fetches and parses an RSS, Atom, or RDF feed. Supports HTML entity decoding
 * and tag stripping in text fields. Times out after 8 seconds.
 */
export async function fetchFeed(url: string): Promise<RssItem[]> {
  const text = await ofetch<string, 'text'>(url, { responseType: 'text', timeout: 8000 })
  const feed = parser.parse(text)
  const items: unknown[] =
    feed?.rss?.channel?.item ?? feed?.feed?.entry ?? feed?.['rdf:RDF']?.item ?? []
  return (Array.isArray(items) ? items : [items]).map((item: unknown) => {
    const i = item as Record<string, unknown>
    return {
      title: resolveText(i.title),
      description: resolveText(i['content:encoded'] ?? i.description ?? i.summary ?? i.content),
      link: resolveLink(i.link),
      pubDate: resolveText(i.pubDate ?? i.updated ?? ''),
    }
  })
}

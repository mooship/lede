import { XMLParser } from 'fast-xml-parser'
import { ofetch } from 'ofetch'

export type RssItem = {
  title: string
  description: string
  link: string
  pubDate: string
}

const parser = new XMLParser({ ignoreAttributes: false })

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
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

export async function fetchFeed(url: string): Promise<RssItem[]> {
  const text = await ofetch<string>(url, { responseType: 'text' as const })
  const feed = parser.parse(text)
  const items: unknown[] = feed?.rss?.channel?.item ?? feed?.feed?.entry ?? []
  return (Array.isArray(items) ? items : [items]).map((item: unknown) => {
    const i = item as Record<string, unknown>
    return {
      title:       resolveText(i['title']),
      description: resolveText(i['content:encoded'] ?? i['description'] ?? i['summary'] ?? i['content']),
      link:        resolveLink(i['link']),
      pubDate:     resolveText(i['pubDate'] ?? i['updated'] ?? ''),
    }
  })
}

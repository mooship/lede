import { XMLParser } from 'fast-xml-parser'
import { ofetch } from 'ofetch'

export type RssItem = {
  title: string
  description: string
  link: string
  pubDate: string
}

const parser = new XMLParser({ ignoreAttributes: false })

export async function fetchFeed(url: string): Promise<RssItem[]> {
  const text = await ofetch<string>(url, { responseType: 'text' })
  const feed = parser.parse(text)
  const items: unknown[] = feed?.rss?.channel?.item ?? feed?.feed?.entry ?? []
  return (Array.isArray(items) ? items : [items]).map((item: unknown) => {
    const i = item as Record<string, unknown>
    return {
      title:       String(i['title'] ?? '').trim(),
      description: String(i['description'] ?? i['summary'] ?? i['content'] ?? '').trim(),
      link:        String(i['link'] ?? '').trim(),
      pubDate:     String(i['pubDate'] ?? i['updated'] ?? '').trim(),
    }
  })
}

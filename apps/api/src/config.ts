import type { Category } from '@tidel/api'

export const FEEDS: Record<Category, string[]> = {
  World: [
    'https://www.theguardian.com/world/rss',
    'https://www.cgtn.com/subscribe/rss/section/world.xml',
  ],
  Technology: [
    'https://www.theguardian.com/technology/rss',
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.404media.co/feed/',
    'https://www.techdirt.com/feed/',
  ],
  Science: [
    'https://www.theguardian.com/science/rss',
    'https://feeds.arstechnica.com/arstechnica/science',
  ],
  'Business / Economy': [
    'https://www.theguardian.com/business/rss',
  ],
  Sport: [
    'https://www.theguardian.com/sport/rss',
  ],
  Culture: [
    'https://www.theguardian.com/culture/rss',
    'https://hyperallergic.com/feed/',
    'https://consequenceofsound.net/feed/',
    'https://www.stereogum.com/feed/',
  ],
}

export const SLOT_CONFIG = {
  morning: { max: 12, maxPerCat: 5 },
  afternoon: { max: 12, maxPerCat: 3 },
} as const

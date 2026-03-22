import type { Category } from '@tidel/api'

export const FEEDS: Record<Category, string[]> = {
  World: [
    'https://www.theguardian.com/world/rss',
    'https://www.abc.net.au/news/feed/51120/rss.xml',
    'https://www.lemonde.fr/en/international/rss_full.xml',
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
    'https://www.lemonde.fr/en/science/rss_full.xml',
  ],
  'Business / Economy': [
    'https://www.theguardian.com/business/rss',
    'https://www.lemonde.fr/en/economy/rss_full.xml',
  ],
  Sport: [
    'https://www.theguardian.com/sport/rss',
    'https://www.lemonde.fr/en/sports/rss_full.xml',
  ],
  Culture: [
    'https://www.theguardian.com/culture/rss',
    'https://hyperallergic.com/feed/',
    'https://consequenceofsound.net/feed/',
    'https://www.stereogum.com/feed/',
    'https://www.lemonde.fr/en/culture/rss_full.xml',
  ],
}

export const SLOT_CONFIG = {
  morning: { max: 15, maxPerCat: 5 },
  afternoon: { max: 12, maxPerCat: 3 },
} as const

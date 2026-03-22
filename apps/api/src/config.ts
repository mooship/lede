import type { Category } from '@tidel/api'

export const FEEDS: Record<Category, string[]> = {
  World: [
    'https://www.theguardian.com/world/rss',
    'https://rss.dw.com/rdf/rss-en-world',
    'https://feeds.npr.org/1004/rss.xml',
    'https://www.lemonde.fr/en/international/rss_full.xml',
  ],
  Technology: [
    'https://www.theguardian.com/technology/rss',
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.404media.co/feed/',
  ],
  Science: [
    'https://www.theguardian.com/science/rss',
    'https://www.nature.com/nature.rss',
    'https://www.lemonde.fr/en/science/rss_full.xml',
    'https://rss.dw.com/xml/rss_en_science',
  ],
  'Business / Economy': [
    'https://www.theguardian.com/business/rss',
    'https://feeds.npr.org/1006/rss.xml',
    'https://rss.dw.com/rdf/rss-en-bus',
    'https://www.lemonde.fr/en/economy/rss_full.xml',
  ],
  Sport: [
    'https://www.theguardian.com/sport/rss',
    'https://www.lemonde.fr/en/sports/rss_full.xml',
    'https://rss.dw.com/rdf/rss-en-sports',
  ],
  Culture: [
    'https://www.theguardian.com/culture/rss',
    'https://hyperallergic.com/feed/',
    'https://pitchfork.com/rss/news/',
    'https://www.lemonde.fr/en/culture/rss_full.xml',
    'https://rss.dw.com/rdf/rss-en-cul',
  ],
}

export const SLOT_CONFIG = {
  morning: { max: 15, maxPerCat: 5 },
  afternoon: { max: 12, maxPerCat: 3 },
} as const

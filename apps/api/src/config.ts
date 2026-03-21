import type { Category } from '@tidel/api'

export const FEEDS: Record<Category, string[]> = {
  World: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.dw.com/rdf/rss-en-world',
    'https://feeds.npr.org/1004/rss.xml',
    'https://www.lemonde.fr/en/international/rss_full.xml',
    'https://www.sbs.com.au/news/topic/world/feed',
  ],
  Technology: [
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.wired.com/feed/rss',
    'https://www.theverge.com/rss/index.xml',
    'https://www.404media.co/feed/',
    'https://www.technologyreview.com/feed/',
  ],
  Science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.nature.com/nature.rss',
    'https://www.lemonde.fr/en/science/rss_full.xml',
    'https://rss.dw.com/xml/rss_en_science',
  ],
  'Business / Economy': [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://feeds.npr.org/1006/rss.xml',
    'https://rss.dw.com/rdf/rss-en-bus',
    'https://www.lemonde.fr/en/economy/rss_full.xml',
  ],
  Sport: [
    'https://feeds.bbci.co.uk/sport/rss.xml',
    'https://www.lemonde.fr/en/sports/rss_full.xml',
    'https://www.espn.com/espn/rss/news',
    'https://rss.dw.com/rdf/rss-en-sports',
  ],
  Culture: [
    'https://hyperallergic.com/feed/',
    'https://pitchfork.com/rss/news/',
    'https://www.avclub.com/rss',
    'https://www.lemonde.fr/en/culture/rss_full.xml',
    'https://rss.dw.com/rdf/rss-en-cul',
  ],
}

export const MIN_STORIES_PER_CATEGORY = 2
export const MAX_STORIES_PER_CATEGORY = 4
export const TARGET_STORY_COUNT = 15

export const AFTERNOON_MIN_STORIES_PER_CATEGORY = 1
export const AFTERNOON_MAX_STORIES_PER_CATEGORY = 3
export const AFTERNOON_MIN_STORY_COUNT = 6
export const AFTERNOON_MAX_STORY_COUNT = 12
export const AFTERNOON_TARGET_STORY_COUNT = 12

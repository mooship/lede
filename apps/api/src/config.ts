import type { Category } from '@tidel/api'

export const FEEDS: Record<Category, string[]> = {
  World: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.dw.com/rdf/rss-en-world',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://www.pbs.org/newshour/feeds/rss/headlines',
    'https://www.independent.co.uk/news/world/rss',
    'https://www.lemonde.fr/en/international/rss_full.xml',
  ],
  Technology: [
    'https://feeds.arstechnica.com/arstechnica/technology-lab',
    'https://www.wired.com/feed/rss',
    'https://www.theverge.com/rss/index.xml',
    'https://www.404media.co/feed/',
    'https://www.technologyreview.com/feed/',
  ],
  Science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.newscientist.com/feed/home/',
    'https://www.nature.com/nature.rss',
    'https://www.france24.com/en/earth/rss',
    'https://www.lemonde.fr/en/science/rss_full.xml',
  ],
  'Business / Economy': [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://www.thenation.com/subject/economy/feed/',
    'https://tribunemag.co.uk/feed',
    'https://www.lemonde.fr/en/economy/rss_full.xml',
  ],
  Sport: [
    'https://feeds.bbci.co.uk/sport/rss.xml',
    'https://www.france24.com/en/sport/rss',
    'https://www.lemonde.fr/en/sports/rss_full.xml',
  ],
}

export const MIN_STORIES_PER_CATEGORY = 2
export const MAX_STORIES_PER_CATEGORY = 4
export const TARGET_STORY_COUNT = 12

export const AFTERNOON_MIN_STORIES_PER_CATEGORY = 1
export const AFTERNOON_MAX_STORIES_PER_CATEGORY = 3
export const AFTERNOON_MIN_STORY_COUNT = 6
export const AFTERNOON_MAX_STORY_COUNT = 9
export const AFTERNOON_TARGET_STORY_COUNT = 9

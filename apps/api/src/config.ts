import type { Category } from '@lede/api'

export const FEEDS: Record<Category, string[]> = {
  'World / Politics': [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.theguardian.com/world/rss',
    'https://rss.dw.com/rdf/rss-en-world',
    'https://www.aljazeera.com/xml/rss/all.xml',
  ],
  Technology: [
    'https://feeds.arstechnica.com/arstechnica/technology-lab',
    'https://www.wired.com/feed/rss',
    'https://www.theverge.com/rss/index.xml',
  ],
  Science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.newscientist.com/feed/home/',
    'https://www.sciencedaily.com/rss/top/science.xml',
  ],
  'Business / Economy': [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://www.theguardian.com/business/rss',
    'https://rss.dw.com/rdf/rss-en-business',
  ],
}

export const STORIES_PER_CATEGORY: Record<Category, number> = {
  'World / Politics': 5,
  'Technology': 3,
  'Science': 3,
  'Business / Economy': 3,
}
export const TARGET_STORY_COUNT = 14

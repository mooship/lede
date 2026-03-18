import type { Category } from '@lede/api'

export const FEEDS: Record<Category, string[]> = {
  'World / Politics': [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.theguardian.com/world/rss',
    'https://rss.dw.com/rdf/rss-en-world',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://apnews.com/apf-world-news',
    'https://www.france24.com/en/rss',
  ],
  Technology: [
    'https://feeds.arstechnica.com/arstechnica/technology-lab',
    'https://www.wired.com/feed/rss',
    'https://www.theverge.com/rss/index.xml',
    'https://www.technologyreview.com/feed/',
    'https://techcrunch.com/feed/',
  ],
  Science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.newscientist.com/feed/home/',
    'https://www.sciencedaily.com/rss/top/science.xml',
    'https://www.nature.com/nature.rss',
    'https://phys.org/rss-feed/',
  ],
  'Business / Economy': [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://www.theguardian.com/business/rss',
    'https://rss.dw.com/rdf/rss-en-business',
    'https://www.ft.com/?format=rss',
  ],
}

export const STORIES_PER_CATEGORY: Record<Category, number> = {
  'World / Politics': 6,
  Technology: 5,
  Science: 4,
  'Business / Economy': 3,
}
export const TARGET_STORY_COUNT = Object.values(STORIES_PER_CATEGORY).reduce((a, b) => a + b, 0)

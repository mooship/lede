import type { Category } from '@lede/api'

export const FEEDS: Record<Category, string[]> = {
  'World / Politics': [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.reuters.com/reuters/worldNews',
  ],
  Technology: [
    'https://feeds.arstechnica.com/arstechnica/technology-lab',
    'https://www.wired.com/feed/rss',
  ],
  Science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.newscientist.com/feed/home/',
  ],
  'Business / Economy': [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://rss.reuters.com/reuters/businessNews',
  ],
}

export const STORIES_PER_CATEGORY = 3
export const TARGET_STORY_COUNT = 10

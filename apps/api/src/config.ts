import type { Category } from '@lede/api'

export const FEEDS: Record<Category, string[]> = {
  World: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.theguardian.com/world/rss',
    'https://rss.dw.com/rdf/rss-en-world',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://feeds.npr.org/1004/rss.xml',
    'https://www.france24.com/en/rss',
    'https://www.dailymaverick.co.za/dmrss/',
    'https://mg.co.za/feed/',
    'https://feeds.news24.com/articles/news24/TopStories/rss',
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
    'https://www.theguardian.com/science/rss',
  ],
  'Business / Economy': [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://www.theguardian.com/business/rss',
    'https://feeds.npr.org/1006/rss.xml',
    'https://www.cnbc.com/id/10001147/device/rss/rss.html',
  ],
  Sport: [
    'https://feeds.bbci.co.uk/sport/rss.xml',
    'https://www.theguardian.com/sport/rss',
    'https://www.espn.com/espn/rss/news',
    'https://www.skysports.com/rss/12040',
  ],
}

export const MIN_STORIES_PER_CATEGORY = 2
export const MAX_STORIES_PER_CATEGORY = 5
export const TARGET_STORY_COUNT = 15

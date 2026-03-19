import type { Category } from '@tidel/api'

export const FEEDS: Record<Category, string[]> = {
  World: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.dw.com/rdf/rss-en-world',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://feeds.npr.org/1004/rss.xml',
    'http://feeds.news24.com/articles/news24/World/rss',
    'https://www.france24.com/en/rss',
    'https://www.pbs.org/newshour/feeds/rss/headlines',
    'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6311',
  ],
  Technology: [
    'https://feeds.arstechnica.com/arstechnica/technology-lab',
    'https://www.wired.com/feed/rss',
    'https://www.theverge.com/rss/index.xml',
    'https://www.theregister.com/headlines.atom',
    'https://techcrunch.com/feed/',
  ],
  Science: [
    'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    'https://www.newscientist.com/feed/home/',
    'https://www.nature.com/nature.rss',
  ],
  'Business / Economy': [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://feeds.npr.org/1006/rss.xml',
    'http://feeds.skynews.com/feeds/rss/business.xml',
  ],
  Sport: [
    'https://feeds.bbci.co.uk/sport/rss.xml',
    'https://www.espn.com/espn/rss/news',
    'https://feeds.npr.org/1055/rss.xml',
  ],
}

export const MIN_STORIES_PER_CATEGORY = 2
export const MAX_STORIES_PER_CATEGORY = 5
export const TARGET_STORY_COUNT = 15

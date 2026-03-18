import type { Story } from '@lede/api'
import { StoryCard } from './StoryCard.js'

type Props = { stories: Story[] }

export function StoryList({ stories }: Props) {
  return (
    <ol
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {stories.map((story) => (
        <li key={story.id}>
          <StoryCard story={story} />
        </li>
      ))}
    </ol>
  )
}

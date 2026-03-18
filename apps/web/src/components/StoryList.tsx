import type { Story } from '@lede/api'
import { StoryCard } from './StoryCard.js'

type Props = { stories: Story[] }

export function StoryList({ stories }: Props) {
  return (
    <div
      style={{
        width: '100%',
        borderTop: '1px solid #2e2e2e',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1px',
          background: '#2e2e2e',
        }}
      >
        {stories.map((story, index) => (
          <StoryCard key={story.id} story={story} position={index + 1} />
        ))}
      </div>
    </div>
  )
}

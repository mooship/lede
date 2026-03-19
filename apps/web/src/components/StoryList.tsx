import type { Story } from '@lede/api'
import { css } from '../../styled-system/css'
import { StoryCard } from './StoryCard.js'

type Props = { stories: Story[] }

const wrapClass = css({ width: '100%', borderTop: '1px solid', borderColor: 'border' })

const gridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
  gap: '6',
})

export function StoryList({ stories }: Props) {
  return (
    <div className={wrapClass}>
      <div className={gridClass}>
        {stories.map((story, index) => (
          <StoryCard key={story.id} story={story} position={index + 1} />
        ))}
      </div>
    </div>
  )
}

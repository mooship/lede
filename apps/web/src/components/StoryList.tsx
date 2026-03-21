import type { Story } from '@tidel/api'
import { css } from '../../styled-system/css'
import { StoryCard } from './StoryCard.js'

type Props = { stories: Story[] }

const wrapClass = css({ width: '100%' })

const gridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
  gap: '1px',
  bg: 'border',
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

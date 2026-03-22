import type { Story } from '@tidel/api'
import { css } from '../../styled-system/css'
import { StoryCard } from './StoryCard.js'

type Props = { stories: Story[] }

const wrapClass = css({
  width: '100%',
  px: { base: '4', md: '0' },
})

const gridClass = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr', md: 'repeat(auto-fill, minmax(360px, 1fr))' },
  gap: '1px',
  bg: 'border',
  borderRadius: { base: '12px', md: '0' },
  overflow: 'hidden',
})

export function StoryList({ stories }: Props) {
  return (
    <div className={wrapClass}>
      <div className={gridClass}>
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} position={story.position + 1} />
        ))}
      </div>
    </div>
  )
}

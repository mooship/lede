import type { Story } from '@lede/api'
import { useState } from 'react'
import { StorySummary } from './StorySummary.js'

const ACCENT: Record<Story['category'], string> = {
  'World / Politics': '#e85a3c',
  Technology: '#4a9eff',
  Science: '#3ecf8e',
  'Business / Economy': '#f5c542',
}

const LABEL: Record<Story['category'], string> = {
  'World / Politics': 'World',
  Technology: 'Tech',
  Science: 'Science',
  'Business / Economy': 'Business',
}

type Props = { story: Story }

export function StoryCard({ story }: Props) {
  const [expanded, setExpanded] = useState(false)
  const accent = ACCENT[story.category]

  return (
    <article
      onClick={() => setExpanded((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v)
      }}
      style={{
        backgroundColor: expanded ? '#242424' : '#1a1a1a',
        borderRadius: '4px',
        borderLeft: `3px solid ${accent}`,
        cursor: 'pointer',
        padding: '1rem',
        transition: 'background-color 0.15s',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '0.5rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: '#f0f0f0',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {story.title}
        </h2>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: accent,
            whiteSpace: 'nowrap',
            paddingTop: '2px',
          }}
        >
          {LABEL[story.category]}
        </span>
      </div>

      {expanded && (
        // biome-ignore lint/a11y/noStaticElementInteractions: stops click propagation to the article toggle
        <div
          role="presentation"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <StorySummary story={story} />
        </div>
      )}
    </article>
  )
}

import type { Story } from '@lede/api'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { CATEGORY_ACCENT, CATEGORY_LABEL } from '../categories.js'

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type Props = { story: Story; position: number }

export function StoryCard({ story, position }: Props) {
  const [hovered, setHovered] = useState(false)
  const accent = CATEGORY_ACCENT[story.category]

  return (
    <Link
      to="/story/$id"
      params={{ id: story.id }}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <article
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          backgroundColor: hovered ? '#1f1f1f' : '#1a1a1a',
          borderLeft: `3px solid ${accent}`,
          cursor: 'pointer',
          padding: '1.5rem',
          minHeight: '120px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          transition: 'background-color 0.2s',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Syne Variable', 'Syne', sans-serif",
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accent,
              backgroundColor: hexToRgba(accent, 0.1),
              border: `1px solid ${hexToRgba(accent, 0.3)}`,
              padding: '2px 8px',
              lineHeight: 1.6,
            }}
          >
            {CATEGORY_LABEL[story.category]}
          </span>

          <span
            style={{
              fontFamily: "'Syne Variable', 'Syne', sans-serif",
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#444444',
            }}
          >
            {String(position).padStart(2, '0')}
          </span>
        </div>

        <h2
          style={{
            fontFamily: "'Syne Variable', 'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)',
            color: '#f0f0f0',
            lineHeight: 1.35,
            margin: 0,
          }}
        >
          {story.title}
        </h2>

        <p
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: '0.8rem',
            color: '#555555',
            fontStyle: 'italic',
            margin: 'auto 0 0 0',
          }}
        >
          {story.source}
        </p>
      </article>
    </Link>
  )
}

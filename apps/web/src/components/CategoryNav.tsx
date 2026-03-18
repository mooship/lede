import type { Category } from '@lede/api'
import { useState } from 'react'
import { CATEGORY_ACCENT } from '../categories.js'

type Tab = Category | 'All'

const TABS: Tab[] = ['All', 'World / Politics', 'Technology', 'Science', 'Business / Economy']

const LABELS: Record<Tab, string> = {
  All: 'All',
  'World / Politics': 'World',
  Technology: 'Technology',
  Science: 'Science',
  'Business / Economy': 'Business',
}

const ACCENT: Record<Tab, string> = { All: '#f0f0f0', ...CATEGORY_ACCENT }

type Props = {
  active: Tab
  onChange: (tab: Tab) => void
}

export function CategoryNav({ active, onChange }: Props) {
  const [hovered, setHovered] = useState<Tab | null>(null)

  return (
    <nav
      style={{
        width: '100%',
        borderBottom: '1px solid #2e2e2e',
        backgroundColor: '#0f0f0f',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          flexDirection: 'row',
          gap: 0,
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab === active
          const isHovered = hovered === tab
          const accent = ACCENT[tab]

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              onMouseEnter={() => setHovered(tab)}
              onMouseLeave={() => setHovered(null)}
              style={{
                fontFamily: "'Syne Variable', 'Syne', sans-serif",
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.75rem 1.25rem',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? `2px solid ${accent}` : '2px solid transparent',
                color: isActive ? accent : isHovered ? '#888888' : '#555555',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: '-1px',
                borderRadius: 0,
              }}
            >
              {LABELS[tab]}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

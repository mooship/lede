import type { Category } from '@lede/api'
import { useRef, useState } from 'react'
import { CATEGORY_ACCENT } from '../categories.js'
import { MUTED } from '../colors.js'

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
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      const next = (index + 1) % TABS.length
      const nextTab = TABS[next]
      if (nextTab) {
        tabRefs.current[next]?.focus()
        onChange(nextTab)
      }
    } else if (e.key === 'ArrowLeft') {
      const prev = (index - 1 + TABS.length) % TABS.length
      const prevTab = TABS[prev]
      if (prevTab) {
        tabRefs.current[prev]?.focus()
        onChange(prevTab)
      }
    }
  }

  return (
    <nav
      style={{
        width: '100%',
        borderBottom: '1px solid #2e2e2e',
        backgroundColor: '#0f0f0f',
      }}
    >
      <div
        role="tablist"
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          flexDirection: 'row',
          gap: 0,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          overscrollBehaviorX: 'contain',
          overscrollBehaviorY: 'none',
          touchAction: 'pan-x',
        }}
      >
        {TABS.map((tab, index) => {
          const isActive = tab === active
          const isHovered = hovered === tab
          const accent = ACCENT[tab]

          return (
            <button
              key={tab}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab)}
              onMouseEnter={() => setHovered(tab)}
              onMouseLeave={() => setHovered(null)}
              onKeyDown={(e) => handleKeyDown(e, index)}
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
                color: isActive ? accent : isHovered ? '#c0c0c0' : MUTED,
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: '-1px',
                borderRadius: 0,
                flexShrink: 0,
                whiteSpace: 'nowrap',
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

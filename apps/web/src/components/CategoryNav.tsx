import type { Category } from '@lede/api'
import { useRef, useState } from 'react'
import { css } from '../../styled-system/css'
import { CATEGORY_CSS_VAR } from '../categories.js'

type Tab = Category | 'All'

const TABS: Tab[] = ['All', 'World', 'Technology', 'Science', 'Business / Economy', 'Sport']

const LABELS: Record<Tab, string> = {
  All: 'All',
  World: 'World',
  Technology: 'Technology',
  Science: 'Science',
  'Business / Economy': 'Business',
  Sport: 'Sport',
}

const ACCENT_VAR: Record<Tab, string> = {
  All: 'var(--colors-text-primary)',
  ...CATEGORY_CSS_VAR,
}

type Props = {
  active: Tab
  onChange: (tab: Tab) => void
}

const navClass = css({
  width: '100%',
  borderBottom: '1px solid',
  borderColor: 'border',
  bg: 'bg',
})

const tabListClass = css({
  maxWidth: '1400px',
  mx: 'auto',
  px: '8',
  display: 'flex',
  flexDir: 'row',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  overscrollBehaviorX: 'contain',
  touchAction: 'pan-x',
  '&::-webkit-scrollbar': { display: 'none' },
})

const tabBaseClass = css({
  fontFamily: 'display',
  fontSize: '0.7rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  px: '5',
  py: '3',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.15s',
  marginBottom: '-1px',
  borderRadius: '0',
  flexShrink: '0',
  whiteSpace: 'nowrap',
  color: 'textMuted',
})

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
    <nav className={navClass}>
      <div role="tablist" className={tabListClass}>
        {TABS.map((tab, index) => {
          const isActive = tab === active
          const isHovered = hovered === tab
          const accentVar = ACCENT_VAR[tab]

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
              className={tabBaseClass}
              style={{
                color: isActive ? accentVar : isHovered ? 'var(--colors-text-light)' : undefined,
                borderBottomColor: isActive ? accentVar : undefined,
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

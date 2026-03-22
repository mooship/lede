import { Link } from '@tanstack/react-router'
import { css } from '../../styled-system/css'

const headerClass = css({
  width: '100%',
  borderBottom: '1px solid',
  borderColor: 'border',
  bg: 'bg',
})

const innerClass = css({
  maxWidth: '1400px',
  mx: 'auto',
  px: { base: '4', md: '8' },
  py: { base: '3', md: '10' },
  minHeight: { base: '56px', md: 'auto' },
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: { base: 'center', md: 'flex-end' },
})

const titleClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: { base: '1.75rem', md: 'clamp(3rem, 6vw, 5rem)' },
  color: 'textPrimary',
  margin: '0',
  lineHeight: '1',
  letterSpacing: '-0.03em',
  textTransform: 'uppercase',
})

const subtitleClass = css({
  fontFamily: 'display',
  fontSize: '0.6rem',
  fontWeight: '700',
  letterSpacing: '0.2em',
  color: 'textMuted',
  textTransform: 'uppercase',
  margin: '0.4rem 0 0 0.1rem',
  display: { base: 'none', md: 'block' },
})

const dateClass = css({
  textAlign: 'right',
  fontFamily: 'body',
  fontSize: '0.85rem',
  color: 'textMuted',
  lineHeight: '1.5',
  mb: '4',
})

const rightColClass = css({
  display: { base: 'none', md: 'flex' },
  flexDirection: 'column',
  alignItems: 'flex-end',
})

const navLinksClass = css({
  display: 'flex',
  gap: '5',
  alignItems: 'center',
})

const navLinkClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'textMuted',
  textDecoration: 'none',
  _hover: { color: 'textLight' },
})

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning Edition',
  afternoon: 'Afternoon Edition',
}

interface MastheadProps {
  editionDate?: string | null
  slot?: 'morning' | 'afternoon'
}

export function Masthead({ editionDate, slot }: MastheadProps) {
  const date = editionDate ? new Date(`${editionDate}T12:00:00Z`) : null

  const dayName = date?.toLocaleDateString('en-GB', {
    weekday: 'long',
    timeZone: 'UTC',
  })
  const dateLine = date?.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const subtitle = (slot && SLOT_LABELS[slot]) ?? 'Daily Edition'

  return (
    <header className={headerClass}>
      <div className={innerClass}>
        <div>
          <h1 className={titleClass}>Tidel</h1>
          <p className={subtitleClass}>{subtitle}</p>
        </div>
        <div className={rightColClass}>
          {date && (
            <div className={dateClass}>
              <div>{dayName}</div>
              <div>{dateLine}</div>
            </div>
          )}
          <nav className={navLinksClass} aria-label="Site navigation">
            <Link to="/about" className={navLinkClass}>
              About
            </Link>
            <Link to="/archive" className={navLinkClass}>
              Archive
            </Link>
            <Link to="/search" className={navLinkClass}>
              Search
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

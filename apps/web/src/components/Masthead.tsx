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
  px: '8',
  py: '10',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
})

const titleClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: 'clamp(3rem, 6vw, 5rem)',
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
})

const dateClass = css({
  textAlign: 'right',
  fontFamily: 'body',
  fontSize: '0.85rem',
  color: 'textMuted',
  lineHeight: '1.5',
})

interface MastheadProps {
  editionDate?: string | null | undefined // YYYY-MM-DD; null/undefined hides the date
}

export function Masthead({ editionDate }: MastheadProps) {
  const date = editionDate ? new Date(`${editionDate}T00:00:00Z`) : null

  const dayName = date?.toLocaleDateString('en-GB', {
    weekday: 'long',
    timeZone: 'Africa/Johannesburg',
  })
  const dateLine = date?.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  })

  return (
    <header className={headerClass}>
      <div className={innerClass}>
        <div>
          <h1 className={titleClass}>Tidel</h1>
          <p className={subtitleClass}>Daily Edition</p>
        </div>
        {date && (
          <div className={dateClass}>
            <div>{dayName}</div>
            <div>{dateLine}</div>
          </div>
        )}
      </div>
    </header>
  )
}

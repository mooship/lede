import { css } from '../../styled-system/css'
import { getEditionDate } from '../utils.js'

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
  color: 'textDim',
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

export function Masthead() {
  const date = getEditionDate()

  const dayName = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    timeZone: 'Africa/Johannesburg',
  })
  const dateLine = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Johannesburg',
  })

  return (
    <header className={headerClass}>
      <div className={innerClass}>
        <div>
          <h1 className={titleClass}>Lede</h1>
          <p className={subtitleClass}>Daily Edition</p>
        </div>
        <div className={dateClass}>
          <div>{dayName}</div>
          <div>{dateLine}</div>
        </div>
      </div>
    </header>
  )
}

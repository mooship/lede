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
  px: '8',
  py: '5',
  display: 'flex',
  alignItems: 'center',
  gap: '6',
})

const brandLinkClass = css({
  fontFamily: 'display',
  fontSize: '1.5rem',
  fontWeight: '800',
  letterSpacing: '-0.03em',
  color: 'textPrimary',
  textDecoration: 'none',
  lineHeight: '1',
})

const separatorClass = css({ color: 'border', fontSize: '1.25rem', lineHeight: '1' })

const backLinkClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'textMuted',
  textDecoration: 'none',
})

export function PageHeader() {
  return (
    <header className={headerClass}>
      <div className={innerClass}>
        <Link to="/" className={brandLinkClass}>
          ELAR
        </Link>
        <span className={separatorClass}>|</span>
        <Link to="/" className={backLinkClass}>
          ← Back
        </Link>
      </div>
    </header>
  )
}

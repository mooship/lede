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

export function PageHeader() {
  return (
    <header className={headerClass}>
      <div className={innerClass}>
        <Link to="/" className={brandLinkClass}>
          TIDEL
        </Link>
      </div>
    </header>
  )
}

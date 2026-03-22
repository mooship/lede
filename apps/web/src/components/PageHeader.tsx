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
  py: '5',
  minHeight: '56px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
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

const rightNavClass = css({
  display: 'flex',
  alignItems: 'center',
  gap: '4',
})

const backLinkClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'textMuted',
  textDecoration: 'none',
})

const searchNavLinkClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'textMuted',
  textDecoration: 'none',
  display: { base: 'none', md: 'inline' },
})

interface PageHeaderProps {
  backTo?: string
}

export function PageHeader({ backTo }: PageHeaderProps) {
  return (
    <header className={headerClass}>
      <div className={innerClass}>
        <Link to="/" className={brandLinkClass}>
          TIDEL
        </Link>
        <nav className={rightNavClass}>
          <Link to="/search" className={searchNavLinkClass}>
            Search
          </Link>
          {backTo && (
            <Link to={backTo} className={backLinkClass}>
              {'\u2190\uFE0E'} Back
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

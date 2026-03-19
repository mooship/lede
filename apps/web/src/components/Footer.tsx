import { Link } from '@tanstack/react-router'
import { css } from '../../styled-system/css'

const footerClass = css({
  borderTop: '1px solid',
  borderColor: 'border',
  marginTop: '16',
  px: '8',
  py: '8',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '3',
  fontFamily: 'display',
  fontSize: '0.75rem',
  color: 'textMuted',
  letterSpacing: '0.05em',
})

const linksClass = css({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '2 5',
})

const linkClass = css({ color: 'textMuted', textDecoration: 'none' })

const EXTERNAL_LINKS = [
  { label: 'Source', href: 'https://github.com/mooship/tidel' },
  { label: 'AGPL-3.0', href: 'https://opensource.org/license/agpl-3-0-only' },
  { label: 'Feedback', href: 'mailto:contact@timothybrits.co.za' },
  { label: 'Report a bug', href: 'https://github.com/mooship/tidel/issues/new' },
]

export function Footer() {
  return (
    <footer className={footerClass}>
      <span>Made with ♥ in South Africa</span>
      <div className={linksClass}>
        <Link to="/about" className={linkClass}>
          About
        </Link>
        {EXTERNAL_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className={linkClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}

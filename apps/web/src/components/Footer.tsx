import { Link } from '@tanstack/react-router'
import React from 'react'
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
  alignItems: 'center',
  gap: '2 3',
})

const separatorClass = css({ color: 'border', userSelect: 'none' })

const linkClass = css({ color: 'textMuted', textDecoration: 'none' })

const ALL_LINKS = [
  { label: 'About', internal: '/about' as const },
  { label: 'Archive', internal: '/archive' as const },
  { label: 'Source', href: 'https://github.com/mooship/tidel' },
  { label: 'AGPL-3.0', href: 'https://opensource.org/license/agpl-3-0-only' },
  { label: 'Feedback', href: 'mailto:contact@tidel.app' },
  { label: 'Report a bug', href: 'https://github.com/mooship/tidel/issues/new' },
]

export function Footer() {
  return (
    <footer className={footerClass}>
      <span>Made with ♥ in South Africa</span>
      <div className={linksClass}>
        {ALL_LINKS.map(({ label, ...link }, i) => (
          <React.Fragment key={label}>
            {i > 0 && (
              <span className={separatorClass} aria-hidden="true">
                ·
              </span>
            )}
            {'internal' in link ? (
              <Link to={link.internal} className={linkClass}>
                {label}
              </Link>
            ) : (
              <a href={link.href} className={linkClass} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            )}
          </React.Fragment>
        ))}
      </div>
    </footer>
  )
}

import { Link } from '@tanstack/react-router'
import React from 'react'
import { css } from '../../styled-system/css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

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

const linkClass = css({
  color: 'textMuted',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '44px',
  px: '1',
})

const coffeeClass = css({
  color: 'textPrimary',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '44px',
  px: '1',
  ml: '3',
  opacity: '0.85',
  _hover: { opacity: '1' },
})

const ALL_LINKS = [
  { label: 'About', internal: '/about' as const },
  { label: 'Archive', internal: '/archive' as const },
  {
    label: 'Source',
    href: 'https://github.com/mooship/tidel',
    ariaLabel: 'Source code (opens in new tab)',
  },
  {
    label: 'AGPL-3.0',
    href: 'https://opensource.org/license/agpl-3-0-only',
    ariaLabel: 'AGPL-3.0 licence (opens in new tab)',
  },
  { label: 'RSS', href: `${API_URL}/feed.xml`, ariaLabel: 'Subscribe via RSS / Atom feed' },
  { label: 'Feedback', href: 'mailto:contact@tidel.app', ariaLabel: 'Send feedback by email' },
  {
    label: 'Report a bug',
    href: 'https://github.com/mooship/tidel/issues/new',
    ariaLabel: 'Report a bug (opens in new tab)',
  },
  {
    label: '☕ Buy me a coffee',
    href: 'https://buymeacoffee.com/timothybrits',
    ariaLabel: 'Buy me a coffee (opens in new tab)',
    highlight: true,
  },
]

export function Footer() {
  return (
    <footer className={footerClass}>
      <span>Made with ♥ in South Africa</span>
      <div className={linksClass}>
        {ALL_LINKS.map(({ label, ...link }, i) => (
          <React.Fragment key={label}>
            {i > 0 && !('highlight' in link && link.highlight) && (
              <span className={separatorClass} aria-hidden="true">
                ·
              </span>
            )}
            {'internal' in link ? (
              <Link to={link.internal} className={linkClass}>
                {label}
              </Link>
            ) : (
              <a
                href={link.href}
                className={'highlight' in link && link.highlight ? coffeeClass : linkClass}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.ariaLabel}
              >
                {label}
              </a>
            )}
          </React.Fragment>
        ))}
      </div>
    </footer>
  )
}

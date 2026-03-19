import { MUTED } from '../colors.js'

const LINK_STYLE: React.CSSProperties = { color: MUTED, textDecoration: 'none' }

const LINKS = [
  { label: 'Source', href: 'https://github.com/mooship/lede', external: true },
  { label: 'AGPL-3.0', href: 'https://opensource.org/license/agpl-3-0-only', external: true },
  { label: 'Feedback', href: 'mailto:contact@timothybrits.co.za', external: false },
  { label: 'Report a bug', href: 'https://github.com/mooship/lede/issues/new', external: true },
]

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid #2e2e2e',
        marginTop: '4rem',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        fontFamily: "'Syne Variable', 'Syne', sans-serif",
        fontSize: '0.75rem',
        color: MUTED,
        letterSpacing: '0.05em',
      }}
    >
      <span>Made with ♥ in South Africa</span>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0.5rem 1.25rem',
        }}
      >
        {LINKS.map(({ label, href, external }) => (
          <a
            key={label}
            href={href}
            style={LINK_STYLE}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}

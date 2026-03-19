import { MUTED } from '../colors.js'

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid #2e2e2e',
        marginTop: '4rem',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: "'Syne Variable', 'Syne', sans-serif",
        fontSize: '0.75rem',
        color: MUTED,
        letterSpacing: '0.05em',
      }}
    >
      {'Made with ♥ in South Africa · '}
      <a
        href="https://github.com/mooship/lede"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: MUTED, textDecoration: 'none' }}
      >
        Source
      </a>
      {' · '}
      <a
        href="https://opensource.org/license/agpl-3-0-only"
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: MUTED, textDecoration: 'none' }}
      >
        AGPL-3.0
      </a>
      {' · '}
      <a
        href="mailto:contact@timothybrits.co.za"
        style={{ color: MUTED, textDecoration: 'none' }}
      >
        Feedback
      </a>
    </footer>
  )
}

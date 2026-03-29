import { createFileRoute, Link } from '@tanstack/react-router'
import { css } from '../../styled-system/css'
import { segmentControlWrap, segmentPill } from '../../styled-system/recipes'
import { PageHeader } from '../components/PageHeader.js'
import { useSettings } from '../context/settings.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })
const mainClass = css({ maxWidth: '560px', mx: 'auto', px: '6', py: '8' })

const sectionClass = css({ mb: '8' })

const sectionLabelClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'textMuted',
  mb: '3',
  display: 'block',
})

const cardClass = css({
  bg: 'surface',
  borderRadius: '12px',
  p: '4',
  border: '1px solid',
  borderColor: 'border',
})

const aboutLinksClass = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
})

const aboutRowClass = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  py: '3',
  borderBottom: '1px solid',
  borderColor: 'border',
  textDecoration: 'none',
  color: 'textPrimary',
  fontFamily: 'body',
  fontSize: '0.9rem',
  _last: { borderBottom: 'none' },
})

const aboutRowChevronClass = css({
  color: 'textDim',
  fontFamily: 'display',
  fontSize: '0.7rem',
})

const THEME_LABELS = { system: 'Auto', light: 'Light', dark: 'Dark' } as const
const FONT_LABELS = { default: 'Default', opendyslexic: 'OpenDyslexic' } as const

function SettingsPage() {
  const { theme, setTheme, font, setFont } = useSettings()

  return (
    <div className={pageClass}>
      <PageHeader />
      <main className={mainClass}>
        <section className={sectionClass}>
          <span className={sectionLabelClass}>Theme</span>
          <div className={cardClass}>
            <div className={segmentControlWrap({ fullWidth: true })}>
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={segmentPill({ selected: theme === t, size: 'fluid' })}
                  onClick={() => setTheme(t)}
                  aria-pressed={theme === t}
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <span className={sectionLabelClass}>Reading Font</span>
          <div className={cardClass}>
            <div className={segmentControlWrap({ fullWidth: true })}>
              {(['default', 'opendyslexic'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={segmentPill({ selected: font === f, size: 'fluid' })}
                  onClick={() => setFont(f)}
                  aria-pressed={font === f}
                >
                  {FONT_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <span className={sectionLabelClass}>About</span>
          <div className={cardClass}>
            <div className={aboutLinksClass}>
              <Link to="/about" className={aboutRowClass}>
                About Tidel
                <span className={aboutRowChevronClass}>›</span>
              </Link>
              <a
                href="https://github.com/mooship/tidel"
                target="_blank"
                rel="noopener noreferrer"
                className={aboutRowClass}
              >
                Source Code
                <span className={aboutRowChevronClass}>›</span>
              </a>
              <a
                href="https://opensource.org/license/agpl-3-0-only"
                target="_blank"
                rel="noopener noreferrer"
                className={aboutRowClass}
              >
                AGPL-3.0 Licence
                <span className={aboutRowChevronClass}>›</span>
              </a>
              <a
                href="https://buymeacoffee.com/timothybrits"
                target="_blank"
                rel="noopener noreferrer"
                className={aboutRowClass}
              >
                ☕ Buy me a coffee
                <span className={aboutRowChevronClass}>›</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  ssr: false,
  head: () => ({
    meta: [{ title: 'Settings — Tidel' }],
  }),
  component: SettingsPage,
})

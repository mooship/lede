import { createFileRoute } from '@tanstack/react-router'
import { css } from '../../styled-system/css'
import { Footer } from '../components/Footer.js'
import { PageHeader } from '../components/PageHeader.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })

const mainClass = css({ maxWidth: '720px', mx: 'auto', px: '8', pt: '16', pb: '20' })

const pageTitleClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  color: 'textPrimary',
  letterSpacing: '-0.03em',
  lineHeight: '1.1',
  marginBottom: '4',
})

const subtitleClass = css({
  fontFamily: 'body',
  fontSize: '1rem',
  fontStyle: 'italic',
  color: 'textMuted',
  marginBottom: '12',
})

const sectionClass = css({ marginBottom: '14' })

const headingClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'textMuted',
  marginBottom: '4',
})

const bodyClass = css({
  fontFamily: 'body',
  fontSize: '1.1rem',
  color: 'textSecondary',
  lineHeight: '1.85',
  marginBottom: '4',
})

const tableWrapperClass = css({ overflowX: 'auto' })

const editionTableClass = css({
  fontFamily: 'body',
  fontSize: '0.95rem',
  color: 'textSecondary',
  borderCollapse: 'collapse',
  width: '100%',
  marginTop: '4',
  '& th': {
    fontFamily: 'display',
    fontWeight: '700',
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'textMuted',
    textAlign: 'left',
    paddingBottom: '2',
    borderBottom: '1px solid',
    borderColor: 'border',
    whiteSpace: 'nowrap',
  },
  '& td': {
    paddingTop: '2',
    paddingBottom: '2',
    borderBottom: '1px solid',
    borderColor: 'border',
    verticalAlign: 'middle',
  },
  '& td:first-child': {
    paddingRight: '6',
    whiteSpace: 'nowrap',
  },
  '& tr:last-child td': {
    borderBottom: 'none',
  },
})

const tzNameClass = css({
  fontFamily: 'display',
  fontWeight: '700',
  fontSize: '0.8rem',
  letterSpacing: '0.05em',
  color: 'textMuted',
})

const tzOffsetClass = css({
  fontFamily: 'body',
  fontWeight: '400',
  fontSize: '0.75rem',
  color: 'textDim',
  marginLeft: '1.5',
})

const inlineLinkClass = css({
  color: 'textSecondary',
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
})

const tableNoteClass = css({
  fontFamily: 'body',
  fontSize: '0.8rem',
  color: 'textMuted',
  marginTop: '3',
  fontStyle: 'italic',
})

function AboutPage() {
  return (
    <div className={pageClass}>
      <PageHeader />

      <main className={mainClass}>
        <h1 className={pageTitleClass}>About Tidel</h1>
        <p className={subtitleClass}>A daily news digest, built in South Africa.</p>

        <div className={sectionClass}>
          <h2 className={headingClass}>What is it?</h2>
          <p className={bodyClass}>
            A free, ad-free daily digest of the day's most significant stories. Every morning and
            afternoon, Tidel pulls from trusted RSS feeds, uses Claude (Anthropic's AI) to pick the
            most newsworthy stories and summarise each one, then publishes a clean edition — no
            noise, no notifications, no sponsored content.
          </p>
        </div>

        <div className={sectionClass}>
          <h2 className={headingClass}>When do editions appear?</h2>
          <div className={tableWrapperClass}>
            <table className={editionTableClass}>
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Morning</th>
                  <th>Afternoon</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className={tzNameClass}>Western US</span>
                    <span className={tzOffsetClass}>UTC−8</span>
                  </td>
                  <td>22:00*</td>
                  <td>07:00</td>
                </tr>
                <tr>
                  <td>
                    <span className={tzNameClass}>Central US</span>
                    <span className={tzOffsetClass}>UTC−6</span>
                  </td>
                  <td>00:00*</td>
                  <td>09:00</td>
                </tr>
                <tr>
                  <td>
                    <span className={tzNameClass}>Eastern US</span>
                    <span className={tzOffsetClass}>UTC−5</span>
                  </td>
                  <td>01:00*</td>
                  <td>10:00</td>
                </tr>
                <tr>
                  <td>
                    <span className={tzNameClass}>UK / Ireland</span>
                    <span className={tzOffsetClass}>UTC±0</span>
                  </td>
                  <td>06:00</td>
                  <td>15:00</td>
                </tr>
                <tr>
                  <td>
                    <span className={tzNameClass}>Central Europe</span>
                    <span className={tzOffsetClass}>UTC+1</span>
                  </td>
                  <td>07:00</td>
                  <td>16:00</td>
                </tr>
                <tr>
                  <td>
                    <span className={tzNameClass}>South Africa</span>
                    <span className={tzOffsetClass}>UTC+2</span>
                  </td>
                  <td>08:00</td>
                  <td>17:00</td>
                </tr>
                <tr>
                  <td>
                    <span className={tzNameClass}>India</span>
                    <span className={tzOffsetClass}>UTC+5:30</span>
                  </td>
                  <td>11:30</td>
                  <td>20:30</td>
                </tr>
                <tr>
                  <td>
                    <span className={tzNameClass}>Singapore</span>
                    <span className={tzOffsetClass}>UTC+8</span>
                  </td>
                  <td>14:00</td>
                  <td>23:00</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={tableNoteClass}>
            UTC offsets shown. Local times shift by 1 hour during daylight saving time. * Previous
            evening.
          </p>
        </div>

        <div className={sectionClass}>
          <h2 className={headingClass}>Open source &amp; free</h2>
          <p className={bodyClass}>
            No subscription, no account, no ads. The source code is published under the AGPL-3.0
            licence — anyone can inspect, run, or adapt it.
          </p>
        </div>

        <div className={sectionClass}>
          <h2 className={headingClass}>Editorial perspective</h2>
          <p className={bodyClass}>
            Tidel is editorially progressive. We draw from international sources and avoid outlets
            that reflect a narrow political or commercial agenda.
          </p>
        </div>

        <div className={sectionClass}>
          <h2 className={headingClass}>Privacy</h2>
          <p className={bodyClass}>
            No cookies, no personal data, no tracking. The only analytics are Cloudflare Web
            Analytics — cookieless and privacy-respecting. Requests are processed by Cloudflare's
            infrastructure; see{' '}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noreferrer"
              className={inlineLinkClass}
            >
              Cloudflare's privacy policy
            </a>{' '}
            for details.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About — Tidel' },
      {
        name: 'description',
        content:
          "How Tidel works: a free, ad-free daily news digest built in South Africa that curates and summarises the day's most significant stories.",
      },
      { property: 'og:title', content: 'About — Tidel' },
      {
        property: 'og:description',
        content:
          "How Tidel works: a free, ad-free daily news digest built in South Africa that curates and summarises the day's most significant stories.",
      },
      { property: 'og:url', content: `${import.meta.env.VITE_APP_URL ?? ''}/about` },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'About — Tidel' },
      {
        name: 'twitter:description',
        content:
          "How Tidel works: a free, ad-free daily news digest built in South Africa that curates and summarises the day's most significant stories.",
      },
    ],
    links: [{ rel: 'canonical', href: `${import.meta.env.VITE_APP_URL ?? ''}/about` }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Tidel',
          url: import.meta.env.VITE_APP_URL ?? '',
          description:
            'A free, ad-free daily news digest that curates and summarises the most significant stories every morning and afternoon.',
        }),
      },
    ],
  }),
  component: AboutPage,
})

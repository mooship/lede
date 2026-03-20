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
  margin: '0 0 0.5rem 0',
})

const subtitleClass = css({
  fontFamily: 'body',
  fontSize: '1rem',
  fontStyle: 'italic',
  color: 'textMuted',
  margin: '0 0 14 0',
})

const sectionClass = css({ marginBottom: '12' })

const headingClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'textMuted',
  margin: '0 0 4 0',
})

const bodyClass = css({
  fontFamily: 'body',
  fontSize: '1.1rem',
  color: 'textSecondary',
  lineHeight: '1.85',
  margin: '0 0 4 0',
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
            A free, ad-free daily digest of the day's most significant stories. Every morning at
            06:00 South African time, Tidel pulls from trusted RSS feeds, uses Claude (Anthropic's
            AI) to pick the most newsworthy stories and summarise each one, then publishes a clean
            edition — no noise, no notifications, no sponsored content.
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
          <h2 className={headingClass}>Privacy</h2>
          <p className={bodyClass}>
            No cookies, no personal data, no tracking. The only analytics are Cloudflare Web
            Analytics — cookieless and privacy-respecting.
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
    ],
    links: [{ rel: 'canonical', href: `${import.meta.env.VITE_APP_URL ?? ''}/about` }],
  }),
  component: AboutPage,
})

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
          <h2 className={headingClass}>What is Tidel?</h2>
          <p className={bodyClass}>
            Tidel is a free, ad-free daily news digest. Every morning at 06:00 South African time,
            it automatically gathers the most significant stories from trusted sources around the
            world, writes a concise summary of each one, and publishes a clean, readable edition —
            no notifications, no algorithms trying to keep you scrolling, no sponsored content.
          </p>
        </div>

        <div className={sectionClass}>
          <h2 className={headingClass}>How stories are chosen</h2>
          <p className={bodyClass}>
            Tidel reads dozens of RSS feeds from publishers across five categories: World,
            Technology, Science, Business &amp; Economy, and Sport. These are open news feeds that
            publishers make available for free — no paywalled sources are used.
          </p>
          <p className={bodyClass}>
            Once the headlines are collected, Claude, Anthropic's AI model, reviews the full list and selects the most
            newsworthy stories. It looks for hard news — politics, geopolitics, economic policy,
            science discoveries — and aims for geographic diversity, drawing from Europe, the
            Americas, Africa, Asia, the Middle East, and Oceania. Lifestyle, food, entertainment,
            and opinion pieces are excluded. For sport, only results or news from major
            international competitions make the cut.
          </p>
          <p className={bodyClass}>
            Stories that appear across multiple sources are weighted more heavily. If five outlets
            are all reporting on the same event, that's a signal it matters.
          </p>
        </div>

        <div className={sectionClass}>
          <h2 className={headingClass}>How summaries are written</h2>
          <p className={bodyClass}>
            Each selected story is summarised by Claude, Anthropic's AI model. The summary is around 150 words — long
            enough to give you the full picture, short enough to read in under a minute. A
            one-sentence byline captures the core fact at a glance.
          </p>
          <p className={bodyClass}>
            Summaries are written in British English, the spelling convention used across much of
            the world outside North America. Every story also links back to the original source so
            you can read the full article if you want more.
          </p>
        </div>

        <div className={sectionClass}>
          <h2 className={headingClass}>Why these categories?</h2>
          <p className={bodyClass}>
            The five categories reflect the news that tends to matter most day to day: what's
            happening in the world, what's changing in technology, what science is discovering, how
            economies are moving, and what's happening in sport. The balance between them shifts
            each day depending on the news — there's no fixed quota.
          </p>
        </div>

        <div className={sectionClass}>
          <h2 className={headingClass}>Is it free?</h2>
          <p className={bodyClass}>
            Yes. Tidel has no subscription, no account, no advertising. The source code is published
            under the AGPL-3.0 open-source licence, which means anyone can inspect, run, or adapt it
            — and any public version must remain open source too.
          </p>
        </div>

        <div className={sectionClass}>
          <h2 className={headingClass}>Privacy</h2>
          <p className={bodyClass}>
            Tidel does not use cookies, collect personal data, or track you in any way. There are no
            accounts, no login, and nothing stored about your visits. The only analytics in use are
            Cloudflare Web Analytics — a privacy-respecting, cookieless measurement tool that does
            not build profiles or share data with third parties.
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

import { createFileRoute, Link } from '@tanstack/react-router'
import { MUTED } from '../colors.js'
import { Footer } from '../components/Footer.js'

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: '3rem',
}

const HEADING_STYLE: React.CSSProperties = {
  fontFamily: "'Syne Variable', 'Syne', sans-serif",
  fontWeight: 800,
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: MUTED,
  margin: '0 0 1rem 0',
}

const BODY_STYLE: React.CSSProperties = {
  fontFamily: "'Instrument Serif', Georgia, serif",
  fontSize: '1.1rem',
  color: '#d0d0d0',
  lineHeight: 1.85,
  margin: '0 0 1rem 0',
}

function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
      <header
        style={{ width: '100%', borderBottom: '1px solid #2e2e2e', backgroundColor: '#0f0f0f' }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <Link
            to="/"
            style={{
              fontFamily: "'Syne Variable', 'Syne', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#f0f0f0',
              textDecoration: 'none',
              lineHeight: 1,
            }}
          >
            LEDE
          </Link>
          <span style={{ color: '#2e2e2e', fontSize: '1.25rem', lineHeight: 1 }}>|</span>
          <Link
            to="/"
            style={{
              fontFamily: "'Syne Variable', 'Syne', sans-serif",
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: MUTED,
              textDecoration: 'none',
            }}
          >
            ← Back
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '4rem 2rem 5rem' }}>
        <h1
          style={{
            fontFamily: "'Syne Variable', 'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: '#f0f0f0',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: '0 0 0.5rem 0',
          }}
        >
          About Lede
        </h1>
        <p
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: '1rem',
            fontStyle: 'italic',
            color: MUTED,
            margin: '0 0 3.5rem 0',
          }}
        >
          A daily news digest, built in South Africa.
        </p>

        <div style={SECTION_STYLE}>
          <h2 style={HEADING_STYLE}>What is Lede?</h2>
          <p style={BODY_STYLE}>
            Lede is a free, ad-free daily news digest. Every morning at 06:00 South African time, it
            automatically gathers the most significant stories from trusted sources around the
            world, writes a concise summary of each one, and publishes a clean, readable edition —
            no notifications, no algorithms trying to keep you scrolling, no sponsored content.
          </p>
          <p style={BODY_STYLE}>
            The name comes from journalism. The "lede" is the opening of a news article — the
            sentence that tells you what actually happened. That's the spirit of this site: get to
            the point.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={HEADING_STYLE}>How stories are chosen</h2>
          <p style={BODY_STYLE}>
            Lede reads dozens of RSS feeds from publishers across five categories: World,
            Technology, Science, Business &amp; Economy, and Sport. These are open news feeds that
            publishers make available for free — no paywalled sources are used.
          </p>
          <p style={BODY_STYLE}>
            Once the headlines are collected, an AI model reviews the full list and selects the most
            newsworthy stories. It looks for hard news — politics, geopolitics, economic policy,
            science discoveries — and aims for geographic diversity, drawing from Europe, the
            Americas, Africa, Asia, the Middle East, and Oceania. Lifestyle, food, entertainment,
            and opinion pieces are excluded. For sport, only results or news from major
            international competitions make the cut.
          </p>
          <p style={BODY_STYLE}>
            Stories that appear across multiple sources are weighted more heavily. If five outlets
            are all reporting on the same event, that's a signal it matters.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={HEADING_STYLE}>How summaries are written</h2>
          <p style={BODY_STYLE}>
            Each selected story is summarised by an AI model. The summary is around 150 words — long
            enough to give you the full picture, short enough to read in under a minute. A
            one-sentence byline captures the core fact at a glance.
          </p>
          <p style={BODY_STYLE}>
            Summaries are written in British English, the spelling convention used across much of
            the world outside North America. Every story also links back to the original source so
            you can read the full article if you want more.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={HEADING_STYLE}>Why these categories?</h2>
          <p style={BODY_STYLE}>
            The five categories reflect the news that tends to matter most day to day: what's
            happening in the world, what's changing in technology, what science is discovering, how
            economies are moving, and what's happening in sport. The balance between them shifts
            each day depending on the news — there's no fixed quota.
          </p>
        </div>

        <div style={SECTION_STYLE}>
          <h2 style={HEADING_STYLE}>Is it free?</h2>
          <p style={BODY_STYLE}>
            Yes. Lede has no subscription, no account, no advertising. The source code is published
            under the AGPL-3.0 open-source licence, which means anyone can inspect, run, or adapt it
            — and any public version must remain open source too.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

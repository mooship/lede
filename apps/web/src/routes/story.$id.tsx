import { createFileRoute, Link } from '@tanstack/react-router'
import { CATEGORY_ACCENT, CATEGORY_LABEL } from '../categories.js'
import { MUTED } from '../colors.js'
import { PageMessage } from '../components/PageMessage.js'
import { trpc } from '../trpc.js'
import { msUntilNextEdition } from '../utils.js'

async function shareStory(title: string, url: string) {
  if (navigator.share) {
    await navigator.share({ title, url })
  } else {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* clipboard unavailable */
    }
  }
}

function StoryPage() {
  const { id } = Route.useParams()
  const { data, isLoading, error } = trpc.edition.today.useQuery(undefined, {
    staleTime: msUntilNextEdition(),
  })

  if (isLoading) {
    return <PageMessage message="Loading…" variant="loading" />
  }

  if (error || !data) {
    return <PageMessage message="Something went wrong." color="#e85a3c" />
  }

  const story = data.find((s) => s.id === id)
  if (!story) {
    return <PageMessage message="Story not found." />
  }

  const accent = CATEGORY_ACCENT[story.category] ?? '#f0f0f0'

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

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 2rem 5rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span
            style={{
              fontFamily: "'Syne Variable', 'Syne', sans-serif",
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accent,
              border: `1px solid ${accent}`,
              padding: '3px 10px',
              lineHeight: 1.6,
            }}
          >
            {CATEGORY_LABEL[story.category] ?? story.category}
          </span>
          <span
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '0.8rem',
              color: MUTED,
              fontStyle: 'italic',
            }}
          >
            {story.source}
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Syne Variable', 'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            color: '#f0f0f0',
            lineHeight: 1.2,
            margin: '0 0 2rem 0',
            letterSpacing: '-0.02em',
            borderLeft: `4px solid ${accent}`,
            paddingLeft: '1.25rem',
          }}
        >
          {story.title}
        </h1>

        {story.description && (
          <p
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '1.1rem',
              fontStyle: 'italic',
              color: MUTED,
              lineHeight: 1.7,
              margin: '0 0 1.5rem 0',
            }}
          >
            {story.description}
          </p>
        )}
        <p
          style={{
            fontFamily: "'Syne Variable', 'Syne', sans-serif",
            fontSize: '1rem',
            color: '#d0d0d0',
            lineHeight: 1.85,
            margin: '0 0 2.5rem 0',
          }}
        >
          {story.summary}
        </p>

        <div
          style={{
            borderTop: '1px solid #2e2e2e',
            paddingTop: '1.5rem',
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
          }}
        >
          <a
            href={story.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'Syne Variable', 'Syne', sans-serif",
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: accent,
              textDecoration: 'none',
              border: `1px solid ${accent}`,
              padding: '0.5rem 1rem',
            }}
          >
            Read Full Article →
          </a>

          <button
            type="button"
            onClick={() => void shareStory(story.title, window.location.href)}
            style={{
              fontFamily: "'Syne Variable', 'Syne', sans-serif",
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: MUTED,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            ↗ Share
          </button>
        </div>
      </main>
    </div>
  )
}

export const Route = createFileRoute('/story/$id')({
  component: StoryPage,
})

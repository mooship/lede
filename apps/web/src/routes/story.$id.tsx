import { createFileRoute } from '@tanstack/react-router'
import { css } from '../../styled-system/css'
import { CATEGORY_CSS_VAR, CATEGORY_LABEL } from '../categories.js'
import { PageHeader } from '../components/PageHeader.js'
import { PageMessage } from '../components/PageMessage.js'
import { trpc } from '../trpc.js'
import { editionStaleTime } from '../utils.js'

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

const pageClass = css({ minHeight: '100vh', bg: 'bg' })
const mainClass = css({ maxWidth: '720px', mx: 'auto', px: '8', pt: '12', pb: '20' })

const metaRowClass = css({
  marginBottom: '6',
  display: 'flex',
  alignItems: 'center',
  gap: '4',
})

const badgeClass = css({
  fontFamily: 'display',
  fontSize: '0.6rem',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '3px 10px',
  lineHeight: '1.6',
  border: '1px solid',
})

const sourceClass = css({
  fontFamily: 'body',
  fontSize: '0.8rem',
  color: 'textMuted',
  fontStyle: 'italic',
})

const storyTitleClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
  color: 'textPrimary',
  lineHeight: '1.2',
  margin: '0 0 2rem 0',
  letterSpacing: '-0.02em',
  borderLeft: '4px solid',
  paddingLeft: '5',
})

const bylineClass = css({
  fontFamily: 'body',
  fontSize: '1.1rem',
  fontStyle: 'italic',
  color: 'textMuted',
  lineHeight: '1.7',
  margin: '0 0 1.5rem 0',
})

const summaryClass = css({
  fontFamily: 'display',
  fontSize: '1rem',
  color: 'textSecondary',
  lineHeight: '1.85',
  margin: '0 0 2.5rem 0',
})

const actionsClass = css({
  borderTop: '1px solid',
  borderColor: 'border',
  paddingTop: '6',
  display: 'flex',
  gap: '6',
  alignItems: 'center',
})

const readLinkClass = css({
  fontFamily: 'display',
  fontSize: '0.7rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  border: '1px solid',
  padding: '0.5rem 1rem',
})

const shareButtonClass = css({
  fontFamily: 'display',
  fontSize: '0.7rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'textMuted',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0',
})

function StoryPage() {
  const { id } = Route.useParams()
  const { data, isLoading, error } = trpc.edition.today.useQuery(undefined, {
    staleTime: editionStaleTime,
  })

  if (isLoading) {
    return <PageMessage message="Loading…" variant="loading" />
  }

  if (error || !data) {
    return <PageMessage message="Something went wrong." color="var(--colors-world)" />
  }

  const story = data.find((s) => s.id === id)
  if (!story) {
    return <PageMessage message="Story not found." />
  }

  const accentVar = CATEGORY_CSS_VAR[story.category] ?? 'var(--colors-text-primary)'

  return (
    <div className={pageClass}>
      <PageHeader />

      <main className={mainClass}>
        <div className={metaRowClass}>
          <span className={badgeClass} style={{ color: accentVar, borderColor: accentVar }}>
            {CATEGORY_LABEL[story.category] ?? story.category}
          </span>
          <span className={sourceClass}>{story.source}</span>
        </div>

        <h1 className={storyTitleClass} style={{ borderLeftColor: accentVar }}>
          {story.title}
        </h1>

        {story.description && <p className={bylineClass}>{story.description}</p>}

        <p className={summaryClass}>{story.summary}</p>

        <div className={actionsClass}>
          <a
            href={story.link}
            target="_blank"
            rel="noopener noreferrer"
            className={readLinkClass}
            style={{ color: accentVar, borderColor: accentVar }}
          >
            Read Full Article →
          </a>
          <button
            type="button"
            onClick={() => void shareStory(story.title, window.location.href)}
            className={shareButtonClass}
          >
            Share
          </button>
        </div>
      </main>
    </div>
  )
}

export const Route = createFileRoute('/story/$id')({
  component: StoryPage,
})

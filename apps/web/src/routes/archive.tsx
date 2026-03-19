import { createFileRoute, Link } from '@tanstack/react-router'
import { css } from '../../styled-system/css'
import { Footer } from '../components/Footer.js'
import { PageHeader } from '../components/PageHeader.js'
import { PageMessage } from '../components/PageMessage.js'
import { trpc } from '../trpc.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })
const mainClass = css({ maxWidth: '720px', mx: 'auto', px: '8', pt: '12', pb: '20' })

const pageTitleClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  color: 'textPrimary',
  letterSpacing: '-0.03em',
  lineHeight: '1.1',
  margin: '0 0 8 0',
})

const listClass = css({ listStyle: 'none', padding: '0', margin: '0' })

const itemClass = css({
  borderBottom: '1px solid',
  borderColor: 'border',
  '&:first-child': { borderTop: '1px solid', borderTopColor: 'border' },
})

const linkClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '5',
  px: '0',
  textDecoration: 'none',
  transition: 'background 0.1s',
  '&:hover': { background: 'surface' },
})

const dateLabelClass = css({
  fontFamily: 'display',
  fontWeight: '700',
  fontSize: '0.95rem',
  color: 'textPrimary',
  letterSpacing: '-0.01em',
})

const countClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'textMuted',
})

function formatArchiveDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ArchivePage() {
  const { data, isLoading, error } = trpc.edition.list.useQuery()

  if (isLoading) {
    return <PageMessage message="Loading archive…" variant="loading" />
  }

  if (error) {
    return <PageMessage message="Could not load archive." color="var(--colors-world)" />
  }

  return (
    <div className={pageClass}>
      <PageHeader />
      <main className={mainClass}>
        <h1 className={pageTitleClass}>Archive</h1>
        {!data || data.length === 0 ? (
          <p
            className={css({
              fontFamily: 'body',
              fontSize: '1.1rem',
              color: 'textMuted',
              lineHeight: '1.75',
            })}
          >
            No editions yet — check back soon.
          </p>
        ) : (
          <ul className={listClass}>
            {data.map((edition) => (
              <li key={edition.date} className={itemClass}>
                <Link to="/edition/$date" params={{ date: edition.date }} className={linkClass}>
                  <span className={dateLabelClass}>{formatArchiveDate(edition.date)}</span>
                  <span className={countClass}>{edition.storyCount} stories</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/archive')({
  head: () => ({
    meta: [
      { title: 'Archive — Tidel' },
      { name: 'description', content: 'Browse past daily editions of the Tidel news digest.' },
      { property: 'og:title', content: 'Archive — Tidel' },
      {
        property: 'og:description',
        content: 'Browse past daily editions of the Tidel news digest.',
      },
      { property: 'og:url', content: `${import.meta.env.VITE_APP_URL ?? ''}/archive` },
    ],
    links: [{ rel: 'canonical', href: `${import.meta.env.VITE_APP_URL ?? ''}/archive` }],
  }),
  component: ArchivePage,
})

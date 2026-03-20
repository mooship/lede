import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { css } from '../../styled-system/css'
import { Footer } from '../components/Footer.js'
import { PageHeader } from '../components/PageHeader.js'
import { PageMessage } from '../components/PageMessage.js'
import { createServerTrpcCaller } from '../trpc.js'

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

const itemInnerClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '5',
  px: '0',
})

const dateLabelClass = css({
  fontFamily: 'display',
  fontWeight: '700',
  fontSize: '0.95rem',
  color: 'textPrimary',
  letterSpacing: '-0.01em',
})

const slotsClass = css({
  display: 'flex',
  gap: '3',
  alignItems: 'center',
  flexShrink: '0',
})

const slotLinkClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'textMuted',
  textDecoration: 'none',
  border: '1px solid',
  borderColor: 'border',
  px: '3',
  py: '1',
  transition: 'color 0.1s, border-color 0.1s',
  '&:hover': { color: 'textPrimary', borderColor: 'textMuted' },
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

type EditionEntry = { date: string; slot: string; storyCount: number }

const fetchEditionList = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<EditionEntry>> => {
    return createServerTrpcCaller().edition.list.query()
  },
)

function groupByDate(editions: EditionEntry[]): Map<string, EditionEntry[]> {
  const map = new Map<string, EditionEntry[]>()
  for (const ed of editions) {
    const group = map.get(ed.date) ?? []
    group.push(ed)
    map.set(ed.date, group)
  }
  return map
}

function ArchivePage() {
  const data: Array<EditionEntry> = Route.useLoaderData()
  const grouped = groupByDate(data)

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
            {[...grouped.entries()].map(([date, slots]) => (
              <li key={date} className={itemClass}>
                <div className={itemInnerClass}>
                  <span className={dateLabelClass}>{formatArchiveDate(date)}</span>
                  <div className={slotsClass}>
                    {slots.map((ed) => (
                      <Link
                        key={ed.slot}
                        to="/edition/$date"
                        params={{ date }}
                        search={{ slot: ed.slot as 'morning' | 'afternoon' }}
                        className={slotLinkClass}
                        aria-label={`${ed.slot === 'morning' ? 'Morning' : 'Afternoon'} edition for ${formatArchiveDate(date)}, ${ed.storyCount} stories`}
                      >
                        {ed.slot === 'morning' ? 'Morning' : 'Afternoon'} · {ed.storyCount}
                      </Link>
                    ))}
                  </div>
                </div>
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
  pendingComponent: () => <PageMessage message="Loading archive…" variant="loading" />,
  loader: async () => fetchEditionList(),
  component: ArchivePage,
})

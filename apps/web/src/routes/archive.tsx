import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useMemo } from 'react'
import { css } from '../../styled-system/css'
import { Footer } from '../components/Footer.js'
import { PageHeader } from '../components/PageHeader.js'
import { PageMessage } from '../components/PageMessage.js'
import { createServerTrpcCaller } from '../trpc.js'
import { formatEditionDate } from '../utils.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })
const mainClass = css({ maxWidth: '720px', mx: 'auto', px: '8', pt: '12', pb: '20' })

const pageTitleClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  color: 'textPrimary',
  letterSpacing: '-0.03em',
  lineHeight: '1.1',
  margin: '0',
  marginBottom: '8',
})

const listClass = css({ listStyle: 'none', padding: '0', margin: '0' })

const itemClass = css({
  borderBottom: '1px solid',
  borderColor: 'border',
  '&:first-child': { borderTop: '1px solid', borderTopColor: 'border' },
})

const dateLabelClass = css({
  fontFamily: 'display',
  fontWeight: '700',
  fontSize: '0.95rem',
  color: 'textPrimary',
  letterSpacing: '-0.01em',
})

const rowLinkClass = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '5',
  px: '0',
  textDecoration: 'none',
  transition: 'opacity 0.1s',
  _hover: { opacity: '0.7' },
})

const slotBadgeClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'textDim',
  flexShrink: '0',
})

export { formatEditionDate as formatArchiveDate }

type EditionEntry = { date: string; slot: string; storyCount: number }

const fetchEditionList = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<EditionEntry>> => {
    return createServerTrpcCaller().edition.list.query()
  },
)

export function groupByDate(editions: EditionEntry[]): Map<string, EditionEntry[]> {
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
  const grouped = useMemo(() => groupByDate(data), [data])

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
            {[...grouped.entries()].map(([date, slots]) => {
              const hasAfternoon = slots.some((s) => s.slot === 'afternoon')
              const defaultSlot = hasAfternoon ? 'afternoon' : 'morning'
              const slotLabel = slots.map((s) => (s.slot === 'morning' ? 'AM' : 'PM')).join(' · ')
              return (
                <li key={date} className={itemClass}>
                  <Link
                    to="/edition/$date"
                    params={{ date }}
                    search={{ slot: defaultSlot }}
                    className={rowLinkClass}
                    aria-label={`Edition for ${formatEditionDate(date)}`}
                  >
                    <span className={dateLabelClass}>{formatEditionDate(date)}</span>
                    <span className={slotBadgeClass}>{slotLabel}</span>
                  </Link>
                </li>
              )
            })}
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
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: 'Archive — Tidel' },
      {
        name: 'twitter:description',
        content: 'Browse past daily editions of the Tidel news digest.',
      },
    ],
    links: [{ rel: 'canonical', href: `${import.meta.env.VITE_APP_URL ?? ''}/archive` }],
  }),
  pendingComponent: () => <PageMessage message="Loading archive…" variant="loading" />,
  loader: async () => fetchEditionList(),
  component: ArchivePage,
})

import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { Category, Slot, Story } from '@tidel/api'
import { useState } from 'react'
import { z } from 'zod'
import { css } from '../../styled-system/css'
import { CategoryNav } from '../components/CategoryNav.js'
import { Footer } from '../components/Footer.js'
import { PageMessage } from '../components/PageMessage.js'
import { SlotSwitcher } from '../components/SlotSwitcher.js'
import { StoryList } from '../components/StoryList.js'
import { createServerTrpcCaller } from '../trpc.js'
import { isAfternoonAvailable } from '../utils.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })
const storyWrapClass = css({ maxWidth: '1400px', mx: 'auto' })

const dateHeaderClass = css({
  width: '100%',
  borderBottom: '1px solid',
  borderColor: 'border',
  bg: 'bg',
})

const dateHeaderInnerClass = css({
  maxWidth: '1400px',
  mx: 'auto',
  px: '8',
  py: '5',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

const brandLinkClass = css({
  fontFamily: 'display',
  fontSize: '1.5rem',
  fontWeight: '800',
  letterSpacing: '-0.03em',
  color: 'textPrimary',
  textDecoration: 'none',
  lineHeight: '1',
})

const dateTitleClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: 'clamp(1.25rem, 3vw, 2rem)',
  color: 'textPrimary',
  letterSpacing: '-0.02em',
  margin: '0',
})

const archiveLinkClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'textMuted',
  textDecoration: 'none',
})

function formatEditionDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const fetchEditionByDate = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ date: z.string(), slot: z.enum(['morning', 'afternoon']) }))
  .handler(async ({ data }): Promise<Story[] | null> => {
    return createServerTrpcCaller().edition.byDate.query({ date: data.date, slot: data.slot })
  })

const searchSchema = z.object({
  slot: z.enum(['morning', 'afternoon']).optional().default('morning'),
})

function EditionPage() {
  const { date } = Route.useParams()
  const { slot: activeSlot } = useSearch({ from: '/edition/$date' })
  const navigate = useNavigate({ from: '/edition/$date' })
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const data: Story[] | null = Route.useLoaderData()

  function handleSlotChange(slot: Slot) {
    void navigate({ search: (prev) => ({ ...prev, slot }), replace: true })
  }

  const afternoonAvailable = isAfternoonAvailable()

  if (data == null) {
    return (
      <div className={pageClass}>
        <div className={dateHeaderClass}>
          <div className={dateHeaderInnerClass}>
            <Link to="/" className={brandLinkClass}>
              TIDEL
            </Link>
            <Link to="/archive" className={archiveLinkClass}>
              {'\u2190\uFE0E'} Archive
            </Link>
          </div>
        </div>
        <SlotSwitcher
          activeSlot={activeSlot}
          onSlotChange={handleSlotChange}
          afternoonAvailable={afternoonAvailable}
        />
        <div className={css({ maxWidth: '720px', mx: 'auto', px: '8', py: '12' })}>
          <p className={css({ fontFamily: 'body', fontSize: '1.1rem', color: 'textMuted' })}>
            No{activeSlot === 'afternoon' ? ' afternoon' : ''} edition found for{' '}
            {formatEditionDate(date)}.{' '}
            <Link to="/archive" className={css({ color: 'textSecondary' })}>
              Browse archive {'\u2192\uFE0E'}
            </Link>
          </p>
        </div>
        <Footer />
      </div>
    )
  }

  const filtered =
    activeCategory === 'All' ? data : data.filter((s) => s.category === activeCategory)

  const formattedDate = formatEditionDate(date)

  return (
    <div className={pageClass}>
      <div className={dateHeaderClass}>
        <div className={dateHeaderInnerClass}>
          <Link to="/" className={brandLinkClass}>
            TIDEL
          </Link>
          <h1 className={dateTitleClass}>{formattedDate}</h1>
          <Link to="/archive" className={archiveLinkClass}>
            ← Archive
          </Link>
        </div>
      </div>
      <SlotSwitcher
        activeSlot={activeSlot}
        onSlotChange={handleSlotChange}
        afternoonAvailable={afternoonAvailable}
      />
      <CategoryNav active={activeCategory} onChange={setActiveCategory} />
      <div className={storyWrapClass}>
        {filtered.length === 0 ? (
          <p
            className={css({
              fontFamily: 'body',
              fontSize: '1.1rem',
              color: 'textMuted',
              px: '8',
              py: '12',
            })}
          >
            No {activeCategory} stories in this edition.
          </p>
        ) : (
          <StoryList stories={filtered} />
        )}
      </div>
      <Footer />
    </div>
  )
}

const dateParamsSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })

export const Route = createFileRoute('/edition/$date')({
  validateSearch: searchSchema,
  params: {
    parse: (raw) => dateParamsSchema.parse(raw),
    stringify: (p) => ({ date: p.date }),
  },
  loaderDeps: ({ search }) => ({ slot: search.slot }),
  head: ({ params }) => {
    const formattedDate = formatEditionDate(params.date)
    const editionUrl = `${import.meta.env.VITE_APP_URL ?? ''}/edition/${params.date}`
    return {
      meta: [
        { title: `${formattedDate} — Tidel` },
        { name: 'description', content: `Tidel news digest for ${formattedDate}.` },
        { property: 'og:title', content: `${formattedDate} — Tidel` },
        { property: 'og:description', content: `Tidel news digest for ${formattedDate}.` },
        { property: 'og:url', content: editionUrl },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: `${formattedDate} — Tidel` },
        { name: 'twitter:description', content: `Tidel news digest for ${formattedDate}.` },
      ],
      links: [{ rel: 'canonical', href: editionUrl }],
    }
  },
  pendingComponent: () => <PageMessage message="Loading edition…" variant="loading" />,
  loader: async ({ params, deps }) =>
    fetchEditionByDate({ data: { date: params.date, slot: deps.slot } }),
  component: EditionPage,
})

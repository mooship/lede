import { createFileRoute, Link } from '@tanstack/react-router'
import type { Category } from '@tidel/api'
import { useState } from 'react'
import { z } from 'zod'
import { css } from '../../styled-system/css'
import { CategoryNav } from '../components/CategoryNav.js'
import { Footer } from '../components/Footer.js'
import { PageHeader } from '../components/PageHeader.js'
import { PageMessage } from '../components/PageMessage.js'
import { StoryList } from '../components/StoryList.js'
import { trpc } from '../trpc.js'

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
  py: '6',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
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

function EditionPage() {
  const { date } = Route.useParams()
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const { data, isLoading, error } = trpc.edition.byDate.useQuery({ date })

  if (isLoading) {
    return <PageMessage message="Loading edition…" variant="loading" />
  }

  if (error) {
    return <PageMessage message="Something went wrong." color="var(--colors-world)" />
  }

  if (data == null) {
    return (
      <div className={pageClass}>
        <PageHeader />
        <div className={css({ maxWidth: '720px', mx: 'auto', px: '8', py: '12' })}>
          <p className={css({ fontFamily: 'body', fontSize: '1.1rem', color: 'textMuted' })}>
            No edition found for {formatEditionDate(date)}.{' '}
            <Link to="/archive" className={css({ color: 'textSecondary' })}>
              Browse archive →
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
      <PageHeader />
      <div className={dateHeaderClass}>
        <div className={dateHeaderInnerClass}>
          <h1 className={dateTitleClass}>{formattedDate}</h1>
          <Link to="/archive" className={archiveLinkClass}>
            ← Archive
          </Link>
        </div>
      </div>
      <CategoryNav active={activeCategory} onChange={setActiveCategory} />
      <div className={storyWrapClass}>
        <StoryList stories={filtered} />
      </div>
      <Footer />
    </div>
  )
}

const dateParamsSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })

export const Route = createFileRoute('/edition/$date')({
  params: {
    parse: (raw) => dateParamsSchema.parse(raw),
    stringify: (p) => ({ date: p.date }),
  },
  head: ({ params }) => ({
    meta: [
      { title: `Edition ${params.date} — Tidel` },
      {
        name: 'description',
        content: `Tidel news digest for ${params.date}.`,
      },
    ],
  }),
  component: EditionPage,
})

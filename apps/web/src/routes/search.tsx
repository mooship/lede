import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { css } from '../../styled-system/css'
import { Footer } from '../components/Footer.js'
import { PageHeader } from '../components/PageHeader.js'
import { StoryCard } from '../components/StoryCard.js'
import { trpc } from '../trpc.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })

const mainClass = css({ maxWidth: '1400px', mx: 'auto', px: '8', pt: '10', pb: '20' })

const headingClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
  color: 'textPrimary',
  letterSpacing: '-0.02em',
  marginBottom: '8',
})

const formClass = css({ display: 'flex', gap: '3', marginBottom: '10' })

const inputClass = css({
  fontFamily: 'body',
  fontSize: '1rem',
  color: 'textPrimary',
  bg: 'surface',
  border: '1px solid',
  borderColor: 'border',
  padding: '0.6rem 1rem',
  flex: '1',
  outline: 'none',
  _focus: { borderColor: 'textMuted' },
})

const submitClass = css({
  fontFamily: 'display',
  fontSize: '0.7rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'textPrimary',
  bg: 'surface',
  border: '1px solid',
  borderColor: 'border',
  cursor: 'pointer',
  padding: '0.6rem 1.2rem',
})

const gridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
  gap: '0',
})

const statusClass = css({
  fontFamily: 'body',
  fontSize: '1rem',
  color: 'textMuted',
  py: '12',
})

const searchSchema = z.object({ q: z.string().optional().default('') })

function SearchPage() {
  const navigate = useNavigate({ from: '/search' })
  const { q } = useSearch({ from: '/search' })
  const [input, setInput] = useState(q)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const trimmed = q.trim()
  const enabled = trimmed.length >= 2

  const { data: results, isFetching } = trpc.story.search.useQuery(
    { query: trimmed },
    { enabled, staleTime: 60_000 },
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void navigate({ search: { q: input }, replace: true })
  }

  return (
    <div className={pageClass}>
      <PageHeader backTo="/" />
      <main className={mainClass}>
        <h1 className={headingClass}>Search</h1>
        <form className={formClass} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className={inputClass}
            type="search"
            placeholder="Search stories and summaries…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Search query"
          />
          <button type="submit" className={submitClass}>
            Search
          </button>
        </form>

        {!enabled && !trimmed && (
          <p className={statusClass}>Enter at least 2 characters to search.</p>
        )}
        {isFetching && <p className={statusClass}>Searching…</p>}
        {!isFetching && enabled && results?.length === 0 && (
          <p className={statusClass}>No stories found for "{trimmed}".</p>
        )}
        {!isFetching && results && results.length > 0 && (
          <>
            <p className={statusClass}>
              {results.length} {results.length === 1 ? 'story' : 'stories'} found
            </p>
            <div className={gridClass}>
              {results.map((story, i) => (
                <StoryCard key={story.id} story={story} position={i} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

export const Route = createFileRoute('/search')({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: 'Search — Tidel' },
      { name: 'description', content: 'Search stories across all Tidel editions.' },
    ],
  }),
  component: SearchPage,
})

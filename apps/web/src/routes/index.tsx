import type { Category } from '@lede/api'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { MUTED } from '../colors.js'
import { CategoryNav } from '../components/CategoryNav.js'
import { Masthead } from '../components/Masthead.js'
import { PageMessage } from '../components/PageMessage.js'
import { StoryList } from '../components/StoryList.js'
import { trpc } from '../trpc.js'
import { msUntilNextEdition } from '../utils.js'

function IndexPage() {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const { data, isLoading, error } = trpc.edition.today.useQuery(undefined, {
    staleTime: msUntilNextEdition(),
  })

  const nextBuildTime = useMemo(() => {
    const d = new Date()
    d.setUTCHours(4, 0, 0, 0)
    if (d <= new Date()) d.setUTCDate(d.getUTCDate() + 1)
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }, [])

  if (isLoading) {
    return <PageMessage message="Loading edition…" variant="loading" />
  }

  if (error) {
    return <PageMessage message="Something went wrong. Please try again." color="#e85a3c" />
  }

  if (data == null) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
        <Masthead />
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
          <p
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '1.1rem',
              color: MUTED,
              lineHeight: 1.75,
            }}
          >
            Today's edition isn't ready yet. Next build at {nextBuildTime}.
          </p>
        </div>
      </div>
    )
  }

  const filtered =
    activeCategory === 'All' ? data : data.filter((s) => s.category === activeCategory)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
      <Masthead />
      <CategoryNav active={activeCategory} onChange={setActiveCategory} />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0' }}>
        <StoryList stories={filtered} />
      </div>
    </div>
  )
}

export default IndexPage

export const Route = createFileRoute('/')({
  component: IndexPage,
})

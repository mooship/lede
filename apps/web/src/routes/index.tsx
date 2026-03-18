import type { Category } from '@lede/api'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CategoryNav } from '../components/CategoryNav.js'
import { Masthead } from '../components/Masthead.js'
import { PageMessage } from '../components/PageMessage.js'
import { StoryList } from '../components/StoryList.js'
import { trpc } from '../trpc.js'
import { msUntilMidnightSAST } from '../utils.js'

function IndexPage() {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const { data, isLoading, error } = trpc.edition.today.useQuery(undefined, {
    staleTime: msUntilMidnightSAST(),
  })

  if (isLoading) {
    return <PageMessage message="Loading edition…" variant="loading" />
  }

  if (error) {
    return <PageMessage message="Something went wrong. Please try again." color="#e85a3c" />
  }

  if (data === null) {
    const nextBuild = new Date()
    nextBuild.setUTCHours(4, 0, 0, 0)
    if (nextBuild <= new Date()) {
      nextBuild.setUTCDate(nextBuild.getUTCDate() + 1)
    }

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
        <Masthead />
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>
          <p
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: '1.1rem',
              color: '#888888',
              lineHeight: 1.75,
            }}
          >
            Today's edition isn't ready yet. Next build at{' '}
            {nextBuild.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} SAST.
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

export const Route = createFileRoute('/')({
  component: IndexPage,
})

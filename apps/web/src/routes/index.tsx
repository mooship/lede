import type { Category } from '@lede/api'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CategoryNav } from '../components/CategoryNav.js'
import { Masthead } from '../components/Masthead.js'
import { StoryList } from '../components/StoryList.js'
import { trpc } from '../trpc.js'

function msUntilMidnightSAST() {
  const now = new Date()
  const midnight = new Date()
  midnight.setUTCHours(22, 0, 0, 0)
  if (midnight <= now) midnight.setUTCDate(midnight.getUTCDate() + 1)
  return midnight.getTime() - now.getTime()
}

function IndexPage() {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const { data, isLoading, error } = trpc.edition.today.useQuery(undefined, {
    staleTime: msUntilMidnightSAST(),
  })

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f0f0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#888888', fontFamily: 'Syne, sans-serif' }}>Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f0f0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: '#e85a3c', fontFamily: 'Syne, sans-serif' }}>
          Something went wrong. Please try again.
        </p>
      </div>
    )
  }

  if (data === null) {
    const nextBuild = new Date()
    nextBuild.setUTCHours(4, 0, 0, 0)
    if (nextBuild <= new Date()) nextBuild.setUTCDate(nextBuild.getUTCDate() + 1)

    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f0f0f',
          padding: '2rem',
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        <Masthead />
        <p
          style={{
            color: '#888888',
            fontFamily: 'Instrument Serif, Georgia, serif',
            marginTop: '2rem',
          }}
        >
          Today's edition isn't ready yet. Next build at{' '}
          {nextBuild.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} SAST.
        </p>
      </div>
    )
  }

  const filtered =
    activeCategory === 'All' ? data : data.filter((s) => s.category === activeCategory)

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        padding: '2rem',
        maxWidth: '640px',
        margin: '0 auto',
      }}
    >
      <Masthead />
      <CategoryNav active={activeCategory} onChange={setActiveCategory} />
      <StoryList stories={filtered} />
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: IndexPage,
})

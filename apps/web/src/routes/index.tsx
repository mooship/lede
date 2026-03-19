import type { Category } from '@elar/api'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { css } from '../../styled-system/css'
import { CategoryNav } from '../components/CategoryNav.js'
import { Footer } from '../components/Footer.js'
import { Masthead } from '../components/Masthead.js'
import { PageMessage } from '../components/PageMessage.js'
import { StoryList } from '../components/StoryList.js'
import { trpc } from '../trpc.js'
import { editionStaleTime } from '../utils.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })
const contentClass = css({ maxWidth: '1400px', mx: 'auto', px: '8', py: '12' })
const storyWrapClass = css({ maxWidth: '1400px', mx: 'auto' })

const emptyTextClass = css({
  fontFamily: 'body',
  fontSize: '1.1rem',
  color: 'textMuted',
  lineHeight: '1.75',
})

function IndexPage() {
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const { data, isLoading, error } = trpc.edition.today.useQuery(undefined, {
    staleTime: editionStaleTime,
  })

  if (isLoading) {
    return <PageMessage message="Loading edition…" variant="loading" />
  }

  if (error) {
    return (
      <PageMessage message="Something went wrong. Please try again." color="var(--colors-world)" />
    )
  }

  if (data == null) {
    return (
      <div className={pageClass}>
        <Masthead />
        <div className={contentClass}>
          <p className={emptyTextClass}>No editions yet — check back soon.</p>
        </div>
        <Footer />
      </div>
    )
  }

  const filtered =
    activeCategory === 'All' ? data : data.filter((s) => s.category === activeCategory)

  return (
    <div className={pageClass}>
      <Masthead />
      <CategoryNav active={activeCategory} onChange={setActiveCategory} />
      <div className={storyWrapClass}>
        <StoryList stories={filtered} />
      </div>
      <Footer />
    </div>
  )
}

export default IndexPage

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: "Elar — Today's News Digest" },
      {
        name: 'description',
        content:
          "Today's most significant stories across world news, technology, science, business, and sport — curated and summarised every morning.",
      },
      { property: 'og:title', content: "Elar — Today's News Digest" },
      {
        property: 'og:description',
        content:
          "Today's most significant stories across world news, technology, science, business, and sport — curated and summarised every morning.",
      },
    ],
  }),
  component: IndexPage,
})

import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { Category, Slot, Story } from '@tidel/api'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { css } from '../../styled-system/css'
import { CategoryNav } from '../components/CategoryNav.js'
import { Footer } from '../components/Footer.js'
import { Masthead } from '../components/Masthead.js'
import { SkeletonCard } from '../components/SkeletonCard.js'
import { SlotSwitcher } from '../components/SlotSwitcher.js'
import { StoryList } from '../components/StoryList.js'
import { createServerTrpcCaller } from '../trpc.js'

const pageClass = css({ minHeight: '100vh', bg: 'bg' })
const contentClass = css({ maxWidth: '1400px', mx: 'auto', px: '8', py: '12' })
const storyWrapClass = css({ maxWidth: '1400px', mx: 'auto' })

const emptyTextClass = css({
  fontFamily: 'body',
  fontSize: '1.1rem',
  color: 'textMuted',
  lineHeight: '1.75',
})

const bannerClass = css({
  position: 'sticky',
  top: '0',
  zIndex: '10',
  bg: 'science',
  px: '8',
  py: '3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4',
})

const bannerTextClass = css({
  fontFamily: 'display',
  fontSize: '0.75rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'bg',
})

const bannerButtonClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'bg',
  background: 'none',
  border: '1px solid',
  borderColor: 'bg',
  cursor: 'pointer',
  px: '3',
  py: '1',
})

const skeletonGridClass = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
  gap: '0',
})

const searchSchema = z.object({
  category: z
    .enum(['All', 'World', 'Technology', 'Science', 'Business / Economy', 'Sport'])
    .optional()
    .default('All'),
  slot: z.enum(['morning', 'afternoon']).optional().default('morning'),
})

function isAfternoonAvailable(): boolean {
  const now = new Date()
  const hourSAST = parseInt(
    now.toLocaleString('en-US', {
      timeZone: 'Africa/Johannesburg',
      hour: 'numeric',
      hour12: false,
    }),
    10,
  )
  return hourSAST >= 14
}

const fetchTodaysEdition = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slot: z.enum(['morning', 'afternoon']) }))
  .handler(async ({ data }): Promise<Story[] | null> => {
    return createServerTrpcCaller().edition.today.query({ slot: data.slot })
  })

function IndexPage() {
  const navigate = useNavigate({ from: '/' })
  const { category: activeCategory, slot: activeSlot } = useSearch({ from: '/' })
  const data: Story[] | null = Route.useLoaderData()

  const seenEditionDate = useRef<string | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    if (!data || data.length === 0) return
    const firstId = data[0]?.id ?? ''
    if (seenEditionDate.current === null) {
      seenEditionDate.current = firstId
    } else if (seenEditionDate.current !== firstId) {
      setShowBanner(true)
    }
  }, [data])

  function handleBannerRefresh() {
    setShowBanner(false)
    seenEditionDate.current = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCategoryChange(tab: Category | 'All') {
    void navigate({ search: (prev) => ({ ...prev, category: tab }), replace: true })
  }

  function handleSlotChange(slot: Slot) {
    void navigate({ search: (prev) => ({ ...prev, slot }), replace: true })
  }

  const afternoonAvailable = isAfternoonAvailable() || (activeSlot === 'afternoon' && data !== null)

  if (data == null && activeSlot === 'afternoon') {
    return (
      <div className={pageClass}>
        <Masthead slot={activeSlot} />
        <SlotSwitcher
          activeSlot={activeSlot}
          onSlotChange={handleSlotChange}
          afternoonAvailable={afternoonAvailable}
        />
        <main className={contentClass}>
          <p className={emptyTextClass}>No afternoon edition yet — check back later.</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (data == null) {
    return (
      <div className={pageClass}>
        <Masthead slot={activeSlot} />
        <SlotSwitcher
          activeSlot={activeSlot}
          onSlotChange={handleSlotChange}
          afternoonAvailable={afternoonAvailable}
        />
        <main className={contentClass}>
          <p className={emptyTextClass}>No editions yet — check back soon.</p>
        </main>
      </div>
    )
  }

  const filtered =
    activeCategory === 'All' ? data : data.filter((s) => s.category === activeCategory)

  return (
    <div className={pageClass}>
      {showBanner && (
        <div className={bannerClass}>
          <span className={bannerTextClass}>Today's edition is ready</span>
          <button type="button" onClick={handleBannerRefresh} className={bannerButtonClass}>
            Refresh
          </button>
        </div>
      )}
      <Masthead editionDate={data[0]?.editionDate} slot={activeSlot} />
      <SlotSwitcher
        activeSlot={activeSlot}
        onSlotChange={handleSlotChange}
        afternoonAvailable={afternoonAvailable}
      />
      <main>
        <CategoryNav active={activeCategory} onChange={handleCategoryChange} />
        <div className={storyWrapClass}>
          <StoryList stories={filtered} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default IndexPage

export const Route = createFileRoute('/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ slot: search.slot }),
  head: () => ({
    meta: [
      { title: "Tidel — Today's News Digest" },
      {
        name: 'description',
        content:
          "Today's most significant stories across world news, technology, science, business, and sport — curated and summarised every morning and afternoon.",
      },
      { property: 'og:title', content: "Tidel — Today's News Digest" },
      {
        property: 'og:description',
        content:
          "Today's most significant stories across world news, technology, science, business, and sport — curated and summarised every morning and afternoon.",
      },
      { property: 'og:url', content: import.meta.env.VITE_APP_URL ?? '' },
    ],
    links: [{ rel: 'canonical', href: import.meta.env.VITE_APP_URL ?? '' }],
  }),
  pendingComponent: () => (
    <div className={pageClass}>
      <Masthead />
      <main>
        <div className={skeletonGridClass} data-testid="loading-skeleton">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  ),
  loader: async ({ deps }) => fetchTodaysEdition({ data: { slot: deps.slot } }),
  component: IndexPage,
})

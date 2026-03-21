import { render, screen } from '@testing-library/react'
import type { Story } from '@tidel/api'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: object) => ({ useLoaderData: vi.fn(), ...config }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    inputValidator: () => ({ handler: () => vi.fn() }),
  }),
}))

vi.mock('../trpc.js', () => ({ createServerTrpcCaller: vi.fn() }))

import { Route } from '../routes/story.$id.js'

const mockStory: Story = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  editionDate: '2024-01-01',
  editionSlot: 'morning',
  title: 'Scientists make breakthrough discovery',
  description: 'A team of researchers announced a major finding.',
  summary: 'Scientists have discovered something remarkable.',
  category: 'Science',
  link: 'https://nature.com/article/123',
  pubDate: '2024-01-01T09:00:00Z',
  source: 'nature.com',
  position: 2,
}

async function renderStoryPage(story: Story | null) {
  vi.spyOn(Route, 'useLoaderData').mockReturnValue(story)
  const StoryPage = Route.component as React.ComponentType
  render(<StoryPage />)
}

describe('StoryPage', () => {
  it('renders "Story not found." when story is null', async () => {
    await renderStoryPage(null)
    expect(screen.getByText('Story not found.')).not.toBeNull()
  })

  it('renders the story title', async () => {
    await renderStoryPage(mockStory)
    expect(screen.getByRole('heading', { name: mockStory.title })).not.toBeNull()
  })

  it('renders the story source', async () => {
    await renderStoryPage(mockStory)
    expect(screen.getByText(mockStory.source)).not.toBeNull()
  })

  it('renders the category badge label', async () => {
    await renderStoryPage(mockStory)
    expect(screen.getByText('Science')).not.toBeNull()
  })

  it('renders the Read Full Article link with the story link as href', async () => {
    await renderStoryPage(mockStory)
    const readLink = screen.getByRole('link', { name: /Read full article/i })
    expect(readLink.getAttribute('href')).toBe(mockStory.link)
  })

  it('renders the description byline when present', async () => {
    await renderStoryPage(mockStory)
    expect(screen.getByText(mockStory.description ?? '')).not.toBeNull()
  })

  it('does not render a byline when description is null', async () => {
    await renderStoryPage({ ...mockStory, description: null })
    expect(screen.queryByText('A team of researchers announced a major finding.')).toBeNull()
  })

  it('renders the story summary', async () => {
    await renderStoryPage(mockStory)
    expect(screen.getByText(mockStory.summary)).not.toBeNull()
  })

  it('renders the Share button', async () => {
    await renderStoryPage(mockStory)
    expect(screen.getByRole('button', { name: /share/i })).not.toBeNull()
  })
})

import type { Story } from '@tidel/api'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { StoryCard } from '../components/StoryCard.js'

vi.mock('@tanstack/react-router')

const story: Story = {
  id: '42',
  title: 'Test headline',
  description: null,
  summary: 'A concise summary of the article.',
  category: 'Technology',
  link: 'https://example.com/article',
  pubDate: null,
  source: 'example.com',
  position: 0,
}

describe('StoryCard', () => {
  it('renders the story title', () => {
    render(<StoryCard story={story} position={1} />)
    expect(screen.getByRole('heading', { name: story.title })).not.toBeNull()
  })

  it('renders the story source', () => {
    render(<StoryCard story={story} position={1} />)
    expect(screen.getByText(story.source)).not.toBeNull()
  })

  it('renders the category label badge', () => {
    render(<StoryCard story={story} position={1} />)
    expect(screen.getByText('Tech')).not.toBeNull()
  })

  it('does not render the summary on the card', () => {
    render(<StoryCard story={story} position={1} />)
    expect(screen.queryByText(story.summary)).toBeNull()
  })

  it('links to the story detail page', () => {
    render(<StoryCard story={story} position={1} />)
    expect(screen.getByRole('link').getAttribute('href')).toBe('/story/42')
  })
})

import type { Story } from '@lede/api'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StoryCard } from '../components/StoryCard.js'

const story: Story = {
  id: '1',
  title: 'Test headline',
  summary: 'A concise summary of the article.',
  category: 'Technology',
  link: 'https://example.com/article',
  pubDate: null,
  source: 'example.com',
  position: 0,
}

describe('StoryCard', () => {
  it('renders collapsed by default', () => {
    render(<StoryCard story={story} position={1} />)
    expect(screen.queryByText(story.summary)).not.toBeInTheDocument()
  })

  it('expands on click to show summary', async () => {
    render(<StoryCard story={story} position={1} />)
    await userEvent.click(screen.getByRole('article'))
    expect(screen.getByText(story.summary)).toBeInTheDocument()
  })

  it('shows share button when expanded', async () => {
    render(<StoryCard story={story} position={1} />)
    await userEvent.click(screen.getByRole('article'))
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
  })

  it('collapses when clicked again', async () => {
    render(<StoryCard story={story} position={1} />)
    const article = screen.getByRole('article')
    await userEvent.click(article)
    await userEvent.click(article)
    expect(screen.queryByText(story.summary)).not.toBeInTheDocument()
  })
})

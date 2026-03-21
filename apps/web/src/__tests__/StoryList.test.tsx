import { render, screen } from '@testing-library/react'
import type { Story } from '@tidel/api'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
  }: {
    children: React.ReactNode
    to: string
    params?: Record<string, string>
  }) => {
    const href = params ? to.replace(/\$(\w+)/g, (_, k) => params[k] ?? '') : to
    return <a href={href}>{children}</a>
  },
}))

import { StoryList } from '../components/StoryList.js'

function makeStory(id: string): Story {
  return {
    id,
    editionDate: '2024-01-01',
    editionSlot: 'morning',
    title: `Story ${id}`,
    description: null,
    summary: 'Summary.',
    category: 'Technology',
    link: `https://example.com/${id}`,
    pubDate: null,
    source: 'example.com',
    position: 0,
  }
}

describe('StoryList', () => {
  it('renders the correct number of story cards', () => {
    const stories = [makeStory('1'), makeStory('2'), makeStory('3')]
    render(<StoryList stories={stories} />)
    expect(screen.getAllByRole('heading').length).toBe(3)
  })

  it('renders story titles', () => {
    const stories = [makeStory('a'), makeStory('b')]
    render(<StoryList stories={stories} />)
    expect(screen.getByText('Story a')).not.toBeNull()
    expect(screen.getByText('Story b')).not.toBeNull()
  })

  it('renders nothing when stories array is empty', () => {
    render(<StoryList stories={[]} />)
    expect(screen.queryAllByRole('heading').length).toBe(0)
  })
})

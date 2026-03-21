import { render, screen } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

import { Masthead } from '../components/Masthead.js'

describe('Masthead', () => {
  it('renders the TIDEL title', () => {
    render(<Masthead />)
    expect(screen.getByRole('heading', { name: 'Tidel' })).not.toBeNull()
  })

  it('shows "Daily Edition" when no slot is provided', () => {
    render(<Masthead />)
    expect(screen.getByText('Daily Edition')).not.toBeNull()
  })

  it('shows "Morning Edition" when slot is morning', () => {
    render(<Masthead slot="morning" />)
    expect(screen.getByText('Morning Edition')).not.toBeNull()
  })

  it('shows "Afternoon Edition" when slot is afternoon', () => {
    render(<Masthead slot="afternoon" />)
    expect(screen.getByText('Afternoon Edition')).not.toBeNull()
  })

  it('does not render a date section when editionDate is not provided', () => {
    const { container } = render(<Masthead />)
    expect(container.querySelectorAll('div').length).toBeGreaterThan(0)
    expect(
      screen.queryByText(
        /January|February|March|April|May|June|July|August|September|October|November|December/,
      ),
    ).toBeNull()
  })

  it('renders a formatted date when editionDate is provided', () => {
    render(<Masthead editionDate="2024-03-15" />)
    expect(screen.getByText(/March/)).not.toBeNull()
    expect(screen.getByText(/2024/)).not.toBeNull()
  })
})

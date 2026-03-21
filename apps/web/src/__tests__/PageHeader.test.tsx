import { render, screen } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

import { PageHeader } from '../components/PageHeader.js'

describe('PageHeader', () => {
  it('renders the TIDEL brand link', () => {
    render(<PageHeader />)
    expect(screen.getByText('TIDEL')).not.toBeNull()
  })

  it('brand link points to /', () => {
    render(<PageHeader />)
    const brandLink = screen.getByText('TIDEL').closest('a')
    expect(brandLink?.getAttribute('href')).toBe('/')
  })

  it('renders a back link when backTo is provided', () => {
    render(<PageHeader backTo="/" />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it('back link has the correct href', () => {
    render(<PageHeader backTo="/archive" />)
    const links = screen.getAllByRole('link')
    const backLink = links.find((l) => l.getAttribute('href') === '/archive')
    expect(backLink).not.toBeNull()
  })

  it('does not render a back link when backTo is not provided', () => {
    render(<PageHeader />)
    const links = screen.getAllByRole('link')
    const backLink = links.find((l) => l.textContent?.includes('Back'))
    expect(backLink).toBeUndefined()
  })
})

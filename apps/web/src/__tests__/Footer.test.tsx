import { render, screen } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

import { Footer } from '../components/Footer.js'

describe('Footer', () => {
  it('renders the About internal link', () => {
    render(<Footer />)
    expect(screen.getByText('About')).not.toBeNull()
  })

  it('renders the Archive internal link', () => {
    render(<Footer />)
    expect(screen.getByText('Archive')).not.toBeNull()
  })

  it('renders the Source external link', () => {
    render(<Footer />)
    expect(screen.getByText('Source')).not.toBeNull()
  })

  it('renders the AGPL-3.0 external link', () => {
    render(<Footer />)
    expect(screen.getByText('AGPL-3.0')).not.toBeNull()
  })

  it('renders the Made with ♥ in South Africa tagline', () => {
    render(<Footer />)
    expect(screen.getByText(/Made with/)).not.toBeNull()
    expect(screen.getByText(/South Africa/)).not.toBeNull()
  })

  it('Source link opens in a new tab', () => {
    render(<Footer />)
    const sourceLink = screen.getByText('Source').closest('a')
    expect(sourceLink?.getAttribute('target')).toBe('_blank')
  })
})

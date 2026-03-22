import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Footer } from '../components/Footer.js'

describe('Footer', () => {
  it('renders the Source external link', () => {
    render(<Footer />)
    expect(screen.getByText('Source')).not.toBeNull()
  })

  it('renders the Atom feed link', () => {
    render(<Footer />)
    expect(screen.getByText('Atom')).not.toBeNull()
  })

  it('renders the RSS feed link', () => {
    render(<Footer />)
    expect(screen.getByText('RSS')).not.toBeNull()
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

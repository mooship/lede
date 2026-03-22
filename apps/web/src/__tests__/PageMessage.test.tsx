import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PageMessage } from '../components/PageMessage.js'

describe('PageMessage', () => {
  it('renders the message text', () => {
    render(<PageMessage message="Story not found." />)
    expect(screen.getByText('Story not found.')).not.toBeNull()
  })

  it('renders with default serif variant without crashing', () => {
    render(<PageMessage message="No editions yet." />)
    expect(screen.getByRole('status')).not.toBeNull()
  })

  it('renders with loading variant without crashing', () => {
    render(<PageMessage message="Loading…" variant="loading" />)
    expect(screen.getByText('Loading…')).not.toBeNull()
  })

  it('has aria-live polite on the message element', () => {
    render(<PageMessage message="Please wait." />)
    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite')
  })

  it('renders with error variant without crashing', () => {
    render(<PageMessage message="Something went wrong." variant="error" />)
    expect(screen.getByText('Something went wrong.')).not.toBeNull()
  })
})

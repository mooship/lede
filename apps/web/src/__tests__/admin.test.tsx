import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: object) => ({ ...config }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

import { Route } from '../routes/admin.js'

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function renderAdminPage() {
  const AdminPage = Route.component as React.ComponentType
  render(<AdminPage />, { wrapper })
}

const mockStatusResponse = {
  result: {
    data: [
      {
        date: '2024-01-01',
        slot: 'morning',
        builtAt: '2024-01-01T04:00:00Z',
        storyCount: 12,
        feedStats: { 'https://bbc.com/rss': 'ok', 'https://bad.feed': 'error' },
        categoryBreakdown: { Technology: 3, World: 4 },
      },
    ],
  },
}

describe('AdminPage (outer form)', () => {
  it('renders the admin secret password input', () => {
    renderAdminPage()
    expect(screen.getByLabelText('Admin secret')).not.toBeNull()
  })

  it('renders the View Status button', () => {
    renderAdminPage()
    expect(screen.getByRole('button', { name: 'View Status' })).not.toBeNull()
  })

  it('does not show AdminStatus before the form is submitted', () => {
    renderAdminPage()
    expect(screen.queryByText(/Loading/)).toBeNull()
  })

  it('shows AdminStatus after submitting a non-empty secret', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ result: { data: null } }),
      }),
    )

    renderAdminPage()
    fireEvent.change(screen.getByLabelText('Admin secret'), { target: { value: 'my-secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'View Status' }))

    await waitFor(() => {
      expect(screen.getByText(/No editions built yet/)).not.toBeNull()
    })

    vi.unstubAllGlobals()
  })

  it('does not show AdminStatus when submitted secret is only whitespace', () => {
    renderAdminPage()
    fireEvent.change(screen.getByLabelText('Admin secret'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'View Status' }))
    expect(screen.queryByText(/Loading/)).toBeNull()
  })
})

describe('AdminStatus states', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function submitSecret(secret = 'test-secret-value') {
    renderAdminPage()
    fireEvent.change(screen.getByLabelText('Admin secret'), { target: { value: secret } })
    fireEvent.click(screen.getByRole('button', { name: 'View Status' }))
  }

  it('shows "Incorrect admin secret." on UNAUTHORIZED error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () =>
        Promise.resolve({
          error: { message: 'Unauthorized', data: { code: 'UNAUTHORIZED' } },
        }),
    } as unknown as Response)

    await submitSecret()

    await waitFor(() => {
      expect(screen.getByText('Incorrect admin secret.')).not.toBeNull()
    })
  })

  it('shows "No editions built yet." when API returns null', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ result: { data: null } }),
    } as unknown as Response)

    await submitSecret()

    await waitFor(() => {
      expect(screen.getByText('No editions built yet.')).not.toBeNull()
    })
  })

  it('shows edition data when API returns valid status', async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      if (String(url).includes('adminStatus')) {
        return Promise.resolve({
          json: () => Promise.resolve(mockStatusResponse),
        } as unknown as Response)
      }
      return Promise.resolve({
        json: () => Promise.resolve({ result: { data: [] } }),
      } as unknown as Response)
    })

    await submitSecret()

    await waitFor(() => {
      expect(screen.getByText('2024-01-01')).not.toBeNull()
    })
    expect(screen.getByText('12')).not.toBeNull()
  })

  it('shows build button with morning slot text by default', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockStatusResponse),
    } as unknown as Response)

    await submitSecret()

    await waitFor(() => {
      expect(screen.getByText(/Build Morning Edition/)).not.toBeNull()
    })
  })

  it('slot pill for Morning has aria-pressed true by default', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockStatusResponse),
    } as unknown as Response)

    await submitSecret()

    await waitFor(() => {
      const morningBtn = screen.getByRole('button', { name: 'Morning' })
      expect(morningBtn.getAttribute('aria-pressed')).toBe('true')
    })
  })

  it('switches to afternoon slot text when Afternoon pill is clicked', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(mockStatusResponse),
    } as unknown as Response)

    await submitSecret()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Afternoon' })).not.toBeNull()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Afternoon' }))

    await waitFor(() => {
      expect(screen.getByText(/Build Afternoon Edition/)).not.toBeNull()
    })
  })
})

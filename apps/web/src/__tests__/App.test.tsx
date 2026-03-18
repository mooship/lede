import type { Story } from '@lede/api'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../trpc.js', () => ({
  trpc: {
    edition: {
      today: {
        useQuery: vi.fn(),
      },
    },
  },
}))

const mockStory: Story = {
  id: '1',
  title: 'Test Story',
  summary: 'Summary text.',
  category: 'Technology',
  link: 'https://example.com',
  pubDate: null,
  source: 'example.com',
  position: 0,
}

async function renderIndex(overrides: {
  data?: Story[] | null
  isLoading?: boolean
  error?: Error | null
}) {
  const { trpc } = await import('../trpc.js')
  vi.mocked(trpc.edition.today.useQuery).mockReturnValue({
    data: overrides.data,
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
  } as ReturnType<typeof trpc.edition.today.useQuery>)

  const { default: IndexPage } = await import('../routes/index.js')
  render(<IndexPage />)
}

describe('Index page (App)', () => {
  it('shows loading indicator when in-flight', async () => {
    await renderIndex({ isLoading: true, data: undefined })
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('shows not_ready state when data is null', async () => {
    await renderIndex({ data: null })
    expect(screen.getByText(/edition isn't ready/i)).toBeInTheDocument()
  })

  it('renders story cards when data is present', async () => {
    await renderIndex({ data: [mockStory] })
    expect(screen.getByText(mockStory.title)).toBeInTheDocument()
  })

  it('shows error state on failure', async () => {
    await renderIndex({ error: new Error('Network failure') })
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})

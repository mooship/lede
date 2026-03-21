import { render, screen } from '@testing-library/react'
import type { Story } from '@tidel/api'
import type React from 'react'
import { vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: object) => ({
    useLoaderData: vi.fn(),
    ...config,
  }),
  Link: ({ children }: { children: React.ReactNode }) => children,
  useNavigate: () => vi.fn(),
  useSearch: () => ({ category: 'All', slot: 'morning' }),
}))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    validator: () => ({ handler: () => vi.fn() }),
    inputValidator: () => ({ handler: () => vi.fn() }),
    handler: () => vi.fn(),
  }),
}))

vi.mock('../trpc.js', () => ({
  createServerTrpcCaller: vi.fn(),
}))

const mockStory: Story = {
  id: '1',
  editionDate: '2024-01-01',
  editionSlot: 'morning',
  title: 'Test Story',
  description: null,
  summary: 'Summary text.',
  category: 'Technology',
  link: 'https://example.com',
  pubDate: null,
  source: 'example.com',
  position: 0,
  sourceCount: 1,
}

async function renderIndex(loaderData: Story[] | null | undefined) {
  const indexModule = await import('../routes/index.js')
  vi.spyOn(indexModule.Route, 'useLoaderData').mockReturnValue(loaderData as Story[])

  const { default: IndexPage } = indexModule
  render(<IndexPage />)
}

describe('Index page (App)', () => {
  it('shows not_ready state when data is null', async () => {
    await renderIndex(null)
    expect(screen.getByText(/no editions yet/i)).toBeTruthy()
  })

  it('renders story cards when data is present', async () => {
    await renderIndex([mockStory])
    expect(screen.getByRole('heading', { name: mockStory.title })).toBeTruthy()
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0)
  })
})

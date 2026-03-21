import { render, screen } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: object) => ({ useLoaderData: vi.fn(), ...config }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({ handler: () => vi.fn() }),
}))

vi.mock('../trpc.js', () => ({ createServerTrpcCaller: vi.fn() }))

import { formatArchiveDate, groupByDate, Route } from '../routes/archive.js'

type EditionEntry = { date: string; slot: string; storyCount: number }

async function renderArchive(loaderData: EditionEntry[]) {
  vi.spyOn(Route, 'useLoaderData').mockReturnValue(loaderData)
  const ArchivePage = (Route as any).component as React.ComponentType
  render(<ArchivePage />)
}

describe('formatArchiveDate', () => {
  it('includes the month name', () => {
    expect(formatArchiveDate('2024-03-15')).toContain('March')
  })

  it('includes the year', () => {
    expect(formatArchiveDate('2024-03-15')).toContain('2024')
  })

  it('includes the day of week', () => {
    expect(formatArchiveDate('2024-03-15')).toContain('Friday')
  })
})

describe('groupByDate', () => {
  it('groups editions on the same date together', () => {
    const editions: EditionEntry[] = [
      { date: '2024-01-01', slot: 'morning', storyCount: 12 },
      { date: '2024-01-01', slot: 'afternoon', storyCount: 9 },
    ]
    const result = groupByDate(editions)
    expect(result.get('2024-01-01')).toHaveLength(2)
  })

  it('keeps different dates in separate groups', () => {
    const editions: EditionEntry[] = [
      { date: '2024-01-02', slot: 'morning', storyCount: 12 },
      { date: '2024-01-01', slot: 'morning', storyCount: 11 },
    ]
    const result = groupByDate(editions)
    expect(result.size).toBe(2)
  })

  it('returns an empty map for an empty input', () => {
    expect(groupByDate([]).size).toBe(0)
  })
})

describe('ArchivePage', () => {
  it('renders "No editions yet" when data is empty', async () => {
    await renderArchive([])
    expect(screen.getByText(/No editions yet/)).not.toBeNull()
  })

  it('renders slot links for each edition entry', async () => {
    await renderArchive([
      { date: '2024-03-15', slot: 'morning', storyCount: 12 },
      { date: '2024-03-15', slot: 'afternoon', storyCount: 9 },
    ])
    expect(screen.getByText(/Morning/)).not.toBeNull()
    expect(screen.getByText(/Afternoon/)).not.toBeNull()
  })

  it('renders a formatted date label for each date group', async () => {
    await renderArchive([{ date: '2024-03-15', slot: 'morning', storyCount: 12 }])
    expect(screen.getByText(/March/)).not.toBeNull()
  })

  it('renders story counts alongside slot links', async () => {
    await renderArchive([{ date: '2024-03-15', slot: 'morning', storyCount: 12 }])
    expect(screen.getByText(/12/)).not.toBeNull()
  })
})

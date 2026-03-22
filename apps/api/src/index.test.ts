import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./pipeline.js', () => ({
  buildEdition: vi.fn().mockResolvedValue(undefined),
}))

import worker, { escapeXml } from './index.js'
import { buildEdition } from './pipeline.js'

const mockEnv = {
  DATABASE_URL: 'postgresql://test',
  ADMIN_SECRET: 'a'.repeat(32),
  WEB_ORIGIN: 'https://tidel.app',
  RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
}

function makeScheduledEvent(cron: string): ScheduledEvent {
  return {
    cron,
    scheduledTime: Date.now(),
    type: 'scheduled',
    waitUntil: vi.fn(),
  } as unknown as ScheduledEvent
}

describe('handleCron (scheduled handler)', () => {
  beforeEach(() => {
    vi.mocked(buildEdition).mockClear()
  })

  it('calls buildEdition with morning slot for 0 6 * * * cron', async () => {
    await worker.scheduled(makeScheduledEvent('0 6 * * *'), mockEnv as never)
    expect(buildEdition).toHaveBeenCalledOnce()
    expect(buildEdition).toHaveBeenCalledWith(mockEnv, 'morning')
  })

  it('calls buildEdition with afternoon slot for 0 15 * * * cron', async () => {
    await worker.scheduled(makeScheduledEvent('0 15 * * *'), mockEnv as never)
    expect(buildEdition).toHaveBeenCalledOnce()
    expect(buildEdition).toHaveBeenCalledWith(mockEnv, 'afternoon')
  })

  it('does not call buildEdition for an unknown cron expression', async () => {
    await worker.scheduled(makeScheduledEvent('0 8 * * *'), mockEnv as never)
    expect(buildEdition).not.toHaveBeenCalled()
  })

  it('calls both morning and afternoon when both crons match (independent checks)', async () => {
    await worker.scheduled(makeScheduledEvent('0 6 * * *'), mockEnv as never)
    await worker.scheduled(makeScheduledEvent('0 15 * * *'), mockEnv as never)
    expect(buildEdition).toHaveBeenCalledTimes(2)
    expect(buildEdition).toHaveBeenNthCalledWith(1, mockEnv, 'morning')
    expect(buildEdition).toHaveBeenNthCalledWith(2, mockEnv, 'afternoon')
  })
})

describe('escapeXml', () => {
  it('escapes ampersand', () => {
    expect(escapeXml('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than', () => {
    expect(escapeXml('<tag>')).toBe('&lt;tag&gt;')
  })

  it('escapes greater-than', () => {
    expect(escapeXml('a > b')).toBe('a &gt; b')
  })

  it('escapes double quote', () => {
    expect(escapeXml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('escapes single quote', () => {
    expect(escapeXml("it's")).toBe('it&apos;s')
  })

  it('escapes all special characters together', () => {
    expect(escapeXml('<a href="x&y">it\'s</a>')).toBe(
      '&lt;a href=&quot;x&amp;y&quot;&gt;it&apos;s&lt;/a&gt;',
    )
  })

  it('returns plain text unchanged', () => {
    expect(escapeXml('No special chars here')).toBe('No special chars here')
  })
})

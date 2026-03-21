import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { editionStaleTime, getEditionDate, msUntilNextEdition } from '../utils.js'

describe('getEditionDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the current day when time is after 06:00 UTC (edition already built)', () => {
    vi.setSystemTime(new Date('2024-03-06T10:00:00Z'))
    const date = getEditionDate()
    expect(date.getUTCFullYear()).toBe(2024)
    expect(date.getUTCMonth()).toBe(2)
    expect(date.getUTCDate()).toBe(6)
    expect(date.getUTCHours()).toBe(6)
  })

  it('returns the previous day when time is before 06:00 UTC (edition not yet built)', () => {
    vi.setSystemTime(new Date('2024-03-06T02:00:00Z'))
    const date = getEditionDate()
    expect(date.getUTCDate()).toBe(5)
  })

  it('returns the current day at exactly 06:00 UTC', () => {
    vi.setSystemTime(new Date('2024-03-06T06:00:00Z'))
    const date = getEditionDate()
    expect(date.getUTCDate()).toBe(6)
  })

  it('handles month boundaries correctly', () => {
    vi.setSystemTime(new Date('2024-03-01T01:00:00Z'))
    const date = getEditionDate()
    expect(date.getUTCMonth()).toBe(1)
    expect(date.getUTCDate()).toBe(29)
  })
})

describe('msUntilNextEdition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('always returns a positive number of milliseconds', () => {
    vi.setSystemTime(new Date('2024-03-06T10:00:00Z'))
    expect(msUntilNextEdition()).toBeGreaterThan(0)
  })

  it('returns ~20 hours when current time is 10:00 UTC', () => {
    vi.setSystemTime(new Date('2024-03-06T10:00:00Z'))
    const ms = msUntilNextEdition()
    const expected = 20 * 60 * 60 * 1000
    expect(Math.abs(ms - expected)).toBeLessThan(1000)
  })

  it('returns ~4 hours when current time is 02:00 UTC', () => {
    vi.setSystemTime(new Date('2024-03-06T02:00:00Z'))
    const ms = msUntilNextEdition()
    const expected = 4 * 60 * 60 * 1000
    expect(Math.abs(ms - expected)).toBeLessThan(1000)
  })
})

describe('editionStaleTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 5 minutes when data is null', () => {
    expect(editionStaleTime({ state: { data: null } })).toBe(5 * 60 * 1000)
  })

  it('returns 5 minutes when data is undefined', () => {
    expect(editionStaleTime({ state: { data: undefined } })).toBe(5 * 60 * 1000)
  })

  it('returns time until next edition when data is present', () => {
    vi.setSystemTime(new Date('2024-03-06T10:00:00Z'))
    const result = editionStaleTime({ state: { data: [{ id: '1' }] } })
    const expected = 20 * 60 * 60 * 1000
    expect(Math.abs(result - expected)).toBeLessThan(1000)
  })
})

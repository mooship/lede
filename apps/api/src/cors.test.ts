import { describe, expect, it } from 'vitest'
import { parseWebOrigins, resolveCorsOrigin } from './cors.js'

describe('parseWebOrigins', () => {
  it('returns a single origin unchanged', () => {
    expect(parseWebOrigins('https://example.com')).toEqual(['https://example.com'])
  })

  it('parses comma-separated origins and trims whitespace', () => {
    expect(parseWebOrigins('https://a.com, https://b.com ,https://c.com')).toEqual([
      'https://a.com',
      'https://b.com',
      'https://c.com',
    ])
  })

  it('removes empty entries', () => {
    expect(parseWebOrigins('https://a.com,, ,https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ])
  })
})

describe('resolveCorsOrigin', () => {
  it('returns request origin when it is allowed', () => {
    expect(resolveCorsOrigin('https://b.com', 'https://a.com,https://b.com')).toBe('https://b.com')
  })

  it('returns empty string when request origin is not allowed', () => {
    expect(resolveCorsOrigin('https://nope.com', 'https://a.com,https://b.com')).toBe('')
  })

  it('returns empty string when request has no origin header', () => {
    expect(resolveCorsOrigin(undefined, 'https://a.com,https://b.com')).toBe('')
  })
})

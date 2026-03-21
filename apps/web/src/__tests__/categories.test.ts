import { describe, expect, it } from 'vitest'
import { CATEGORY_CSS_VAR, CATEGORY_LABEL } from '../categories.js'

describe('CATEGORY_LABEL', () => {
  it('maps Technology to Tech', () => {
    expect(CATEGORY_LABEL.Technology).toBe('Tech')
  })

  it('maps Business / Economy to Business', () => {
    expect(CATEGORY_LABEL['Business / Economy']).toBe('Business')
  })

  it('maps World to World', () => {
    expect(CATEGORY_LABEL.World).toBe('World')
  })

  it('maps Science to Science', () => {
    expect(CATEGORY_LABEL.Science).toBe('Science')
  })

  it('maps Sport to Sport', () => {
    expect(CATEGORY_LABEL.Sport).toBe('Sport')
  })
})

describe('CATEGORY_CSS_VAR', () => {
  it('maps World to a CSS variable', () => {
    expect(CATEGORY_CSS_VAR.World).toBe('var(--colors-world)')
  })

  it('maps Technology to a CSS variable', () => {
    expect(CATEGORY_CSS_VAR.Technology).toMatch(/^var\(/)
  })

  it('maps Science to a CSS variable', () => {
    expect(CATEGORY_CSS_VAR.Science).toMatch(/^var\(/)
  })

  it('maps Business / Economy to a CSS variable', () => {
    expect(CATEGORY_CSS_VAR['Business / Economy']).toMatch(/^var\(/)
  })

  it('maps Sport to a CSS variable', () => {
    expect(CATEGORY_CSS_VAR.Sport).toMatch(/^var\(/)
  })

  it('has a var entry for all 5 categories', () => {
    const categories = ['World', 'Technology', 'Science', 'Business / Economy', 'Sport'] as const
    for (const cat of categories) {
      expect(CATEGORY_CSS_VAR[cat]).toMatch(/^var\(/)
    }
  })
})

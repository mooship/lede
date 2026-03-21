import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SkeletonCard } from '../components/SkeletonCard.js'

describe('SkeletonCard', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.firstChild).not.toBeNull()
  })

  it('has aria-hidden to hide from screen readers', () => {
    const { container } = render(<SkeletonCard />)
    const card = container.querySelector('[aria-hidden]')
    expect(card?.getAttribute('aria-hidden')).toBe('true')
  })

  it('renders 4 shimmer elements', () => {
    const { container } = render(<SkeletonCard />)
    const card = container.querySelector('[aria-hidden="true"]')
    expect(card?.children.length).toBe(4)
  })
})

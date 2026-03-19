import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Category } from '@tidel/api'
import { useState } from 'react'
import { CategoryNav } from '../components/CategoryNav.js'

type Tab = Category | 'All'

function Wrapper() {
  const [active, setActive] = useState<Tab>('All')
  return (
    <div>
      <CategoryNav active={active} onChange={setActive} />
      <div data-testid="active">{active}</div>
    </div>
  )
}

describe('CategoryNav', () => {
  it('renders all category tabs', () => {
    render(<Wrapper />)
    expect(screen.getByRole('tab', { name: 'All' })).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'World' })).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Technology' })).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Science' })).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Business' })).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Sport' })).not.toBeNull()
  })

  it('defaults to All selected', () => {
    render(<Wrapper />)
    expect(screen.getByRole('tab', { name: 'All' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByTestId('active').textContent).toBe('All')
  })

  it('updates active filter on tab click', async () => {
    render(<Wrapper />)
    await userEvent.click(screen.getByRole('tab', { name: 'Technology' }))
    expect(screen.getByTestId('active').textContent).toBe('Technology')
    expect(screen.getByRole('tab', { name: 'Technology' }).getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(screen.getByRole('tab', { name: 'All' }).getAttribute('aria-selected')).toBe('false')
  })

  it('moves selection with ArrowRight key', async () => {
    render(<Wrapper />)
    screen.getByRole('tab', { name: 'All' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByTestId('active').textContent).toBe('World')
  })

  it('moves selection with ArrowLeft key wrapping to last tab', async () => {
    render(<Wrapper />)
    screen.getByRole('tab', { name: 'All' }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByTestId('active').textContent).toBe('Sport')
  })
})

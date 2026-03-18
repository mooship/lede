import type { Category } from '@lede/api'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'World / Politics' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Technology' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Science' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Business / Economy' })).toBeInTheDocument()
  })

  it('defaults to All', () => {
    render(<Wrapper />)
    expect(screen.getByTestId('active')).toHaveTextContent('All')
  })

  it('updates active filter on tab click', async () => {
    render(<Wrapper />)
    await userEvent.click(screen.getByRole('button', { name: 'Technology' }))
    expect(screen.getByTestId('active')).toHaveTextContent('Technology')
  })
})

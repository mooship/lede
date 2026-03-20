import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SlotSwitcher } from '../components/SlotSwitcher.js'

describe('SlotSwitcher', () => {
  it('renders Morning and Afternoon buttons', () => {
    render(<SlotSwitcher activeSlot="morning" onSlotChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /morning/i })).not.toBeNull()
    expect(screen.getByRole('button', { name: /afternoon/i })).not.toBeNull()
  })

  it('marks the active slot button with aria-pressed true', () => {
    render(<SlotSwitcher activeSlot="morning" onSlotChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /morning/i }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    expect(screen.getByRole('button', { name: /afternoon/i }).getAttribute('aria-pressed')).toBe(
      'false',
    )
  })

  it('calls onSlotChange with "afternoon" when afternoon button is clicked and available', () => {
    const onChange = vi.fn()
    render(<SlotSwitcher activeSlot="morning" onSlotChange={onChange} afternoonAvailable={true} />)
    fireEvent.click(screen.getByRole('button', { name: /afternoon/i }))
    expect(onChange).toHaveBeenCalledWith('afternoon')
  })

  it('calls onSlotChange with "morning" when morning button is clicked', () => {
    const onChange = vi.fn()
    render(<SlotSwitcher activeSlot="afternoon" onSlotChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /morning/i }))
    expect(onChange).toHaveBeenCalledWith('morning')
  })

  it('does not call onSlotChange when disabled afternoon button is clicked', () => {
    const onChange = vi.fn()
    render(<SlotSwitcher activeSlot="morning" onSlotChange={onChange} afternoonAvailable={false} />)
    fireEvent.click(screen.getByRole('button', { name: /afternoon/i }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows tooltip on disabled afternoon button', () => {
    render(<SlotSwitcher activeSlot="morning" onSlotChange={vi.fn()} afternoonAvailable={false} />)
    expect(screen.getByRole('button', { name: /afternoon/i }).getAttribute('title')).toBe(
      'Available at 14:00 SAST',
    )
  })

  it('afternoon button has aria-disabled when not available', () => {
    render(<SlotSwitcher activeSlot="morning" onSlotChange={vi.fn()} afternoonAvailable={false} />)
    expect(screen.getByRole('button', { name: /afternoon/i }).getAttribute('aria-disabled')).toBe(
      'true',
    )
  })
})

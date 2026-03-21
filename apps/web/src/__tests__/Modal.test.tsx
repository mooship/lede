import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from '../components/Modal.js'

function renderModal(overrides: Partial<Parameters<typeof Modal>[0]> = {}) {
  const defaults = {
    title: 'Are you sure?',
    message: 'This action cannot be undone.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }
  render(<Modal {...defaults} {...overrides} />)
  return { ...defaults, ...overrides }
}

describe('Modal', () => {
  it('renders the title', () => {
    renderModal({ title: 'Delete edition' })
    expect(screen.getByText('Delete edition')).not.toBeNull()
  })

  it('renders the message', () => {
    renderModal({ message: 'All articles will be removed.' })
    expect(screen.getByText('All articles will be removed.')).not.toBeNull()
  })

  it('renders default Confirm and Cancel labels', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toBeNull()
  })

  it('renders custom confirmLabel and cancelLabel', () => {
    renderModal({ confirmLabel: 'Rebuild', cancelLabel: 'Go back' })
    expect(screen.getByRole('button', { name: 'Rebuild' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Go back' })).not.toBeNull()
  })

  it('calls onConfirm when Confirm button is clicked', () => {
    const onConfirm = vi.fn()
    renderModal({ onConfirm })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn()
    renderModal({ onCancel })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn()
    renderModal({ onCancel })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('has role alertdialog', () => {
    renderModal()
    expect(screen.getByRole('alertdialog')).not.toBeNull()
  })

  it('has aria-modal true', () => {
    renderModal()
    expect(screen.getByRole('alertdialog').getAttribute('aria-modal')).toBe('true')
  })
})

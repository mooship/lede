import { useEffect, useRef } from 'react'
import { css } from '../../styled-system/css'

const overlayClass = css({
  position: 'fixed',
  inset: '0',
  bg: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: '1000',
  px: '6',
  border: 'none',
  cursor: 'default',
  appearance: 'none',
  width: '100%',
})

const dialogClass = css({
  bg: 'surface',
  border: '1px solid',
  borderColor: 'border',
  maxWidth: '480px',
  width: '100%',
  p: '8',
})

const titleClass = css({
  fontFamily: 'display',
  fontWeight: '800',
  fontSize: '1rem',
  color: 'textPrimary',
  letterSpacing: '-0.02em',
  margin: '0 0 4 0',
})

const messageClass = css({
  fontFamily: 'body',
  fontSize: '0.9rem',
  color: 'textMuted',
  lineHeight: '1.5',
  margin: '0 0 8 0',
})

const buttonRowClass = css({
  display: 'flex',
  gap: '3',
  justifyContent: 'flex-end',
})

const cancelButtonClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'textMuted',
  bg: 'transparent',
  border: '1px solid',
  borderColor: 'border',
  cursor: 'pointer',
  px: '5',
  py: '2',
  _hover: { color: 'textPrimary', borderColor: 'textMuted' },
})

const confirmButtonClass = css({
  fontFamily: 'display',
  fontSize: '0.65rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'textPrimary',
  bg: 'surface',
  border: '1px solid',
  borderColor: 'world',
  cursor: 'pointer',
  px: '5',
  py: '2',
  _hover: { bg: 'surfaceHigh' },
})

type ModalProps = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function Modal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <button
      type="button"
      className={overlayClass}
      onClick={onCancel}
      tabIndex={-1}
      aria-label="Close modal"
    >
      <div
        className={dialogClass}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
      >
        <p id="modal-title" className={titleClass}>
          {title}
        </p>
        <p id="modal-message" className={messageClass}>
          {message}
        </p>
        <div className={buttonRowClass}>
          <button type="button" className={cancelButtonClass} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmButtonClass} onClick={onConfirm} ref={confirmRef}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </button>
  )
}

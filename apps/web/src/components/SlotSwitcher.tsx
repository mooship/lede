import { css } from '../../styled-system/css'

const wrapperClass = css({
  width: '100%',
  borderBottom: '1px solid',
  borderColor: 'border',
  bg: 'bg',
})

const innerClass = css({
  maxWidth: '1400px',
  mx: 'auto',
  px: '8',
  display: 'flex',
  gap: '0',
})

const pillBase = css({
  fontFamily: 'display',
  fontSize: '0.7rem',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  marginBottom: '-1px',
  px: '5',
  py: '3',
  cursor: 'pointer',
  transition: 'color 0.15s',
  lineHeight: '1',
})

const pillActiveClass = css({
  color: 'textPrimary',
  borderBottomColor: 'textPrimary',
})

const pillInactiveClass = css({
  color: 'textMuted',
  '&:hover': { color: 'textLight' },
})

const pillDisabledClass = css({
  color: 'textDim',
  cursor: 'not-allowed',
})

interface SlotSwitcherProps {
  activeSlot: 'morning' | 'afternoon'
  onSlotChange: (slot: 'morning' | 'afternoon') => void
  afternoonAvailable?: boolean
}

export function SlotSwitcher({
  activeSlot,
  onSlotChange,
  afternoonAvailable = true,
}: SlotSwitcherProps) {
  return (
    <div className={wrapperClass}>
      <fieldset style={{ border: 'none', padding: 0, margin: 0, width: '100%' }}>
        <div className={innerClass}>
          <button
            type="button"
            className={`${pillBase} ${activeSlot === 'morning' ? pillActiveClass : pillInactiveClass}`}
            onClick={() => onSlotChange('morning')}
            aria-pressed={activeSlot === 'morning'}
          >
            Morning
          </button>
          <button
            type="button"
            className={`${pillBase} ${
              !afternoonAvailable
                ? pillDisabledClass
                : activeSlot === 'afternoon'
                  ? pillActiveClass
                  : pillInactiveClass
            }`}
            onClick={() => {
              if (afternoonAvailable) onSlotChange('afternoon')
            }}
            aria-pressed={activeSlot === 'afternoon'}
            aria-disabled={!afternoonAvailable}
            title={!afternoonAvailable ? 'Available at 14:00 SAST' : undefined}
          >
            Afternoon
          </button>
        </div>
      </fieldset>
    </div>
  )
}

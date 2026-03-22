import { css, cx } from '../../styled-system/css'
import { afternoonLocalTime } from '../utils.js'

const wrapperClass = css({
  width: '100%',
  borderBottom: '1px solid',
  borderColor: 'border',
  bg: 'bg',
  px: { base: '4', md: '8' },
  py: '3',
})

const innerClass = css({
  maxWidth: '1400px',
  mx: 'auto',
  display: 'flex',
  justifyContent: { base: 'center', md: 'flex-start' },
})

const segmentWrapClass = css({
  display: 'inline-flex',
  bg: 'surfaceHigh',
  borderRadius: '10px',
  padding: '3px',
})

const pillBase = css({
  fontFamily: 'display',
  fontSize: '0.7rem',
  fontWeight: '700',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'none',
  border: 'none',
  borderRadius: '8px',
  px: '5',
  py: '2',
  cursor: 'pointer',
  transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
  lineHeight: '1.6',
  minWidth: '80px',
  textAlign: 'center',
  color: 'textMuted',
})

const pillActiveClass = css({
  bg: 'surface',
  color: 'textPrimary',
  boxShadow: '0 1px 3px token(colors.border)',
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
      <div className={innerClass}>
        <div className={segmentWrapClass}>
          <button
            type="button"
            className={cx(pillBase, activeSlot === 'morning' && pillActiveClass)}
            onClick={() => onSlotChange('morning')}
            aria-pressed={activeSlot === 'morning'}
          >
            Morning
          </button>
          <button
            type="button"
            className={cx(
              pillBase,
              !afternoonAvailable
                ? pillDisabledClass
                : activeSlot === 'afternoon' && pillActiveClass,
            )}
            onClick={() => {
              if (afternoonAvailable) {
                onSlotChange('afternoon')
              }
            }}
            aria-pressed={activeSlot === 'afternoon'}
            aria-disabled={!afternoonAvailable}
            title={!afternoonAvailable ? `Available at ${afternoonLocalTime()}` : undefined}
          >
            Afternoon
          </button>
        </div>
      </div>
    </div>
  )
}

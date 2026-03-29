import { css } from '../../styled-system/css'
import { segmentControlWrap, segmentPill } from '../../styled-system/recipes'
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
        <div className={segmentControlWrap()}>
          <button
            type="button"
            className={segmentPill({ selected: activeSlot === 'morning', size: 'fixed' })}
            onClick={() => onSlotChange('morning')}
            aria-pressed={activeSlot === 'morning'}
          >
            Morning
          </button>
          <button
            type="button"
            className={segmentPill({
              selected: afternoonAvailable && activeSlot === 'afternoon',
              disabled: !afternoonAvailable,
              size: 'fixed',
            })}
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

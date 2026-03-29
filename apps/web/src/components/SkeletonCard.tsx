import { css, cx } from '../../styled-system/css'

const cardClass = css({
  bg: 'surface',
  padding: '6',
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  minHeight: '120px',
})

const shimmerBase = css({
  bg: 'surfaceHigh',
  borderRadius: '2px',
  animation: 'tidel-pulse 1.8s ease-in-out infinite',
})

const badge = css({ width: '60px', height: '14px' })
const line1 = css({ width: '90%', height: '18px' })
const line2 = css({ width: '70%', height: '18px' })
const source = css({ width: '40%', height: '13px', marginTop: '1' })

export function SkeletonCard() {
  return (
    <div className={cardClass} aria-hidden="true">
      <div className={cx(shimmerBase, badge)} />
      <div className={cx(shimmerBase, line1)} />
      <div className={cx(shimmerBase, line2)} />
      <div className={cx(shimmerBase, source)} />
    </div>
  )
}

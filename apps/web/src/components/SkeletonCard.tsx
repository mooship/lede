import { css } from '../../styled-system/css'

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
})

const badge = css({ width: '60px', height: '14px' })
const line1 = css({ width: '90%', height: '18px' })
const line2 = css({ width: '70%', height: '18px' })
const source = css({ width: '40%', height: '13px', marginTop: '1' })

const pulseStyle: React.CSSProperties = {
  animation: 'tidel-pulse 1.8s ease-in-out infinite',
}

export function SkeletonCard() {
  return (
    <div className={cardClass} aria-hidden="true">
      <div className={`${shimmerBase} ${badge}`} style={pulseStyle} />
      <div className={`${shimmerBase} ${line1}`} style={pulseStyle} />
      <div className={`${shimmerBase} ${line2}`} style={pulseStyle} />
      <div className={`${shimmerBase} ${source}`} style={pulseStyle} />
    </div>
  )
}

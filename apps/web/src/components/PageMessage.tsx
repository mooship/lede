import { css } from '../../styled-system/css'

type Props = {
  message: string
  variant?: 'loading' | 'serif'
  color?: string
}

const wrapClass = css({
  minHeight: '100vh',
  bg: 'bg',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

const loadingClass = css({
  fontFamily: 'display',
  fontSize: '0.75rem',
  fontWeight: '700',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'textDim',
})

const serifClass = css({
  fontFamily: 'body',
  fontSize: '1rem',
  color: 'textMuted',
})

export function PageMessage({ message, variant = 'serif', color }: Props) {
  const textClass = variant === 'loading' ? loadingClass : serifClass
  return (
    <div className={wrapClass}>
      <p
        className={textClass}
        role="status"
        aria-live="polite"
        style={color ? { color } : undefined}
      >
        {message}
      </p>
    </div>
  )
}

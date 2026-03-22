import { css } from '../../styled-system/css'

type Props = {
  message: string
  variant?: 'loading' | 'serif' | 'error'
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

const errorClass = css({
  fontFamily: 'body',
  fontSize: '1rem',
  color: 'world',
})

export function PageMessage({ message, variant = 'serif' }: Props) {
  const textClass =
    variant === 'loading' ? loadingClass : variant === 'error' ? errorClass : serifClass
  return (
    <div className={wrapClass}>
      <output className={textClass} aria-live="polite">
        {message}
      </output>
    </div>
  )
}

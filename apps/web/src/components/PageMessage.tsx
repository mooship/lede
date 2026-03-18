type Props = {
  message: string
  variant?: 'loading' | 'serif'
  color?: string
}

export function PageMessage({ message, variant = 'serif', color }: Props) {
  const textStyle =
    variant === 'loading'
      ? {
          fontFamily: "'Syne Variable', 'Syne', sans-serif",
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase' as const,
          color: color ?? '#444444',
        }
      : {
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: '1rem',
          color: color ?? '#888888',
        }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p style={textStyle}>{message}</p>
    </div>
  )
}

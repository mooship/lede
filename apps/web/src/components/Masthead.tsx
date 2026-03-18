export function Masthead() {
  const now = new Date()

  const dayName = now.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateLine = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header
      style={{
        width: '100%',
        borderBottom: '1px solid #2e2e2e',
        backgroundColor: '#0f0f0f',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Syne Variable', 'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              color: '#f0f0f0',
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
            }}
          >
            Lede
          </h1>
          <p
            style={{
              fontFamily: "'Syne Variable', 'Syne', sans-serif",
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: '#444444',
              textTransform: 'uppercase',
              margin: '0.4rem 0 0 0.1rem',
            }}
          >
            Daily Edition
          </p>
        </div>

        <div
          style={{
            textAlign: 'right',
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: '0.85rem',
            color: '#888888',
            lineHeight: 1.5,
          }}
        >
          <div>{dayName}</div>
          <div>{dateLine}</div>
        </div>
      </div>
    </header>
  )
}

import { useEffect, useState } from 'react'
import { msUntilNextEdition } from '../utils.js'

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function nextEditionLocalTime(): string {
  const next = new Date()
  next.setUTCHours(4, 0, 0, 0)
  if (next <= new Date()) next.setUTCDate(next.getUTCDate() + 1)
  return next.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function isBeforeEdition(): boolean {
  const now = new Date()
  return now.getUTCHours() < 4
}

export function NextEditionBanner() {
  const [ms, setMs] = useState(msUntilNextEdition)

  useEffect(() => {
    const id = setInterval(() => setMs(msUntilNextEdition()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!isBeforeEdition()) return null

  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem',
      }}
    >
      <p
        style={{
          fontFamily: "'Syne Variable', 'Syne', sans-serif",
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#444444',
          margin: '1.25rem 0 0',
        }}
      >
        Showing yesterday's edition — next at {nextEditionLocalTime()} in {formatCountdown(ms)}
      </p>
    </div>
  )
}

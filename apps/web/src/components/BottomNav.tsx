import { Link, useRouterState } from '@tanstack/react-router'
import { css, cx } from '../../styled-system/css'

const navClass = css({
  position: 'fixed',
  bottom: '0',
  left: '0',
  right: '0',
  zIndex: '50',
  borderTop: '1px solid',
  borderColor: 'border',
  display: { base: 'flex', md: 'none' },
  paddingBottom: 'env(safe-area-inset-bottom)',
})

const tabClass = css({
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1',
  py: '2',
  minHeight: '49px',
  textDecoration: 'none',
  color: 'textMuted',
  fontFamily: 'display',
  fontSize: '0.55rem',
  fontWeight: '700',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  transition: 'color 0.15s, transform 0.1s',
  _active: { transform: 'scale(0.9)' },
})

const tabActiveClass = css({ color: 'textPrimary' })

function IconToday() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 10h16M4 14h10M4 18h6" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function IconArchive() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="4" rx="1" />
      <path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7" />
      <path d="M10 11h4" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

const TABS = [
  { to: '/', label: 'Today', Icon: IconToday, exact: true },
  { to: '/search', label: 'Search', Icon: IconSearch, exact: false },
  { to: '/archive', label: 'Archive', Icon: IconArchive, exact: false },
  { to: '/settings', label: 'Settings', Icon: IconSettings, exact: false },
] as const

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav
      className={navClass}
      aria-label="Main navigation"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--colors-bg) 88%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {TABS.map(({ to, label, Icon, exact }) => {
        const isActive = exact ? pathname === to : pathname.startsWith(to)
        return (
          <Link
            key={to}
            to={to}
            className={cx(tabClass, isActive && tabActiveClass)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

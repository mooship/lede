import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'
type Font = 'default' | 'opendyslexic'

interface SettingsContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  font: Font
  setFont: (f: Font) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  theme: 'system',
  setTheme: () => {},
  font: 'default',
  setFont: () => {},
})

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', resolveTheme(theme))
}

function applyFont(font: Font) {
  if (font === 'opendyslexic') {
    document.documentElement.setAttribute('data-font', 'opendyslexic')
  } else {
    document.documentElement.removeAttribute('data-font')
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [font, setFontState] = useState<Font>('default')

  useEffect(() => {
    const savedTheme = localStorage.getItem('tidel-theme') as Theme | null
    const savedFont = localStorage.getItem('tidel-font') as Font | null
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    }
    if (savedFont === 'opendyslexic' || savedFont === 'default') {
      setFontState(savedFont)
      applyFont(savedFont)
    }
  }, [])

  useEffect(() => {
    if (theme !== 'system') {
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
    localStorage.setItem('tidel-theme', t)
    applyTheme(t)
  }

  function setFont(f: Font) {
    setFontState(f)
    localStorage.setItem('tidel-font', f)
    applyFont(f)
  }

  return (
    <SettingsContext.Provider value={{ theme, setTheme, font, setFont }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}

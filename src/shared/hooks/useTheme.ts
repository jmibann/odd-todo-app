import { useCallback, useEffect, useState } from 'react'
import { loadItem, saveItem } from '../storage.ts'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'theme'

function systemTheme(): Theme {
  if (typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Theme state for the whole app (AGENTS.md B5):
 * follows the OS by default, a user override is persisted through
 * src/shared/storage.ts and wins over the OS on the next load.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [stored, setStored] = useState<Theme | null>(() =>
    loadItem<Theme | null>(THEME_KEY, null),
  )
  const [preferred, setPreferred] = useState<Theme>(systemTheme)
  const theme: Theme = stored ?? preferred

  // Follow OS changes only while the user has not overridden.
  useEffect(() => {
    if (stored !== null || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      setPreferred(event.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [stored])

  // Reflect the theme on <html> so the token blocks in tokens.css apply.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    saveItem(THEME_KEY, next)
    setStored(next)
  }, [theme])

  return { theme, toggleTheme }
}

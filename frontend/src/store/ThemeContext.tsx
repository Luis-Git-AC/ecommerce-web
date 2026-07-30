/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'ecommerce.theme'

type ThemeContextValue = {
  preference: ThemePreference
  theme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'

const readStoredPreference = (): ThemePreference => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

const getSystemTheme = (): ResolvedTheme =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const theme: ResolvedTheme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // noop
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark')
  }, [setPreference, theme])

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, theme, setPreference, toggleTheme }),
    [preference, setPreference, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'sankalp:theme'

type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (pref: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyTheme(preference: ThemePreference) {
  const root = document.documentElement
  if (preference === 'system') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', preference)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? 'system'
  })

  useEffect(() => {
    applyTheme(preference)
  }, [preference])

  function setPreference(pref: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, pref)
    setPreferenceState(pref)
  }

  return <ThemeContext.Provider value={{ preference, setPreference }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

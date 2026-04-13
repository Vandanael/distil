'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, type Locale, type Translations } from './translations'

const COOKIE_KEY = 'locale'
const DEFAULT: Locale = 'fr'

interface LocaleContextValue {
  locale: Locale
  t: Translations
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT,
  t: translations[DEFAULT],
  setLocale: () => {},
})

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? DEFAULT)

  useEffect(() => {
    // Hydratation : lire le cookie si pas de valeur initiale server-side
    if (!initialLocale) {
      const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/)
      const stored = match?.[1]
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === 'fr' || stored === 'en') setLocaleState(stored)
    }
  }, [initialLocale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    document.cookie = `${COOKIE_KEY}=${l};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}

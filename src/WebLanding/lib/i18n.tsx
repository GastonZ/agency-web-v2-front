
import React, { createContext, useContext, useState } from 'react'
import esTranslations from './translations/es.json'
import enTranslations from './translations/en.json'

type Language = 'es' | 'en'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => any
  availableLanguages: { code: Language; name: string; flag: string }[]
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const translations = {
  es: esTranslations,
  en: enTranslations,
}

const availableLanguages = [
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
]

// Función para obtener valores anidados usando notación de punto
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return current[key]
    }
    return undefined
  }, obj)
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es')

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('datacivis-language', lang)
    document.documentElement.lang = lang === 'en' ? 'en-US' : 'es-ES'
  }

  const t = (key: string): any => {
    return getNestedValue(translations[language], key)
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
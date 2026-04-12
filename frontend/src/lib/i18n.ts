/**
 * i18n.ts
 * react-i18next configuration for piClinic.
 *
 * Supported languages: English ('en'), Spanish ('es').
 * The active language is persisted to localStorage under 'piclinic:lang'
 * so it survives page refreshes without a round-trip to the server.
 *
 * Usage in components:
 *   const { t } = useTranslation()
 *   t('LOGIN_USERNAME')  // -> 'Username' or 'Usuario'
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../locales/en.json'
import es from '../locales/es.json'

const STORAGE_KEY = 'piclinic:lang'
const DEFAULT_LANG = 'en'
const SUPPORTED = ['en', 'es']

function detectLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED.includes(stored)) return stored
  const browser = navigator.language.slice(0, 2).toLowerCase()
  return SUPPORTED.includes(browser) ? browser : DEFAULT_LANG
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: detectLanguage(),
    fallbackLng: DEFAULT_LANG,
    interpolation: {
      escapeValue: false, // React escapes by default
    },
  })

// Persist language choice whenever it changes
i18n.on('languageChanged', (lang) => {
  localStorage.setItem(STORAGE_KEY, lang)
})

export default i18n

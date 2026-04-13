/**
 * test/setup.ts
 *
 * Global test setup for Vitest + React Testing Library.
 * Imported before every test suite via vite.config.ts `test.setupFiles`.
 *
 * - Imports jest-dom matchers so tests can use expect(...).toBeInTheDocument()
 * - Cleans up after each test to prevent state leakage between tests
 * - Mocks react-i18next so components render without needing real translation files
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Automatically unmount components and remove event listeners after each test
afterEach(() => {
  cleanup()
})

// Mock react-i18next so components that call useTranslation() work in tests
// without loading locale files. Returns the key as the translation value,
// which makes assertions readable: expect(screen.getByText('LOGIN_SUBMIT')).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

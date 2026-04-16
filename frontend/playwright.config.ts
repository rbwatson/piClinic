/**
 * playwright.config.ts
 * Playwright E2E test configuration for piClinic frontend.
 *
 * Tests run against a locally deployed instance by default.
 * Set E2E_BASE_URL in frontend/e2e/.env.e2e to target another host.
 *
 * Run from frontend/:
 *   npx playwright test
 *   npx playwright test --ui
 *   npx playwright test e2e/specs/visitEdit
 */

import { defineConfig, devices } from '@playwright/test'
import { config }                from 'dotenv'
import path                      from 'path'
import { fileURLToPath }         from 'url'

// __dirname is not available in ESM — derive it from import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

// Load E2E environment variables before the config object is evaluated
config({ path: path.resolve(__dirname, 'e2e/.env.e2e') })

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost'

export default defineConfig({
  testDir:       './e2e/specs',
  fullyParallel: false,   // tests share DB state — run serially
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? 1 : 0,
  reporter:      'list',

  use: {
    baseURL,
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'off',
  },

  projects: [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
  ],
})

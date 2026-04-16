/**
 * playwright.config.ts
 * Playwright E2E test configuration for piClinic frontend.
 *
 * Tests run against a locally deployed instance by default.
 * Set E2E_BASE_URL in frontend/e2e/.env.e2e to target another host.
 *
 * Run:  npx playwright test
 *       npx playwright test --ui           (interactive)
 *       npx playwright test specs/visitEdit (single spec)
 */

import { defineConfig, devices } from '@playwright/test'
import { config }                from 'dotenv'
import path                      from 'path'

// Load E2E environment variables so they are available in tests via process.env
config({ path: path.resolve(import.meta.dirname, 'e2e/.env.e2e') })

export default defineConfig({
  testDir:   './e2e/specs',
  fullyParallel: false,   // tests share DB state; run serially
  forbidOnly: !!process.env.CI,
  retries:    process.env.CI ? 1 : 0,
  reporter:   'list',

  use: {
    baseURL:       process.env.E2E_BASE_URL ?? 'http://localhost',
    trace:         'on-first-retry',
    screenshot:    'only-on-failure',
    video:         'off',
  },

  projects: [
    {
      name:  'chromium',
      use:   { ...devices['Desktop Chrome'] },
    },
  ],
})

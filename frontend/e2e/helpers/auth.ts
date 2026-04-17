/**
 * auth.ts
 * Logs in via the piClinic API and returns a session token.
 * Used by API helpers that need auth for setup/teardown.
 *
 * Also exports a uiLogin helper that drives the UI login form
 * for tests that need a real browser session.
 */

import type { Page } from '@playwright/test'
import { env } from './env.js'

export interface Session {
  token:    string
  username: string
}

export async function login(): Promise<Session> {
  const res = await fetch(`${env.baseUrl}/api/v2/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      username: env.test.username,
      password: env.test.password,
    }),
  })

  if (!res.ok) {
    throw new Error(`E2E login failed: ${res.status} ${await res.text()}`)
  }

  const body = await res.json()
  return { token: body.data.token, username: body.data.username }
}

export async function logout(token: string): Promise<void> {
  await fetch(`${env.baseUrl}/api/v2/auth/logout`, {
    method:  'POST',
    headers: { 'X-Session-Token': token },
  })
}

/**
 * Log in through the UI login form and wait for the dashboard to load.
 * Uses the same credentials as the API login.
 *
 * Waits for networkidle after navigation to ensure the React app has
 * fully bootstrapped before interacting with form elements.
 */
export async function uiLogin(page: Page): Promise<void> {
  await page.goto('/login')
  // Wait for the React app to fully render before interacting
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('#username', { timeout: 10000 })

  // Clear and fill to avoid residual values from previous test runs
  await page.locator('#username').clear()
  await page.locator('#username').fill(env.test.username)
  await page.locator('#password').clear()
  await page.locator('#password').fill(env.test.password)

  // Verify values were entered before submitting
  const usernameValue = await page.locator('#username').inputValue()
  const passwordValue = await page.locator('#password').inputValue()
  if (!usernameValue || !passwordValue) {
    throw new Error(`E2E uiLogin: credentials not filled — username="${usernameValue}" password="${passwordValue ? '[set]' : '[empty]'}"`)
  }

  await page.locator('button[type="submit"]').click()

  // Wait for navigation away from /login
  await page.waitForFunction(
    () => !window.location.pathname.startsWith('/login'),
    { timeout: 15000 }
  )
}

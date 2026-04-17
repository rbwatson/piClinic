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
 *
 * Uses pressSequentially() instead of fill() to fire React onChange events
 * on each keystroke — fill() sets the native value directly and React's
 * controlled input re-renders back to empty on the next state update.
 */
export async function uiLogin(page: Page): Promise<void> {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('#username', { timeout: 10000 })

  // Click to focus, then type character by character to trigger React onChange
  await page.locator('#username').click()
  await page.locator('#username').pressSequentially(env.test.username)

  await page.locator('#password').click()
  await page.locator('#password').pressSequentially(env.test.password)

  // Verify values are set in React state before submitting
  const usernameValue = await page.locator('#username').inputValue()
  const passwordValue = await page.locator('#password').inputValue()
  if (!usernameValue || !passwordValue) {
    throw new Error(
      `E2E uiLogin: credentials not set — ` +
      `username="${usernameValue}" password="${passwordValue ? '[set]' : '[empty]'}"`
    )
  }

  await page.locator('button[type="submit"]').click()

  // Wait for navigation away from /login
  await page.waitForFunction(
    () => !window.location.pathname.startsWith('/login'),
    { timeout: 15000 }
  )
}

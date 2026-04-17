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
 */
export async function uiLogin(page: Page): Promise<void> {
  await page.goto('/login')
  await page.waitForSelector('#username', { timeout: 10000 })
  await page.locator('#username').fill(env.test.username)
  await page.locator('#password').fill(env.test.password)
  await page.locator('button[type="submit"]').click()
  // Wait for navigation away from /login — dashboard or any authenticated page
  await page.waitForFunction(
    () => !window.location.pathname.startsWith('/login'),
    { timeout: 15000 }
  )
}
